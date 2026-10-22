'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { 
  Building2, ZoomIn, ZoomOut, RotateCcw, 
  Layers, User, Scissors, Clock, AlertCircle, 
  CheckCircle2, Sparkles, Compass, Maximize2, Minimize2,
  Sun, Moon, Eye, Activity
} from 'lucide-react';
import { useT } from '@/lib/i18n';

// Bảng màu trạng thái chuẩn GloPro (Tuân thủ nghiêm ngặt quy tắc No-Purple, tối ưu thẩm mỹ cao cấp)
const STATUS_THEME = {
  available: {
    label: 'Đang trống',
    hex: 0x10b981, // Emerald 500
    colorStr: '#10b981',
    cssDot: 'bg-emerald-500',
    cssBadge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.45)'
  },
  waiting: {
    label: 'Chờ phục vụ',
    hex: 0x0ea5e9, // Sky 500
    colorStr: '#0ea5e9',
    cssDot: 'bg-sky-400',
    cssBadge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    glowColor: 'rgba(14, 165, 233, 0.45)'
  },
  reserved: {
    label: 'Đặt trước',
    hex: 0xf59e0b, // Amber 500
    colorStr: '#f59e0b',
    cssDot: 'bg-amber-400',
    cssBadge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.45)'
  },
  in_progress: {
    label: 'Đang bận',
    hex: 0xf43f5e, // Rose 500
    colorStr: '#f43f5e',
    cssDot: 'bg-rose-500',
    cssBadge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    glowColor: 'rgba(244, 63, 94, 0.45)'
  },
  nearly_finished: {
    label: 'Sắp trống',
    hex: 0xfbbf24, // Amber 400
    colorStr: '#fbbf24',
    cssDot: 'bg-amber-400',
    cssBadge: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    glowColor: 'rgba(251, 191, 36, 0.45)'
  },
  overtime: {
    label: 'Quá giờ',
    hex: 0xe11d48, // Vivid Rose Red Alert
    colorStr: '#e11d48',
    cssDot: 'bg-rose-500 animate-ping',
    cssBadge: 'bg-rose-600/25 text-rose-300 border-rose-500/50 font-bold',
    glowColor: 'rgba(225, 29, 72, 0.65)'
  },
  cleaning: {
    label: 'Đang dọn dẹp',
    hex: 0x14b8a6, // Teal 500
    colorStr: '#14b8a6',
    cssDot: 'bg-teal-400',
    cssBadge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    glowColor: 'rgba(20, 184, 166, 0.45)'
  }
};

// Tạo texture bóng đổ tiếp xúc mềm mại (Soft Contact Shadow)
function createContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(15, 23, 42, 0.65)');
  gradient.addColorStop(0.35, 'rgba(15, 23, 42, 0.35)');
  gradient.addColorStop(0.7, 'rgba(15, 23, 42, 0.12)');
  gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Tạo texture vầng hào quang mặt sàn theo màu trạng thái
function createGlowHaloTexture(colorStr) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 25, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.5, colorStr);
  gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

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

  // Bộ nhớ đệm tham chiếu vật thể
  const bedMeshesRef = useRef(new Map());
  const roomPositionsRef = useRef(new Map());
  const contactShadowTexRef = useRef(null);

  // Trạng thái giao diện
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('all');
  const [cameraMode, setCameraMode] = useState('iso'); // 'iso' | 'top' | 'front'
  const [themeMode, setThemeMode] = useState('dark'); // 'dark' (Obsidian Luxury) | 'clay' (Warm Architectural)
  const [hoveredBed, setHoveredBed] = useState(null);
  const [webglError, setWebglError] = useState(false);

  // Thống kê nhanh dữ liệu
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

  // Sinh mô hình 3D Giường / Ghế Spa Cao Cấp (High-Fidelity Procedural Model)
  const createLuxuryBedModel = (bed, statusConfig, shadowTex) => {
    const group = new THREE.Group();
    group.name = `luxury_bed_${bed.id}`;

    // 1. Bóng đổ tiếp xúc mềm trên mặt sàn (Soft Contact Shadow Decal)
    const shadowGeo = new THREE.PlaneGeometry(2.8, 3.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: themeMode === 'dark' ? 0.75 : 0.5,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.015;
    group.add(shadowMesh);

    // 2. Vòng phát sáng mặt sàn (Floor Status Halo Glow)
    const haloTex = createGlowHaloTexture(statusConfig.colorStr);
    const haloGeo = new THREE.PlaneGeometry(3.2, 4.2);
    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTex,
      transparent: true,
      opacity: themeMode === 'dark' ? 0.8 : 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = -Math.PI / 2;
    haloMesh.position.y = 0.02;
    group.add(haloMesh);

    // 3. Chân đế kim loại mạ Titanium xước mờ (Titanium Pedestal Base)
    const baseMat = new THREE.MeshStandardMaterial({
      color: themeMode === 'dark' ? 0x1e293b : 0x334155, // Slate 800 / 700
      metalness: 0.85,
      roughness: 0.25
    });

    // Đế chân tròn hoặc bo góc
    const basePlateGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.12, 32);
    const basePlate = new THREE.Mesh(basePlateGeo, baseMat);
    basePlate.position.y = 0.06;
    basePlate.castShadow = true;
    basePlate.receiveShadow = true;
    group.add(basePlate);

    // Trụ nâng thủy lực kim loại bóng (Hydraulic Column)
    const columnMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Chrome/Steel
      metalness: 0.95,
      roughness: 0.15
    });
    const columnGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.45, 32);
    const column = new THREE.Mesh(columnGeo, columnMat);
    column.position.y = 0.32;
    column.castShadow = true;
    group.add(column);

    // Khung đỡ mặt giường (Sub-frame)
    const frameMat = new THREE.MeshStandardMaterial({
      color: themeMode === 'dark' ? 0x0f172a : 0x1e293b,
      metalness: 0.7,
      roughness: 0.3
    });
    const frameGeo = new THREE.BoxGeometry(1.5, 0.1, 2.5);
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 0.58;
    frame.castShadow = true;
    group.add(frame);

    // 4. Dải đèn Neon LED trạng thái (Status Edge LED)
    const ledMat = new THREE.MeshStandardMaterial({
      color: statusConfig.hex,
      emissive: statusConfig.hex,
      emissiveIntensity: themeMode === 'dark' ? 1.6 : 0.9,
      roughness: 0.1
    });
    const ledGeo = new THREE.BoxGeometry(1.54, 0.05, 2.54);
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.y = 0.64;
    group.add(ledMesh);

    // 5. Nệm bọc da cao cấp với đường cong nhẹ (Plush Contoured Mattress)
    const leatherMat = new THREE.MeshStandardMaterial({
      color: themeMode === 'dark' ? 0xf1f5f9 : 0xffffff, // Da màu kem/sáng thanh lịch
      roughness: 0.35,
      metalness: 0.05
    });

    // Phần nệm chính
    const mattressGeo = new THREE.BoxGeometry(1.46, 0.32, 2.46);
    const mattress = new THREE.Mesh(mattressGeo, leatherMat);
    mattress.position.y = 0.81;
    mattress.castShadow = true;
    mattress.receiveShadow = true;
    group.add(mattress);

    // 6. Gối đầu công thái học (Ergonomic Spa Pillow)
    const pillowMat = new THREE.MeshStandardMaterial({
      color: themeMode === 'dark' ? 0xe2e8f0 : 0xf8fafc,
      roughness: 0.45,
      metalness: 0.02
    });
    const pillowGeo = new THREE.CylinderGeometry(0.38, 0.38, 1.1, 32);
    const pillow = new THREE.Mesh(pillowGeo, pillowMat);
    pillow.rotation.z = Math.PI / 2;
    pillow.position.set(0, 1.02, -0.85);
    pillow.scale.set(1, 0.45, 1);
    pillow.castShadow = true;
    group.add(pillow);

    // 7. Khăn trải trang trí vắt ngang giường (Bed Runner)
    const runnerMat = new THREE.MeshStandardMaterial({
      color: statusConfig.hex,
      roughness: 0.6,
      metalness: 0.1
    });
    const runnerGeo = new THREE.BoxGeometry(1.48, 0.03, 0.45);
    const runner = new THREE.Mesh(runnerGeo, runnerMat);
    runner.position.set(0, 0.98, 0.65);
    group.add(runner);

    // 8. Bàn tiện ích Spa mini bên cạnh giường (Spa Side Cart)
    const cartGroup = new THREE.Group();
    const cartMat = new THREE.MeshStandardMaterial({
      color: themeMode === 'dark' ? 0x1e293b : 0xe2e8f0,
      metalness: 0.4,
      roughness: 0.4
    });
    const cartTopGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 24);
    const cartTop = new THREE.Mesh(cartTopGeo, cartMat);
    cartTop.position.set(1.05, 0.75, -0.7);
    cartGroup.add(cartTop);

    const cartLegGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.72, 16);
    const cartLeg = new THREE.Mesh(cartLegGeo, columnMat);
    cartLeg.position.set(1.05, 0.37, -0.7);
    cartGroup.add(cartLeg);

    // Lọ tinh dầu thơm mini trên bàn
    const bottleMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85
    });
    const bottleGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.14, 16);
    const bottle = new THREE.Mesh(bottleGeo, bottleMat);
    bottle.position.set(1.05, 0.84, -0.7);
    cartGroup.add(bottle);

    group.add(cartGroup);

    // 9. Cột Laser định vị không gian (Spatial Anchor Stem)
    const stemMat = new THREE.MeshBasicMaterial({
      color: statusConfig.hex,
      transparent: true,
      opacity: themeMode === 'dark' ? 0.35 : 0.2
    });
    const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 12);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(0, 1.6, 0);
    group.add(stem);

    // Hitbox vô hình bắt click/hover
    const hitboxGeo = new THREE.BoxGeometry(2.3, 2.0, 3.2);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    hitbox.position.y = 0.9;
    hitbox.userData = { isBedHitbox: true, bedId: bed.id, bedData: bed };
    group.add(hitbox);

    return { group, ledMesh, haloMesh, hitbox };
  };

  // Tạo Floating Spatial Card bằng CSS2D
  const createBedCSS2DElement = (bed, room, session) => {
    const statusKey = session ? (session.status || 'in_progress') : 'available';
    const cfg = STATUS_THEME[statusKey] || STATUS_THEME.available;
    const isOccupied = Boolean(session);

    const div = document.createElement('div');
    div.className = 'select-none pointer-events-auto transform transition-all duration-300 hover:scale-105';
    div.style.transform = 'translate3d(0, 0, 0)';

    let cardHtml = '';
    if (isOccupied) {
      const customerName = session.customer_name || t('rooms_beds.guest', 'Khách vãng lai');
      const techName = session.technician_name || t('rooms_beds.unassigned_staff', 'Chưa chọn KTV');
      const serviceName = (session.services && session.services[0]?.name) || session.service_name || t('rooms_beds.standard_service', 'Dịch vụ Spa');
      const progressPercent = Math.min(100, Math.max(0, session.progress_percent || 0));
      const isOver = session.status === 'overtime';
      const remainingMins = session.remaining_minutes ?? 0;
      const initialLetter = customerName.charAt(0).toUpperCase();

      cardHtml = `
        <div class="group relative rounded-2xl p-3 shadow-2xl backdrop-blur-xl transition-all duration-300 min-w-[220px] max-w-[260px] cursor-pointer text-left border ${
          themeMode === 'dark' 
            ? 'bg-slate-950/85 text-white border-white/10 hover:border-blue-500/80 hover:shadow-blue-500/20' 
            : 'bg-white/95 text-slate-900 border-slate-200/90 hover:border-blue-500/80 hover:shadow-slate-300/60'
        }">
          <!-- Glowing Top Accent Line -->
          <div class="absolute -top-[1px] left-4 right-4 h-[2px] rounded-full" style="background: ${cfg.colorStr}; box-shadow: 0 0 10px ${cfg.colorStr};"></div>

          <!-- Header Row -->
          <div class="flex items-center justify-between gap-2 pb-2 border-b ${themeMode === 'dark' ? 'border-white/10' : 'border-slate-100'}">
            <div class="flex items-center gap-1.5">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style="background: ${cfg.colorStr}"></span>
                <span class="relative inline-flex rounded-full h-2 w-2" style="background: ${cfg.colorStr}"></span>
              </span>
              <span class="text-xs font-black tracking-tight ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}">${bed.name || 'Vị trí'}</span>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-bold border tracking-wide uppercase ${cfg.cssBadge}">
              ${cfg.label}
            </span>
          </div>

          <!-- Customer Info -->
          <div class="mt-2.5 flex items-center gap-2.5">
            <div class="relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-md ${
              themeMode === 'dark' ? 'bg-gradient-to-tr from-slate-800 to-slate-700 text-blue-400 border border-white/15' : 'bg-gradient-to-tr from-blue-50 to-blue-100 text-blue-700 border border-blue-200'
            }">
              ${initialLetter}
              <!-- Mini Progress Ring Indicator -->
              <svg class="absolute -inset-0.5 w-9 h-9 -rotate-90 pointer-events-none" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}" stroke-width="2.5" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="${cfg.colorStr}" stroke-width="2.5" stroke-dasharray="100" stroke-dashoffset="${100 - progressPercent}" stroke-linecap="round" />
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <div class="text-xs font-bold truncate ${themeMode === 'dark' ? 'text-slate-100' : 'text-slate-900'}">
                ${customerName}
              </div>
              <div class="text-[11px] truncate flex items-center gap-1 ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}">
                <span class="font-medium">KTV:</span>
                <span class="font-semibold text-sky-400">${techName}</span>
              </div>
            </div>
          </div>

          <!-- Service Tag & Timer -->
          <div class="mt-2.5 pt-2 border-t flex items-center justify-between text-[11px] ${themeMode === 'dark' ? 'border-white/5' : 'border-slate-100'}">
            <span class="font-medium text-slate-400 truncate max-w-[130px]">
              ${serviceName}
            </span>
            <span class="font-bold text-[10px] px-1.5 py-0.5 rounded-md ${
              isOver 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                : themeMode === 'dark' ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-700'
            }">
              ${isOver ? 'Quá giờ' : `Còn ${remainingMins}p`}
            </span>
          </div>
        </div>
      `;
    } else {
      cardHtml = `
        <div class="rounded-xl px-3 py-1.5 shadow-xl backdrop-blur-xl border flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
          themeMode === 'dark' 
            ? 'bg-slate-950/80 text-white border-white/10 hover:border-emerald-500/50' 
            : 'bg-white/95 text-slate-800 border-slate-200/90 hover:border-emerald-500/50'
        }">
          <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500"></span>
          <span class="text-xs font-black tracking-tight">${bed.name || 'Vị trí'}</span>
          <span class="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
            Trống
          </span>
        </div>
      `;
    }

    div.innerHTML = cardHtml;
    div.onclick = (e) => {
      e.stopPropagation();
      onSelectBed(bed);
    };

    return div;
  };

  // Khởi tạo Scene 3D & Renderers
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 650;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Thiết lập màu nền & sương mù phối cảnh (Fog)
    const isDark = themeMode === 'dark';
    const bgCol = isDark ? 0x090d16 : 0xedf2f9;
    scene.background = new THREE.Color(bgCol);
    scene.fog = new THREE.FogExp2(bgCol, isDark ? 0.012 : 0.009);

    // 2. Camera setup: Góc quay Isometric điện ảnh (FOV 32)
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 1000);
    camera.position.set(30, 26, 34);
    cameraRef.current = camera;

    // 3. WebGL Renderer an toàn với try/catch
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (err) {
      console.warn('[Bed3DViewer] WebGL initialization failed:', err);
      setWebglError(true);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.25 : 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. CSS2D Renderer cho thẻ nổi
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
    controls.dampingFactor = 0.05;
    controls.minDistance = 8;
    controls.maxDistance = 85;
    controls.maxPolarAngle = Math.PI / 2.08;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 6. Ánh sáng Kiến Trúc Studio Đa Chiều
    const hemiLight = new THREE.HemisphereLight(
      isDark ? 0x93c5fd : 0xffffff, // Trời
      isDark ? 0x0f172a : 0xdbeafe, // Đất
      isDark ? 0.9 : 1.2
    );
    hemiLight.position.set(0, 40, 0);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(isDark ? 0x334155 : 0xffffff, isDark ? 0.7 : 0.8);
    scene.add(ambientLight);

    // Đèn chính (Key Directional Sun) tạo bóng đổ sắc nét
    const sunLight = new THREE.DirectionalLight(isDark ? 0xffffff : 0xfffbeb, isDark ? 2.2 : 2.6);
    sunLight.position.set(25, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    // Đèn phụ dịu (Fill Cool Rim Light)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, isDark ? 0.8 : 0.4);
    rimLight.position.set(-25, 30, -25);
    scene.add(rimLight);

    // 7. Sàn không gian vô cực (Infinite Ambient Floor)
    const floorGeo = new THREE.PlaneGeometry(160, 160);
    const floorMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x0b1120 : 0xe2e8f0,
      roughness: 0.92,
      metalness: 0.08
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.02;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Lưới tọa độ không gian thanh lịch
    const gridHelper = new THREE.GridHelper(
      100, 
      50, 
      isDark ? 0x1e293b : 0x94a3b8, 
      isDark ? 0x0f172a : 0xcbd5e1
    );
    gridHelper.position.y = 0.005;
    scene.add(gridHelper);

    // Chuẩn bị texture bóng đổ mềm dùng chung
    contactShadowTexRef.current = createContactShadowTexture();

    // 8. Raycaster bắt sự kiện
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
        setHoveredBed(hit.userData.bedData);
      } else {
        renderer.domElement.style.cursor = 'default';
        setHoveredBed(null);
      }
    };

    const handlePointerDown = (e) => {
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
          focusCameraOnObject(hit.parent.position);
        }
      }
    };

    const domEl = labelRenderer.domElement;
    domEl.addEventListener('pointermove', handlePointerMove);
    domEl.addEventListener('pointerdown', handlePointerDown);

    // 9. Animation Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    // 10. Resize Observer (Bọc requestAnimationFrame tránh ResizeObserver loop notification)
    let resizeRaf = null;
    const resizeObserver = new ResizeObserver(entries => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        for (const entry of entries) {
          const { width: newW, height: newH } = entry.contentRect;
          if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current && labelRendererRef.current) {
            cameraRef.current.aspect = newW / newH;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(newW, newH, false);
            labelRendererRef.current.setSize(newW, newH);
          }
        }
      });
    });
    resizeObserver.observe(container);

    return () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
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
  }, [themeMode]);

  // Lướt camera mượt mà (Cinematic Flight)
  const focusCameraOnObject = (targetPos) => {
    if (!controlsRef.current || !cameraRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    const startTarget = controls.target.clone();
    const endTarget = new THREE.Vector3(targetPos.x, targetPos.y + 0.9, targetPos.z);
    const startCamPos = camera.position.clone();
    const endCamPos = new THREE.Vector3(targetPos.x + 8, targetPos.y + 9, targetPos.z + 10);

    let progress = 0;
    const duration = 28;

    const step = () => {
      progress++;
      const tNorm = Math.min(1, progress / duration);
      const ease = 0.5 - Math.cos(tNorm * Math.PI) / 2;

      controls.target.lerpVectors(startTarget, endTarget, ease);
      camera.position.lerpVectors(startCamPos, endCamPos, ease);
      controls.update();

      if (progress < duration) {
        requestAnimationFrame(step);
      }
    };
    step();
  };

  // Tái tạo Phòng & Giường trong không gian 3D khi data đổi
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Dọn dẹp an toàn các mesh cũ
    bedMeshesRef.current.forEach((item) => {
      const g = item?.group || item?.mesh;
      if (g) {
        if (item?.labelObj) {
          try { g.remove(item.labelObj); } catch (_) {}
        }
        try { scene.remove(g); } catch (_) {}
      }
    });
    bedMeshesRef.current.clear();
    roomPositionsRef.current.clear();

    const oldRooms = scene.children.filter(c => c && c.name && typeof c.name === 'string' && c.name.startsWith('room_arch_'));
    oldRooms.forEach(r => {
      if (r) {
        try { scene.remove(r); } catch (_) {}
      }
    });

    if (!bedsByRoom || bedsByRoom.length === 0) return;

    const isDark = themeMode === 'dark';
    const shadowTex = contactShadowTexRef.current || createContactShadowTexture();

    const ROOM_SPACING_X = 16.5;
    const ROOM_SPACING_Z = 14.5;
    const totalRooms = bedsByRoom.length;
    const columns = Math.ceil(Math.sqrt(totalRooms));

    bedsByRoom.forEach((group, roomIdx) => {
      const room = group.room || {};
      const beds = group.beds || [];
      const col = roomIdx % columns;
      const row = Math.floor(roomIdx / columns);

      const roomX = (col - (columns - 1) / 2) * ROOM_SPACING_X;
      const roomZ = (row - (Math.ceil(totalRooms / columns) - 1) / 2) * ROOM_SPACING_Z;

      const roomGroup = new THREE.Group();
      roomGroup.name = `room_arch_${room.id || roomIdx}`;
      roomGroup.position.set(roomX, 0, roomZ);

      roomPositionsRef.current.set(room.id || `idx_${roomIdx}`, {
        center: new THREE.Vector3(roomX, 0, roomZ),
        name: room.name || `Phòng ${roomIdx + 1}`
      });

      // 1. Bục sàn phòng kiến trúc (Architectural Room Podium)
      const roomW = 14.2;
      const roomD = 11.8;
      const podiumMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x0f172a : 0xffffff, // Slate 900 / Pure White
        roughness: 0.35,
        metalness: 0.05
      });
      const podiumGeo = new THREE.BoxGeometry(roomW, 0.25, roomD);
      const podiumMesh = new THREE.Mesh(podiumGeo, podiumMat);
      podiumMesh.position.y = 0.125;
      podiumMesh.receiveShadow = true;
      roomGroup.add(podiumMesh);

      // Viền kim loại sang trọng xung quanh bục
      const trimMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x334155 : 0xcbd5e1,
        metalness: 0.8,
        roughness: 0.2
      });
      const trimGeo = new THREE.BoxGeometry(roomW + 0.12, 0.06, roomD + 0.12);
      const trimMesh = new THREE.Mesh(trimGeo, trimMat);
      trimMesh.position.y = 0.26;
      roomGroup.add(trimMesh);

      // 2. Vách lam gỗ kiến trúc hoặc kính sọc mờ (Architectural Slats / Glass Partition)
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: isDark ? 0x38bdf8 : 0xbae6fd,
        transparent: true,
        opacity: isDark ? 0.35 : 0.5,
        roughness: 0.15,
        transmission: 0.75,
        thickness: 0.4
      });
      const partitionGeo = new THREE.BoxGeometry(roomW - 1, 2.2, 0.1);
      const partition = new THREE.Mesh(partitionGeo, glassMat);
      partition.position.set(0, 1.25, -roomD / 2 + 0.3);
      partition.castShadow = true;
      roomGroup.add(partition);

      // 3. Đèn trần Spa rọi điểm dịu mắt (Downlight Spotlight)
      const spotLight = new THREE.PointLight(0xfffbeb, isDark ? 0.8 : 0.5, 12, 1.2);
      spotLight.position.set(0, 4.5, 0);
      roomGroup.add(spotLight);

      // 4. Biển tên phòng nổi phía trước (CSS2D Architectural Room Header)
      const roomBadgeDom = document.createElement('div');
      roomBadgeDom.className = 'select-none pointer-events-none transform -translate-y-2';
      roomBadgeDom.innerHTML = `
        <div class="px-4 py-1.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2.5 border ${
          isDark 
            ? 'bg-slate-950/90 text-white border-white/15' 
            : 'bg-white/95 text-slate-900 border-slate-200/90 shadow-slate-300'
        }">
          <div class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500"></div>
          <span class="text-xs font-black tracking-wider uppercase">${room.name || 'Phòng Spa'}</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${
            isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
          }">
            ${beds.length} vị trí
          </span>
        </div>
      `;
      const roomBadgeObj = new CSS2DObject(roomBadgeDom);
      roomBadgeObj.position.set(0, 2.8, -roomD / 2 + 0.3);
      roomGroup.add(roomBadgeObj);

      scene.add(roomGroup);

      // 5. Bố trí các giường / ghế bên trong phòng
      const bedCols = Math.min(beds.length, 4);
      const bedSpacingX = 2.9;
      const bedZOffset = 0.4;

      beds.forEach((bed, bIdx) => {
        const sess = bedSessions[bed.id];
        const statusKey = sess ? (sess.status || 'in_progress') : 'available';
        const cfg = STATUS_THEME[statusKey] || STATUS_THEME.available;

        const { group: bedGroup, ledMesh, haloMesh, hitbox } = createLuxuryBedModel(bed, cfg, shadowTex);

        const bX = roomX + (bIdx - (bedCols - 1) / 2) * bedSpacingX;
        const bZ = roomZ + bedZOffset;
        bedGroup.position.set(bX, 0.25, bZ);

        // Gắn Floating CSS2D Card
        const bedCardDom = createBedCSS2DElement(bed, room, sess);
        const bedLabelObj = new CSS2DObject(bedCardDom);
        bedLabelObj.position.set(0, 2.45, 0);
        bedGroup.add(bedLabelObj);

        scene.add(bedGroup);

        bedMeshesRef.current.set(bed.id, {
          mesh: bedGroup,
          group: bedGroup,
          ledMesh,
          haloMesh,
          labelObj: bedLabelObj,
          hitbox,
          bedData: bed,
          roomData: room
        });
      });
    });
  }, [bedsByRoom, bedSessions, themeMode, t]);

  // Điều khiển góc quay Camera
  const handleResetCamera = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    controlsRef.current.target.set(0, 0, 0);
    cameraRef.current.position.set(30, 26, 34);
    controlsRef.current.update();
    setCameraMode('iso');
  };

  const handleTopDownView = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    controlsRef.current.target.set(0, 0, 0);
    cameraRef.current.position.set(0, 42, 0.1);
    controlsRef.current.update();
    setCameraMode('top');
  };

  const handleFrontView = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    controlsRef.current.target.set(0, 0, 0);
    cameraRef.current.position.set(0, 14, 38);
    controlsRef.current.update();
    setCameraMode('front');
  };

  const handleZoom = (delta) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const dir = new THREE.Vector3();
    cameraRef.current.getWorldDirection(dir);
    cameraRef.current.position.addScaledVector(dir, delta * 3.5);
    controlsRef.current.update();
  };

  const handleSelectRoom = (roomId) => {
    setSelectedRoomId(roomId);
    if (!controlsRef.current || !cameraRef.current) return;
    if (roomId === 'all') {
      handleResetCamera();
      return;
    }

    const roomInfo = roomPositionsRef.current.get(roomId);
    if (roomInfo) {
      focusCameraOnObject(roomInfo.center);
    }
  };

  if (webglError) {
    return (
      <div className="w-full h-[520px] rounded-3xl bg-slate-900 border border-slate-800 text-white p-8 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <Compass className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white mb-2">Trình duyệt chưa bật tăng tốc WebGL 3D</h3>
        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
          Thiết bị hoặc trình duyệt của bạn đang bị giới hạn đồ họa phần cứng WebGL. Bạn có thể sử dụng bình thường ở tab Sơ đồ lưới hoặc kích hoạt Tăng tốc phần cứng trong cài đặt trình duyệt.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden border transition-all duration-500 shadow-2xl ${
      isFullscreen 
        ? 'fixed inset-0 z-50 rounded-none h-screen w-screen border-none' 
        : 'h-[680px] border-slate-800'
    } ${themeMode === 'dark' ? 'bg-[#090d16]' : 'bg-[#edf2f9]'}`}>

      {/* Canvas Three.js & CSS2D */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* ========================================================================= */}
      {/* TOP HUD: Room Switcher Pills & Realtime Performance Metrics               */}
      {/* ========================================================================= */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-10">
        {/* Pills chọn Phòng / Tầng */}
        <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl shadow-2xl backdrop-blur-2xl pointer-events-auto border overflow-x-auto max-w-[72%] scrollbar-none ${
          themeMode === 'dark' 
            ? 'bg-slate-950/80 border-white/10 text-white' 
            : 'bg-white/90 border-slate-200/90 text-slate-800'
        }`}>
          <button
            type="button"
            onClick={() => handleSelectRoom('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              selectedRoomId === 'all'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : themeMode === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : themeMode === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{group.room?.name || 'Phòng'}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSel ? 'bg-white/20 text-white' : themeMode === 'dark' ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'
                }`}>
                  {group.beds?.length || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Cụm Thống kê nhanh trạng thái */}
        <div className={`hidden lg:flex items-center gap-2 p-1.5 rounded-2xl shadow-2xl backdrop-blur-2xl pointer-events-auto border ${
          themeMode === 'dark' ? 'bg-slate-950/80 border-white/10 text-white' : 'bg-white/90 border-slate-200/90 text-slate-800'
        }`}>
          <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold">
            <span className={themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Tổng vị trí:</span>
            <span className="font-bold">{stats.total}</span>
          </div>

          <div className={`w-px h-3.5 ${themeMode === 'dark' ? 'bg-white/15' : 'bg-slate-200'}`} />

          <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500"></span>
            <span className={themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Đang bận:</span>
            <span className="font-bold text-rose-500">{stats.occupied}</span>
          </div>

          <div className={`w-px h-3.5 ${themeMode === 'dark' ? 'bg-white/15' : 'bg-slate-200'}`} />

          <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500"></span>
            <span className={themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Đang trống:</span>
            <span className="font-bold text-emerald-500">{stats.available}</span>
          </div>

          {stats.overtime > 0 && (
            <>
              <div className={`w-px h-3.5 ${themeMode === 'dark' ? 'bg-white/15' : 'bg-slate-200'}`} />
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>Quá giờ: {stats.overtime}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM-LEFT: Bảng chú thích màu đèn LED sàn (Status Glow Legend)          */}
      {/* ========================================================================= */}
      <div className={`absolute bottom-4 left-4 p-2.5 rounded-2xl shadow-2xl backdrop-blur-2xl pointer-events-auto border flex flex-wrap items-center gap-3.5 z-10 ${
        themeMode === 'dark' ? 'bg-slate-950/80 border-white/10 text-white' : 'bg-white/90 border-slate-200/90 text-slate-800'
      }`}>
        <span className="text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Hào quang:
        </span>
        <div className="flex items-center gap-3 flex-wrap text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500"></span>
            <span>Trống</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400"></span>
            <span>Chờ KTV</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>
            <span>Đặt trước</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500"></span>
            <span>Đang làm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shadow-sm shadow-rose-600"></span>
            <span className="text-rose-400 font-bold">Quá giờ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-sm shadow-teal-400"></span>
            <span>Dọn dẹp</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM-RIGHT: Camera Angles, Theme & Fullscreen Controls                  */}
      {/* ========================================================================= */}
      <div className={`absolute bottom-4 right-4 flex items-center gap-1.5 p-1.5 rounded-2xl shadow-2xl backdrop-blur-2xl pointer-events-auto border z-10 ${
        themeMode === 'dark' ? 'bg-slate-950/80 border-white/10 text-white' : 'bg-white/90 border-slate-200/90 text-slate-800'
      }`}>
        <button
          type="button"
          onClick={() => handleZoom(1)}
          title="Phóng to"
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            themeMode === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleZoom(-1)}
          title="Thu nhỏ"
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            themeMode === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className={`w-px h-4 ${themeMode === 'dark' ? 'bg-white/15' : 'bg-slate-200'}`} />

        <button
          type="button"
          onClick={handleResetCamera}
          title="Góc nhìn phối cảnh nghiêng (Isometric)"
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            cameraMode === 'iso' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
              : themeMode === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Compass className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleTopDownView}
          title="Góc nhìn từ trên xuống (Top-down Mặt bằng)"
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            cameraMode === 'top' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
              : themeMode === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleFrontView}
          title="Góc nhìn ngang điện ảnh (Front View)"
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            cameraMode === 'front' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
              : themeMode === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>

        <div className={`w-px h-4 ${themeMode === 'dark' ? 'bg-white/15' : 'bg-slate-200'}`} />

        {/* Chuyển đổi Theme Sáng / Tối */}
        <button
          type="button"
          onClick={() => setThemeMode(m => m === 'dark' ? 'clay' : 'dark')}
          title={themeMode === 'dark' ? 'Chuyển sang Chế độ Clay Studio' : 'Chuyển sang Chế độ Obsidian Luxury'}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            themeMode === 'dark' ? 'hover:bg-white/10 text-amber-400' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          {themeMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Nút Toàn màn hình (Fullscreen Control Tower) */}
        <button
          type="button"
          onClick={() => setIsFullscreen(f => !f)}
          title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Mở toàn màn hình trung tâm điều hành'}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            themeMode === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
