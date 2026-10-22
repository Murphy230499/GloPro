'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { 
  Building2, ZoomIn, ZoomOut, RotateCcw, 
  Layers, User, Scissors, Clock, AlertCircle, 
  CheckCircle2, Sparkles, Compass
} from 'lucide-react';
import { useT } from '@/lib/i18n';

// Bảng màu trạng thái chuẩn GloPro (Tuân thủ nghiêm ngặt quy tắc No-Purple)
const STATUS_CONFIG = {
  available: {
    label: 'Đang trống',
    hex: 0x10b981, // Emerald 500
    cssDot: 'bg-emerald-500',
    cssBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cssGlow: 'rgba(16, 185, 129, 0.4)'
  },
  waiting: {
    label: 'Chờ phục vụ',
    hex: 0x3b82f6, // Blue 500
    cssDot: 'bg-blue-500',
    cssBadge: 'bg-blue-50 text-blue-700 border-blue-200',
    cssGlow: 'rgba(59, 130, 246, 0.4)'
  },
  reserved: {
    label: 'Đặt trước',
    hex: 0xf59e0b, // Amber 500
    cssDot: 'bg-amber-500',
    cssBadge: 'bg-amber-50 text-amber-700 border-amber-200',
    cssGlow: 'rgba(245, 158, 11, 0.4)'
  },
  in_progress: {
    label: 'Đang bận',
    hex: 0xf43f5e, // Rose 500
    cssDot: 'bg-rose-500',
    cssBadge: 'bg-rose-50 text-rose-700 border-rose-200',
    cssGlow: 'rgba(244, 63, 94, 0.4)'
  },
  nearly_finished: {
    label: 'Sắp trống',
    hex: 0xfbbf24, // Amber 400
    cssDot: 'bg-amber-400',
    cssBadge: 'bg-amber-50 text-amber-800 border-amber-300',
    cssGlow: 'rgba(251, 191, 36, 0.4)'
  },
  overtime: {
    label: 'Quá giờ',
    hex: 0xe11d48, // Rose 600 (Vivid Red-Rose alert)
    cssDot: 'bg-rose-600 animate-ping',
    cssBadge: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    cssGlow: 'rgba(225, 29, 72, 0.5)'
  },
  cleaning: {
    label: 'Đang dọn dẹp',
    hex: 0x14b8a6, // Teal 500
    cssDot: 'bg-teal-500',
    cssBadge: 'bg-teal-50 text-teal-700 border-teal-200',
    cssGlow: 'rgba(20, 184, 166, 0.4)'
  }
};

export default function Bed3DViewer({
  bedsByRoom = [],
  bedSessions = {},
  onSelectBed = () => {}
}) {
  const { t } = useT();
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const labelRendererRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const bedMeshesRef = useRef(new Map()); // bedId -> { mesh, ledMesh, labelObj, roomCenter, bedData }
  const roomPositionsRef = useRef(new Map()); // roomId -> { center: Vector3, name: string }

  // UI Filter states
  const [selectedRoomId, setSelectedRoomId] = useState('all');
  const [cameraView, setCameraView] = useState('iso'); // 'iso' | 'top'
  const [hoveredBedInfo, setHoveredBedInfo] = useState(null);

  // Thống kê nhanh trạng thái
  const stats = useMemo(() => {
    let total = 0;
    let occupied = 0;
    let available = 0;
    let overtime = 0;

    bedsByRoom.forEach(group => {
      (group.beds || []).forEach(b => {
        total++;
        const sess = bedSessions[b.id];
        if (!sess) {
          available++;
        } else {
          occupied++;
          if (sess.status === 'overtime') overtime++;
        }
      });
    });

    return { total, occupied, available, overtime };
  }, [bedsByRoom, bedSessions]);

  // Tạo Procedural 3D Mesh cho một Giường / Ghế Spa
  const createBedMesh = (bed, statusConfig) => {
    const group = new THREE.Group();
    group.name = `bed_${bed.id}`;

    // 1. Chân đế kim loại mờ (Base Stand)
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate 700
      metalness: 0.6,
      roughness: 0.3
    });
    const baseGeo = new THREE.BoxGeometry(1.6, 0.15, 2.6);
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.075;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // 4 Chân giường mạ kim loại
    const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16);
    const legPositions = [
      [-0.7, 0.2, -1.1],
      [0.7, 0.2, -1.1],
      [-0.7, 0.2, 1.1],
      [0.7, 0.2, 1.1]
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, baseMat);
      leg.position.set(x, y, z);
      group.add(leg);
    });

    // 2. Dải LED phát sáng dưới gầm giường (Status LED Glow Strip)
    const ledMat = new THREE.MeshStandardMaterial({
      color: statusConfig.hex,
      emissive: statusConfig.hex,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    const ledGeo = new THREE.BoxGeometry(1.64, 0.06, 2.64);
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.y = 0.42;
    group.add(ledMesh);

    // 3. Nệm bọc da cao cấp (Cushion Mattress)
    const mattressMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Slate 50
      roughness: 0.4,
      metalness: 0.05
    });
    const mattressGeo = new THREE.BoxGeometry(1.56, 0.35, 2.56);
    const mattressMesh = new THREE.Mesh(mattressGeo, mattressMat);
    mattressMesh.position.y = 0.62;
    mattressMesh.castShadow = true;
    group.add(mattressMesh);

    // 4. Gối đầu thư giãn (Ergonomic Pillow)
    const pillowMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Slate 200
      roughness: 0.5
    });
    const pillowGeo = new THREE.BoxGeometry(1.1, 0.12, 0.6);
    const pillowMesh = new THREE.Mesh(pillowGeo, pillowMat);
    pillowMesh.position.set(0, 0.85, -0.9);
    group.add(pillowMesh);

    // 5. Khăn trải trang trí vắt ngang giường (Bed Runner)
    const runnerMat = new THREE.MeshStandardMaterial({
      color: statusConfig.hex,
      roughness: 0.7
    });
    const runnerGeo = new THREE.BoxGeometry(1.58, 0.04, 0.5);
    const runnerMesh = new THREE.Mesh(runnerGeo, runnerMat);
    runnerMesh.position.set(0, 0.81, 0.7);
    group.add(runnerMesh);

    // Hitbox vô hình để bắt Raycaster chính xác và dễ click
    const hitboxGeo = new THREE.BoxGeometry(2.0, 1.6, 3.0);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    hitbox.position.y = 0.8;
    hitbox.userData = { isBedHitbox: true, bedId: bed.id, bedData: bed };
    group.add(hitbox);

    return { group, ledMesh, runnerMesh, hitbox };
  };

  // Tạo DOM Card nổi bật trên đầu giường bằng CSS2D
  const createBedCSS2DElement = (bed, room, session) => {
    const statusKey = session ? (session.status || 'in_progress') : 'available';
    const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.available;
    const isOccupied = Boolean(session);

    const div = document.createElement('div');
    div.className = 'select-none pointer-events-auto transition-transform hover:scale-105 duration-200';
    div.style.transform = 'translate3d(0, 0, 0)';

    let innerContent = '';
    if (isOccupied) {
      const customerName = session.customer_name || t('rooms_beds.guest', 'Khách vãng lai');
      const techName = session.technician_name || t('rooms_beds.unassigned_staff', 'Chưa chọn KTV');
      const serviceName = (session.services && session.services[0]?.name) || session.service_name || t('rooms_beds.standard_service', 'Dịch vụ Spa');
      const progressPercent = session.progress_percent || 0;
      const isOver = session.status === 'overtime';

      innerContent = `
        <div class="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-slate-200/90 text-left min-w-[210px] max-w-[250px] cursor-pointer hover:border-blue-400 transition-all">
          <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full ${cfg.cssDot}"></span>
              <span class="text-xs font-black text-slate-800 tracking-tight">${bed.name || 'Vị trí'}</span>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${cfg.cssBadge}">
              ${cfg.label}
            </span>
          </div>
          
          <div class="mt-2 space-y-1.5">
            <div class="flex items-center gap-1.5 text-slate-900 font-bold text-xs truncate">
              <svg class="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <span class="truncate">${customerName}</span>
            </div>

            <div class="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span class="flex items-center gap-1 truncate text-slate-600">
                <svg class="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>
                ${techName}
              </span>
              <span class="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md truncate max-w-[90px]">
                ${serviceName}
              </span>
            </div>

            <!-- Progress Bar -->
            <div class="pt-1">
              <div class="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
                <span>Tiến độ</span>
                <span class="${isOver ? 'text-rose-600 font-bold' : 'text-slate-600'}">
                  ${isOver ? 'Quá giờ' : `${progressPercent}%`}
                </span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500' : 'bg-blue-600'}" style="width: ${Math.min(100, Math.max(8, progressPercent))}%"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      innerContent = `
        <div class="bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 shadow-md border border-slate-200/80 flex items-center gap-2 cursor-pointer hover:bg-white hover:border-emerald-300 transition-all">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span class="text-xs font-bold text-slate-800">${bed.name || 'Vị trí'}</span>
          <span class="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-md">
            Trống
          </span>
        </div>
      `;
    }

    div.innerHTML = innerContent;
    div.onclick = (e) => {
      e.stopPropagation();
      onSelectBed(bed);
    };

    return div;
  };

  // Khởi tạo Scene 3D
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // Slate 100 sleek studio tone
    sceneRef.current = scene;

    // 2. Camera setup (Isometric-style Perspective)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(24, 22, 28);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. CSS2D Renderer cho nhãn thẻ nổi trên đầu giường
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.left = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    // 5. OrbitControls
    const controls = new OrbitControls(camera, labelRenderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 6;
    controls.maxDistance = 75;
    controls.maxPolarAngle = Math.PI / 2.05; // Không cho camera chìm dưới sàn
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 6. Ánh sáng Studio ấm áp, dịu mắt
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.6);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
    dirLight.position.set(20, 35, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Sàn studio chính dưới cùng
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Slate 200
      roughness: 0.85,
      metalness: 0.05
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.05;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Lưới studio tinh tế
    const gridHelper = new THREE.GridHelper(80, 40, 0xcbcfd6, 0xe2e8f0);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // 7. Raycasting bắt sự kiện Hover & Click trên canvas
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hitboxes = [];
      bedMeshesRef.current.forEach(item => {
        if (item.hitbox) hitboxes.push(item.hitbox);
      });

      const intersects = raycaster.intersectObjects(hitboxes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        renderer.domElement.style.cursor = 'pointer';
        setHoveredBedInfo(hit.userData.bedData);
      } else {
        renderer.domElement.style.cursor = 'default';
        setHoveredBedInfo(null);
      }
    };

    const handlePointerDown = (e) => {
      // Chỉ bắt chuột trái (click)
      if (e.button !== 0) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hitboxes = [];
      bedMeshesRef.current.forEach(item => {
        if (item.hitbox) hitboxes.push(item.hitbox);
      });

      const intersects = raycaster.intersectObjects(hitboxes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const bedData = hit.userData.bedData;
        if (bedData) {
          onSelectBed(bedData);
          // Lướt camera tới gần vị trí giường
          focusCameraOnBed(hit.parent.position);
        }
      }
    };

    const domEl = labelRenderer.domElement;
    domEl.addEventListener('pointermove', handlePointerMove);
    domEl.addEventListener('pointerdown', handlePointerDown);

    // 8. Animation loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    // 9. Resize observer
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
          labelRenderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      domEl.removeEventListener('pointermove', handlePointerMove);
      domEl.removeEventListener('pointerdown', handlePointerDown);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (labelRenderer.domElement && container.contains(labelRenderer.domElement)) {
        container.removeChild(labelRenderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Lướt camera tới đối tượng mượt mà
  const focusCameraOnBed = (targetPos) => {
    if (!controlsRef.current || !cameraRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    const startTarget = controls.target.clone();
    const endTarget = new THREE.Vector3(targetPos.x, targetPos.y + 0.8, targetPos.z);
    const startCamPos = camera.position.clone();
    const endCamPos = new THREE.Vector3(targetPos.x + 6, targetPos.y + 7, targetPos.z + 8);

    let progress = 0;
    const duration = 25; // frames (~0.4s)

    const step = () => {
      progress++;
      const tNorm = Math.min(1, progress / duration);
      const ease = 0.5 - Math.cos(tNorm * Math.PI) / 2; // Ease in-out

      controls.target.lerpVectors(startTarget, endTarget, ease);
      camera.position.lerpVectors(startCamPos, endCamPos, ease);
      controls.update();

      if (progress < duration) {
        requestAnimationFrame(step);
      }
    };
    step();
  };

  // Cập nhật hoặc Dựng lại các Phòng và Giường trong Scene 3D khi data thay đổi
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Dọn dẹp các nhóm phòng & giường cũ
    bedMeshesRef.current.forEach(({ group, labelObj }) => {
      if (labelObj) group.remove(labelObj);
      scene.remove(group);
    });
    bedMeshesRef.current.clear();
    roomPositionsRef.current.clear();

    const oldRooms = scene.children.filter(c => c.name && c.name.startsWith('room_group_'));
    oldRooms.forEach(r => scene.remove(r));

    if (!bedsByRoom || bedsByRoom.length === 0) return;

    // Sắp xếp các phòng trong không gian 3D theo bố cục đa chiều (Showroom grid)
    const ROOM_SPACING_X = 14;
    const ROOM_SPACING_Z = 13;
    const totalRooms = bedsByRoom.length;
    const columns = Math.ceil(Math.sqrt(totalRooms));

    bedsByRoom.forEach((group, roomIdx) => {
      const room = group.room || {};
      const beds = group.beds || [];
      const col = roomIdx % columns;
      const row = Math.floor(roomIdx / columns);

      // Tọa độ tâm của phòng
      const roomX = (col - (columns - 1) / 2) * ROOM_SPACING_X;
      const roomZ = (row - (Math.ceil(totalRooms / columns) - 1) / 2) * ROOM_SPACING_Z;

      const roomGroup = new THREE.Group();
      roomGroup.name = `room_group_${room.id || roomIdx}`;
      roomGroup.position.set(roomX, 0, roomZ);

      roomPositionsRef.current.set(room.id || `idx_${roomIdx}`, {
        center: new THREE.Vector3(roomX, 0, roomZ),
        name: room.name || `Phòng ${roomIdx + 1}`
      });

      // 1. Bục sàn phòng sang trọng (Room Elevated Floor Slab)
      const roomWidth = 11.5;
      const roomDepth = 9.8;
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.05
      });
      const floorGeo = new THREE.BoxGeometry(roomWidth, 0.2, roomDepth);
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.y = 0.1;
      floorMesh.receiveShadow = true;
      roomGroup.add(floorMesh);

      // Viền kim loại quanh bục sàn
      const borderMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8, // Slate 400
        metalness: 0.5,
        roughness: 0.4
      });
      const borderGeo = new THREE.BoxGeometry(roomWidth + 0.1, 0.05, roomDepth + 0.1);
      const borderMesh = new THREE.Mesh(borderGeo, borderMat);
      borderMesh.position.y = 0.22;
      roomGroup.add(borderMesh);

      // 2. Vách kính lửng ngăn phòng (Frosted Glass Divider)
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.45,
        roughness: 0.2,
        transmission: 0.7,
        thickness: 0.3
      });
      const backWallGeo = new THREE.BoxGeometry(roomWidth, 1.8, 0.1);
      const backWall = new THREE.Mesh(backWallGeo, glassMat);
      backWall.position.set(0, 1.0, -roomDepth / 2);
      roomGroup.add(backWall);

      // 3. Biển tên phòng nổi phía trước (CSS2D Room Header)
      const roomBadgeDiv = document.createElement('div');
      roomBadgeDiv.className = 'select-none pointer-events-none';
      roomBadgeDiv.innerHTML = `
        <div class="bg-slate-900/90 text-white backdrop-blur-md px-3 py-1 rounded-xl shadow-lg border border-slate-700/80 flex items-center gap-1.5 whitespace-nowrap">
          <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          <span class="text-xs font-bold tracking-wide">${room.name || 'Phòng'}</span>
          <span class="text-[10px] text-slate-300 bg-white/10 px-1.5 py-0.2 rounded-full font-semibold">${beds.length} vị trí</span>
        </div>
      `;
      const roomBadgeObj = new CSS2DObject(roomBadgeDiv);
      roomBadgeObj.position.set(0, 2.3, -roomDepth / 2);
      roomGroup.add(roomBadgeObj);

      scene.add(roomGroup);

      // 4. Bố trí các giường / ghế bên trong phòng
      const bedCols = Math.min(beds.length, 4);
      const bedSpacingX = 2.4;
      const bedZOffset = 0.5;

      beds.forEach((bed, bIdx) => {
        const sess = bedSessions[bed.id];
        const statusKey = sess ? (sess.status || 'in_progress') : 'available';
        const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.available;

        const { group: bedGroup, ledMesh, runnerMesh, hitbox } = createBedMesh(bed, cfg);

        // Vị trí giường tính theo tâm phòng
        const bX = roomX + (bIdx - (bedCols - 1) / 2) * bedSpacingX;
        const bZ = roomZ + bedZOffset;
        bedGroup.position.set(bX, 0.2, bZ);

        // Thêm CSS2D Badge cho từng giường
        const bedCardDom = createBedCSS2DElement(bed, room, sess);
        const bedLabelObj = new CSS2DObject(bedCardDom);
        bedLabelObj.position.set(0, 2.1, 0);
        bedGroup.add(bedLabelObj);

        scene.add(bedGroup);

        bedMeshesRef.current.set(bed.id, {
          mesh: bedGroup,
          ledMesh,
          runnerMesh,
          labelObj: bedLabelObj,
          hitbox,
          bedData: bed,
          roomData: room
        });
      });
    });
  }, [bedsByRoom, bedSessions, t]);

  // Điều khiển Camera Preset
  const handleResetCamera = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    controls.target.set(0, 0, 0);
    camera.position.set(24, 22, 28);
    controls.update();
    setCameraView('iso');
  };

  const handleTopDownView = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    controls.target.set(0, 0, 0);
    camera.position.set(0, 36, 0.1);
    controls.update();
    setCameraView('top');
  };

  const handleZoom = (delta) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    camera.position.addScaledVector(dir, delta * 3);
    controls.update();
  };

  // Chuyển góc nhìn tới phòng được chọn
  const handleSelectRoom = (roomId) => {
    setSelectedRoomId(roomId);
    if (!controlsRef.current || !cameraRef.current) return;
    if (roomId === 'all') {
      handleResetCamera();
      return;
    }

    const roomInfo = roomPositionsRef.current.get(roomId);
    if (roomInfo) {
      const pos = roomInfo.center;
      focusCameraOnBed(pos);
    }
  };

  return (
    <div className="relative w-full h-[620px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-900 select-none">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD: Bộ lọc tầng/phòng & Thống kê nhanh */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Pills chọn Phòng / Tầng */}
        <div className="flex items-center gap-1.5 p-1 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/80 pointer-events-auto overflow-x-auto max-w-[70%] scrollbar-none">
          <button
            type="button"
            onClick={() => handleSelectRoom('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedRoomId === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Tất cả phòng</span>
          </button>

          {bedsByRoom.map(group => {
            const rId = group.room?.id || group.room?.name;
            const isSel = selectedRoomId === rId;
            return (
              <button
                key={rId}
                type="button"
                onClick={() => handleSelectRoom(rId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{group.room?.name || 'Phòng'}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {group.beds?.length || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Cụm Thống kê nhanh trạng thái */}
        <div className="hidden lg:flex items-center gap-2 p-1.5 bg-slate-900/85 backdrop-blur-md rounded-2xl shadow-lg border border-slate-800 text-white pointer-events-auto">
          <div className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold">
            <span className="text-slate-400">Tổng:</span>
            <span className="font-bold text-white">{stats.total}</span>
          </div>
          <div className="w-px h-3.5 bg-slate-700" />
          <div className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-300">Đang bận:</span>
            <span className="font-bold text-rose-400">{stats.occupied}</span>
          </div>
          <div className="w-px h-3.5 bg-slate-700" />
          <div className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Trống:</span>
            <span className="font-bold text-emerald-400">{stats.available}</span>
          </div>
          {stats.overtime > 0 && (
            <>
              <div className="w-px h-3.5 bg-slate-700" />
              <div className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-300 bg-rose-950/80 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>Quá giờ: {stats.overtime}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom-Left HUD: Bảng màu trạng thái đèn LED (Legend) */}
      <div className="absolute bottom-4 left-4 p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 pointer-events-auto flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-500" />
          Đèn LED:
        </span>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <span>Trống</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
            <span>Chờ KTV</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
            <span>Đặt trước</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
            <span>Đang làm</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse shadow-sm" />
            <span>Quá giờ</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-sm" />
            <span>Dọn dẹp</span>
          </div>
        </div>
      </div>

      {/* Bottom-Right HUD: Camera Navigation Tools */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 p-1 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 pointer-events-auto">
        <button
          type="button"
          onClick={() => handleZoom(1)}
          title="Phóng to"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleZoom(-1)}
          title="Thu nhỏ"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200" />

        <button
          type="button"
          onClick={handleResetCamera}
          title="Góc nhìn phối cảnh (Isometric)"
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            cameraView === 'iso' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleTopDownView}
          title="Góc nhìn thẳng từ trên xuống"
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            cameraView === 'top' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200" />

        <button
          type="button"
          onClick={handleResetCamera}
          title="Đặt lại góc nhìn ban đầu"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
