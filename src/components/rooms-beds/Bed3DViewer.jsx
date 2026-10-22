'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { 
  Building2, ZoomIn, ZoomOut, Layers, AlertCircle, 
  Sparkles, Compass, Maximize2, Minimize2,
  Sun, Moon, Eye, CreditCard, Store, Play, Pause,
  RefreshCw, CheckCircle2, ChevronRight,
  X, Users, Coffee, Clock, Phone, ArrowRight, Plus,
  ArrowRightLeft, LogOut
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import { formatVND } from '@/lib/format';

// Bảng màu trạng thái chuẩn GloPro (Tuân thủ nghiêm ngặt quy tắc No-Purple, tối ưu thẩm mỹ cao cấp)
const STATUS_THEME = {
  available: {
    label: 'Đang trống',
    hex: 0x10b981, // Emerald 500
    colorStr: '#10b981',
    cssDot: 'bg-emerald-500',
    cssBadge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.45)'
  },
  waiting: {
    label: 'Chờ phục vụ',
    hex: 0x0ea5e9, // Sky 500
    colorStr: '#0ea5e9',
    cssDot: 'bg-sky-400',
    cssBadge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    glowColor: 'rgba(14, 165, 233, 0.45)'
  },
  reserved: {
    label: 'Đặt trước',
    hex: 0xf59e0b, // Amber 500
    colorStr: '#f59e0b',
    cssDot: 'bg-amber-400',
    cssBadge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.45)'
  },
  in_progress: {
    label: 'Đang bận',
    hex: 0xf43f5e, // Rose 500
    colorStr: '#f43f5e',
    cssDot: 'bg-rose-500',
    cssBadge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    glowColor: 'rgba(244, 63, 94, 0.45)'
  },
  nearly_finished: {
    label: 'Sắp hoàn thành',
    hex: 0xf97316, // Orange 500
    colorStr: '#f97316',
    cssDot: 'bg-orange-500',
    cssBadge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    glowColor: 'rgba(249, 115, 22, 0.45)'
  },
  overtime: {
    label: 'Quá giờ',
    hex: 0xe11d48, // Vivid Rose Red Alert
    colorStr: '#e11d48',
    cssDot: 'bg-rose-500 animate-ping',
    cssBadge: 'bg-rose-600/25 text-rose-600 dark:text-rose-300 border-rose-500/50 font-bold',
    glowColor: 'rgba(225, 29, 72, 0.65)'
  },
  cleaning: {
    label: 'Đang dọn dẹp',
    hex: 0x14b8a6, // Teal 500
    colorStr: '#14b8a6',
    cssDot: 'bg-teal-400',
    cssBadge: 'bg-teal-500/15 text-teal-600 dark:text-teal-300 border-teal-500/30',
    glowColor: 'rgba(20, 184, 166, 0.45)'
  }
};

// Texture sàn gỗ sồi ấm áp tự nhiên (Light Oak Parquet Plank)
function createOakFloorTexture(isDark) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = isDark ? '#111827' : '#fdf8f0';
  ctx.fillRect(0, 0, 512, 512);

  const plankW = 128;
  const plankH = 32;
  const cols = 512 / plankW;
  const rows = 512 / plankH;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const offsetX = (r % 2) * (plankW / 2);
      const x = (c * plankW + offsetX) % 512;
      const y = r * plankH;
      
      const shade = ((r * 13 + c * 29) % 7) - 3;
      if (isDark) {
        ctx.fillStyle = `rgb(${24 + shade}, ${31 + shade}, ${44 + shade})`;
      } else {
        ctx.fillStyle = `rgb(${246 + shade}, ${238 + shade}, ${227 + shade})`;
      }
      ctx.fillRect(x, y, plankW - 2, plankH - 2);

      // Thêm đường vân gỗ nhẹ
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.025)';
      ctx.fillRect(x + 4, y + 8, plankW - 12, 2);
      ctx.fillRect(x + 10, y + 20, plankW - 20, 1.5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  return texture;
}

// Texture đá cẩm thạch trắng Carrara Marble
function createMarbleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fcfbf9';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(10, 20);
  ctx.bezierCurveTo(80, 100, 160, 60, 240, 220);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 10);
  ctx.bezierCurveTo(150, 120, 70, 180, 210, 240);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

// Texture vách nan gỗ dọc (Fluted Wood Slats)
function createFlutedWoodTexture(isDark) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = isDark ? '#1e293b' : '#b45309';
  ctx.fillRect(0, 0, 128, 128);

  const slatW = 16;
  for (let x = 0; x < 128; x += slatW) {
    ctx.fillStyle = isDark ? '#0f172a' : '#78350f';
    ctx.fillRect(x, 0, 3, 128);
    ctx.fillStyle = isDark ? '#334155' : '#d97706';
    ctx.fillRect(x + 3, 0, slatW - 3, 128);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  texture.needsUpdate = true;
  return texture;
}

// Biển hiệu GlowPro có đèn hắt sau lưng (Backlit Salon Sign)
function createSignTexture(isDark) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  ctx.roundRect ? ctx.roundRect(0, 0, 512, 128, 24) : ctx.fillRect(0, 0, 512, 128);
  ctx.fill();

  ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(217, 119, 6, 0.35)';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.font = 'bold 38px sans-serif';
  ctx.fillStyle = isDark ? '#38bdf8' : '#b45309';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✨ GLOWPRO SALON & SPA ✨', 256, 52);

  ctx.font = '600 18px sans-serif';
  ctx.fillStyle = isDark ? '#94a3b8' : '#78716c';
  ctx.fillText('PREMIUM TREATMENT & WELLNESS', 256, 92);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Tạo texture bóng đổ tiếp xúc mềm mại
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

// Tạo texture vầng hào quang mặt sàn
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
  onSelectBed = () => {},
  onOpenCashier = () => {},
  waitingGuests = [],
  onAssignGuest = () => {},
  staff = [],
  onTransferRoom = () => {},
  onStartServing = () => {},
  onCheckout = () => {},
  onReleaseBed = () => {},
  onFinishCleaning = () => {}
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
  const cashierHitboxRef = useRef(null);
  const loungeHitboxRef = useRef(null);
  const lobbyPosRef = useRef(new THREE.Vector3(0, 0, 10));
  const contactShadowTexRef = useRef(null);
  const animFlightRef = useRef(null);
  const cameraModeRef = useRef('iso');
  const callbacksRef = useRef({});
  callbacksRef.current = {
    staff,
    onTransferRoom,
    onStartServing,
    onCheckout,
    onReleaseBed,
    onFinishCleaning,
    onSelectBed,
    onAssignGuest
  };

  // Trạng thái giao diện
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('all');
  const [cameraMode, setCameraMode] = useState('iso'); // 'iso' | 'top' | 'front' | 'cashier'
  const [themeMode, setThemeMode] = useState('dark'); // Mặc định chế độ tối Obsidian Luxury theo yêu cầu
  const [hoveredBed, setHoveredBed] = useState(null);
  const [isAutoTour, setIsAutoTour] = useState(false);
  const [webglError, setWebglError] = useState(false);
  const [showLoungeModal, setShowLoungeModal] = useState(false);

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

  // Sinh mô hình 3D Nhân vật Khách hàng nằm thư giãn làm dịch vụ (Được nâng cao lộ rõ khuôn mặt, mắt thư giãn & chăn spa)
  const createCustomerFigure = (session, isDark) => {
    const custGroup = new THREE.Group();
    custGroup.name = `customer_avatar_${session?.id || 'active'}`;

    // 1. Chăn Spa cao cấp phủ từ ngực đến chân khách hàng (Màu trắng ngà sang trọng nổi bật)
    const blanketMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0xe2e8f0 : 0xffffff,
      roughness: 0.5,
      metalness: 0.05
    });
    const blanketGeo = new THREE.BoxGeometry(1.24, 0.26, 1.45);
    const blanketMesh = new THREE.Mesh(blanketGeo, blanketMat);
    blanketMesh.position.set(0, 1.12, 0.22);
    blanketMesh.castShadow = true;
    blanketMesh.receiveShadow = true;
    custGroup.add(blanketMesh);

    // Nếp gấp viền chăn ngực sang trọng với dải màu Sky Blue spa cao cấp
    const cuffMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9, // Sky Blue spa luxury accent
      roughness: 0.4,
      metalness: 0.15
    });
    const cuffGeo = new THREE.BoxGeometry(1.26, 0.08, 0.22);
    const cuffMesh = new THREE.Mesh(cuffGeo, cuffMat);
    cuffMesh.position.set(0, 1.24, -0.44);
    custGroup.add(cuffMesh);

    // 2. Phần vai & ngực khách hàng lộ ra phía trên chăn
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf6d4be, // Natural healthy spa skin tone
      roughness: 0.5,
      metalness: 0.05
    });
    const shouldersGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.65, 16);
    const shouldersMesh = new THREE.Mesh(shouldersGeo, skinMat);
    shouldersMesh.rotation.z = Math.PI / 2;
    shouldersMesh.position.set(0, 1.18, -0.56);
    custGroup.add(shouldersMesh);

    // 3. Đầu và khuôn mặt thư giãn nằm gối đầu rõ ràng
    const headGeo = new THREE.SphereGeometry(0.16, 24, 24);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 1.26, -0.82);
    headMesh.scale.set(0.95, 0.9, 1.05);
    headMesh.castShadow = true;
    custGroup.add(headMesh);

    // Khăn quấn đầu spa / turban thư giãn (Spa Turban Wrap)
    const turbanMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.6
    });
    const turbanGeo = new THREE.TorusGeometry(0.16, 0.055, 16, 24);
    const turbanMesh = new THREE.Mesh(turbanGeo, turbanMat);
    turbanMesh.rotation.x = Math.PI / 6;
    turbanMesh.position.set(0, 1.32, -0.86);
    custGroup.add(turbanMesh);

    const turbanCapGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const turbanCap = new THREE.Mesh(turbanCapGeo, turbanMat);
    turbanCap.position.set(0, 1.30, -0.94);
    custGroup.add(turbanCap);

    // Mặt nạ mắt thư giãn / đệm mắt spa (Aesthetic Eye Mask)
    const maskMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Sky Blue soothing mask
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
      roughness: 0.2
    });
    const maskGeo = new THREE.BoxGeometry(0.20, 0.045, 0.08);
    const maskMesh = new THREE.Mesh(maskGeo, maskMat);
    maskMesh.position.set(0, 1.33, -0.76);
    custGroup.add(maskMesh);

    // 4. Hai cánh tay nằm duỗi tự nhiên thư thái hai bên
    const leftArmGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.75, 12);
    const leftArm = new THREE.Mesh(leftArmGeo, skinMat);
    leftArm.rotation.x = Math.PI / 2;
    leftArm.position.set(-0.56, 1.12, -0.15);
    custGroup.add(leftArm);

    const rightArmGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.75, 12);
    const rightArm = new THREE.Mesh(rightArmGeo, skinMat);
    rightArm.rotation.x = Math.PI / 2;
    rightArm.position.set(0.56, 1.12, -0.15);
    custGroup.add(rightArm);

    return custGroup;
  };

  // Sinh mô hình 3D Nhân vật Kỹ thuật viên ngồi ghế xoay thao tác dịch vụ
  const createTechnicianFigure = (session, isDark) => {
    const techGroup = new THREE.Group();
    techGroup.name = `technician_avatar_${session?.id || 'active'}`;
    // Đặt KTV ngồi trên ghế xoay bên cạnh hông giường phía trên (cạnh bàn tinh dầu)
    techGroup.position.set(1.08, 0, -0.25);
    // Hướng nhìn và tư thế hơi xoay và nghiêng người về phía giường và đầu khách
    techGroup.rotation.y = -Math.PI * 0.62;

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.15
    });

    // -------------------------------------------------------------
    // A. GHẾ XOAY SALON / SPA ERGONOMIC STOOL
    // -------------------------------------------------------------
    const stoolGroup = new THREE.Group();

    // 1. Đế 5 chấu có bánh xe di chuyển
    const hubMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.08, 0.05, 16),
      chromeMat
    );
    hubMesh.position.y = 0.05;
    stoolGroup.add(hubMesh);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5;
      const legGeo = new THREE.BoxGeometry(0.24, 0.02, 0.035);
      const legMesh = new THREE.Mesh(legGeo, legMat);
      legMesh.position.set(Math.cos(angle) * 0.12, 0.045, Math.sin(angle) * 0.12);
      legMesh.rotation.y = -angle;
      stoolGroup.add(legMesh);

      const wheelMesh = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), wheelMat);
      wheelMesh.position.set(Math.cos(angle) * 0.23, 0.022, Math.sin(angle) * 0.23);
      stoolGroup.add(wheelMesh);
    }

    // 2. Trục nâng hơi ben thủy lực kim loại
    const pistonMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.42, 16),
      chromeMat
    );
    pistonMesh.position.y = 0.24;
    stoolGroup.add(pistonMesh);

    // 3. Đệm ngồi tròn bọc da cao cấp
    const seatMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x0f172a : 0x1e293b,
      roughness: 0.35,
      metalness: 0.1
    });
    const seatMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.24, 0.07, 24),
      seatMat
    );
    seatMesh.position.y = 0.48;
    seatMesh.castShadow = true;
    stoolGroup.add(seatMesh);

    techGroup.add(stoolGroup);

    // -------------------------------------------------------------
    // B. NHÂN VẬT KỸ THUẬT VIÊN NGỒI LÀM DỊCH VỤ
    // -------------------------------------------------------------
    const bodyGroup = new THREE.Group();

    // Vật liệu da & đồng phục chuẩn GloPro
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf5d0b5,
      roughness: 0.55,
      metalness: 0.05
    });

    // Đồng phục Spa màu Xanh Navy / GloPro Blue thanh lịch
    const uniformMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x0284c7 : 0x0369a1, // GloPro Professional Blue
      roughness: 0.45,
      metalness: 0.1
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x0f172a : 0x1e293b, // Deep Charcoal Navy Pants
      roughness: 0.6
    });

    // 1. Chân & Đầu gối ngồi trên ghế
    const thighGeo = new THREE.CylinderGeometry(0.06, 0.055, 0.28, 14);
    const leftThigh = new THREE.Mesh(thighGeo, pantsMat);
    leftThigh.rotation.x = Math.PI / 2.2;
    leftThigh.position.set(-0.08, 0.49, 0.12);
    bodyGroup.add(leftThigh);

    const rightThigh = new THREE.Mesh(thighGeo, pantsMat);
    rightThigh.rotation.x = Math.PI / 2.2;
    rightThigh.position.set(0.08, 0.49, 0.12);
    bodyGroup.add(rightThigh);

    // Cẳng chân từ đầu gối xuống sàn
    const calfGeo = new THREE.CylinderGeometry(0.048, 0.042, 0.36, 14);
    const leftCalf = new THREE.Mesh(calfGeo, pantsMat);
    leftCalf.position.set(-0.08, 0.25, 0.24);
    bodyGroup.add(leftCalf);

    const rightCalf = new THREE.Mesh(calfGeo, pantsMat);
    rightCalf.position.set(0.08, 0.25, 0.24);
    bodyGroup.add(rightCalf);

    // Giày salon trắng chuyên nghiệp
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const shoeGeo = new THREE.BoxGeometry(0.07, 0.05, 0.13);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(-0.08, 0.05, 0.27);
    bodyGroup.add(leftShoe);

    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0.08, 0.05, 0.27);
    bodyGroup.add(rightShoe);

    // 2. Thân trên & Áo đồng phục (Tư thế ngồi hơi nghiêng về phía trước để chăm sóc khách)
    const upperBodyGroup = new THREE.Group();
    upperBodyGroup.position.set(0, 0.54, 0.02);
    upperBodyGroup.rotation.x = 0.16;

    // Thân áo
    const torsoMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.38, 0.2),
      uniformMat
    );
    torsoMesh.position.y = 0.19;
    torsoMesh.castShadow = true;
    upperBodyGroup.add(torsoMesh);

    // Viền cổ áo trắng
    const collarMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.04, 0.21),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    collarMesh.position.set(0, 0.37, 0);
    upperBodyGroup.add(collarMesh);

    // Bảng tên nhân viên vàng nhỏ trên ngực trái
    const badgeMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.025, 0.01),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 })
    );
    badgeMesh.position.set(-0.09, 0.27, 0.105);
    upperBodyGroup.add(badgeMesh);

    // 3. Cánh tay & Bàn tay thao tác dịch vụ (Arms extended forward towards treatment zone)
    const armMat = uniformMat;
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Găng tay trị liệu spa xanh ngọc tiệt trùng
      roughness: 0.2,
      metalness: 0.1
    });

    // Cánh tay trái
    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.22, 12), armMat);
    lUpperArm.position.set(-0.20, 0.25, 0.06);
    lUpperArm.rotation.x = 0.55;
    upperBodyGroup.add(lUpperArm);

    const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.22, 12), gloveMat);
    lForearm.position.set(-0.16, 0.14, 0.22);
    lForearm.rotation.x = 1.35;
    lForearm.rotation.z = -0.25;
    upperBodyGroup.add(lForearm);

    // Cánh tay phải
    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.22, 12), armMat);
    rUpperArm.position.set(0.20, 0.25, 0.06);
    rUpperArm.rotation.x = 0.55;
    upperBodyGroup.add(rUpperArm);

    const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.22, 12), gloveMat);
    rForearm.position.set(0.16, 0.14, 0.22);
    rForearm.rotation.x = 1.35;
    rForearm.rotation.z = 0.25;
    upperBodyGroup.add(rForearm);

    // 4. Cổ & Đầu & Tóc bới gọn gàng
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 12), skinMat);
    neckMesh.position.y = 0.41;
    upperBodyGroup.add(neckMesh);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 20), skinMat);
    headMesh.position.y = 0.51;
    headMesh.castShadow = true;
    upperBodyGroup.add(headMesh);

    // Tóc bới cao gọn gàng chuyên nghiệp (Chignon Bun)
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 });
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 18), hairMat);
    hairCap.position.set(0, 0.53, -0.02);
    upperBodyGroup.add(hairCap);

    const bunMesh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 14), hairMat);
    bunMesh.position.set(0, 0.57, -0.11);
    upperBodyGroup.add(bunMesh);

    // Khẩu trang y tế / spa trắng sạch sẽ
    const maskMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.055, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    maskMesh.position.set(0, 0.49, 0.09);
    upperBodyGroup.add(maskMesh);

    bodyGroup.add(upperBodyGroup);
    techGroup.add(bodyGroup);

    return techGroup;
  };

  // Sinh mô hình 3D Giường Spa Cao Cấp (Luxury Contoured Bed Model with Treatment Lamp & Avatars)
  const createLuxuryBedModel = (bed, statusConfig, shadowTex, session = null) => {
    const group = new THREE.Group();
    group.name = `luxury_bed_${bed.id}`;

    const isDark = themeMode === 'dark';

    // 1. Bóng đổ tiếp xúc mềm trên mặt sàn
    const shadowGeo = new THREE.PlaneGeometry(2.8, 3.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: isDark ? 0.75 : 0.45,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.015;
    group.add(shadowMesh);

    // 2. Vầng hào quang mặt sàn theo màu trạng thái
    const haloTex = createGlowHaloTexture(statusConfig.colorStr);
    const haloGeo = new THREE.PlaneGeometry(3.2, 4.2);
    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTex,
      transparent: true,
      opacity: isDark ? 0.8 : 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = -Math.PI / 2;
    haloMesh.position.y = 0.02;
    group.add(haloMesh);

    // 3. Chân đế kim loại mạ vàng sâm panh / titan sang trọng
    const baseMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0xe2e8f0,
      metalness: isDark ? 0.85 : 0.4,
      roughness: 0.25
    });

    const basePlateGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.12, 32);
    const basePlate = new THREE.Mesh(basePlateGeo, baseMat);
    basePlate.position.y = 0.06;
    basePlate.castShadow = true;
    basePlate.receiveShadow = true;
    group.add(basePlate);

    // Trụ nâng kim loại
    const columnMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x94a3b8 : 0xd4d4d8,
      metalness: 0.9,
      roughness: 0.15
    });
    const columnGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.45, 32);
    const column = new THREE.Mesh(columnGeo, columnMat);
    column.position.y = 0.32;
    column.castShadow = true;
    group.add(column);

    // Khung đỡ mặt giường
    const frameMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x0f172a : 0xf1f5f9,
      metalness: 0.5,
      roughness: 0.3
    });
    const frameGeo = new THREE.BoxGeometry(1.5, 0.1, 2.5);
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 0.58;
    frame.castShadow = true;
    group.add(frame);

    // 4. Dải đèn Neon LED trạng thái quanh mép giường
    const ledMat = new THREE.MeshStandardMaterial({
      color: statusConfig.hex,
      emissive: statusConfig.hex,
      emissiveIntensity: isDark ? 1.6 : 0.95,
      roughness: 0.1
    });
    const ledGeo = new THREE.BoxGeometry(1.54, 0.05, 2.54);
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.y = 0.64;
    group.add(ledMesh);

    // 5. Nệm bọc da cao cấp (Contoured Mattress)
    const leatherMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0xf1f5f9 : 0xffffff,
      roughness: 0.35,
      metalness: 0.05
    });
    const mattressGeo = new THREE.BoxGeometry(1.46, 0.32, 2.46);
    const mattress = new THREE.Mesh(mattressGeo, leatherMat);
    mattress.position.y = 0.81;
    mattress.castShadow = true;
    mattress.receiveShadow = true;
    group.add(mattress);

    // 6. Gối đầu công thái học
    const pillowMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0xe2e8f0 : 0xf8fafc,
      roughness: 0.45,
      metalness: 0.02
    });
    const pillowGeo = new THREE.CylinderGeometry(0.24, 0.24, 1.1, 32);
    const pillow = new THREE.Mesh(pillowGeo, pillowMat);
    pillow.rotation.z = Math.PI / 2;
    pillow.position.set(0, 1.02, -0.85);
    pillow.scale.set(1, 0.35, 1.2);
    pillow.castShadow = true;
    group.add(pillow);

    // 7. Khăn trải trang trí vắt ngang giường
    const runnerMat = new THREE.MeshStandardMaterial({
      color: statusConfig.hex,
      roughness: 0.6,
      metalness: 0.1
    });
    const runnerGeo = new THREE.BoxGeometry(1.48, 0.03, 0.45);
    const runner = new THREE.Mesh(runnerGeo, runnerMat);
    runner.position.set(0, 0.98, 0.65);
    group.add(runner);

    // 8. Bàn tiện ích Spa mini bên cạnh giường
    const cartGroup = new THREE.Group();
    const cartMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0xe2e8f0,
      metalness: 0.3,
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

    // Chai tinh dầu thơm mini trên bàn
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

    // 9. Đèn Vòm Trăng Khuyết Chăm Sóc Da (Curved Arc Half-Moon Lamp)
    const lampGroup = new THREE.Group();
    lampGroup.position.set(-1.05, 0, -0.7);

    // Chân đế đèn
    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.04, 24),
      new THREE.MeshStandardMaterial({ color: isDark ? 0x334155 : 0xd4d4d8, metalness: 0.85 })
    );
    lampBase.position.y = 0.02;
    lampGroup.add(lampBase);

    // Cột thẳng
    const lampPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 1.8, 16),
      new THREE.MeshStandardMaterial({ color: isDark ? 0x94a3b8 : 0x71717a, metalness: 0.9 })
    );
    lampPole.position.y = 0.92;
    lampGroup.add(lampPole);

    // Chao đèn bán nguyệt vòm phía trên đầu giường
    const archGeo = new THREE.TorusGeometry(0.5, 0.03, 16, 32, Math.PI);
    const archMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffedd5,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.rotation.z = -Math.PI / 2;
    arch.rotation.y = Math.PI / 4;
    arch.position.set(0.35, 1.85, 0);
    lampGroup.add(arch);

    group.add(lampGroup);

    // 10. Hiển thị nhân vật Khách hàng & Nhân viên phục vụ khi vị trí đang bận, sắp hoàn thành hoặc quá giờ
    const statusKey = session ? (session.status || 'in_progress') : 'available';
    const isOccupied = statusKey === 'in_progress' || statusKey === 'nearly_finished' || statusKey === 'overtime';
    const isWaiting = statusKey === 'waiting';

    // A. Nhân vật Khách hàng đại diện nằm trên giường làm dịch vụ
    if ((isOccupied || isWaiting) && session) {
      const customerFigure = createCustomerFigure(session, isDark);
      group.add(customerFigure);
    }

    // B. Nhân vật Nhân viên đại diện ngồi ghế xoay thao tác dịch vụ
    if (isOccupied && session) {
      const techName = session.technician_name || session.staff_name || session.employee_name;
      const hasTech = Boolean(techName && !techName.toLowerCase().includes('chưa') && techName !== 'Unassigned');
      // Hiển thị KTV khi có nhân viên phục vụ hoặc trong ca làm dịch vụ
      if (hasTech || !techName) {
        const technicianFigure = createTechnicianFigure(session, isDark);
        group.add(technicianFigure);
      }
    }

    // Hitbox vô hình bắt click/hover
    const hitboxGeo = new THREE.BoxGeometry(2.8, 2.6, 3.4);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    hitbox.position.y = 1.3;
    hitbox.userData = { isBedHitbox: true, bedId: bed.id, bedData: bed };
    group.add(hitbox);

    return { group, ledMesh, haloMesh, hitbox };
  };

  // Tự động tính toán & điều chỉnh vị trí hiển thị popup linh hoạt theo không gian màn hình
  // (Tự động lật xuống dưới khi ở sát mép trên, lật lên trên khi ở sát mép dưới, căn lề trái/phải không bị tràn viền)
  const updatePopupPlacement = (containerEl) => {
    if (!containerEl || !mountRef.current) return;
    const cRect = mountRef.current.getBoundingClientRect();
    const pillEl = containerEl.querySelector('.bed-spatial-pill') || containerEl;
    const pRect = pillEl.getBoundingClientRect();

    // 1. Khoảng cách theo phương dọc (Y)
    const spaceAbove = pRect.top - cRect.top;
    const spaceBelow = cRect.bottom - pRect.bottom;

    // Chiều cao card trung bình ~330px.
    // Nếu khoảng trống phía trên < 360px và phía dưới rộng hơn hoặc đủ chỗ (>= 240px) -> Lật xuống dưới!
    if (spaceAbove < 360 && spaceBelow >= 240) {
      containerEl.classList.add('placement-bottom');
      containerEl.classList.remove('placement-top');
    } else {
      containerEl.classList.add('placement-top');
      containerEl.classList.remove('placement-bottom');
    }

    // 2. Khoảng cách theo phương ngang (X)
    const pillCenter = pRect.left + pRect.width / 2;
    const distFromLeft = pillCenter - cRect.left;
    const distFromRight = cRect.right - pillCenter;
    const halfCardWidth = 175; // 350px / 2

    if (distFromLeft < halfCardWidth + 16) {
      // Sát mép trái màn hình
      containerEl.classList.add('align-left');
      containerEl.classList.remove('align-right', 'align-center');
    } else if (distFromRight < halfCardWidth + 16) {
      // Sát mép phải màn hình
      containerEl.classList.add('align-right');
      containerEl.classList.remove('align-left', 'align-center');
    } else {
      // Căn giữa
      containerEl.classList.add('align-center');
      containerEl.classList.remove('align-left', 'align-right');
    }
  };

  // Tạo Floating Spatial Card bằng CSS2D (Mặc định hiển thị pill gọn gàng, hover hiển thị đầy đủ thông tin & action)
  const createBedCSS2DElement = (bed, room, session) => {
    const statusKey = session ? (session.status || 'in_progress') : 'available';
    const cfg = STATUS_THEME[statusKey] || STATUS_THEME.available;
    const isOccupied = Boolean(session);
    const isDark = themeMode === 'dark';

    // SVG icons cho thẻ nổi 3D
    const svgBuilding = `<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`;
    const svgClock = `<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    const svgPhone = `<svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
    const svgCalendar = `<svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`;
    const svgTransfer = `<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>`;
    const svgPlay = `<svg class="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg>`;
    const svgCreditCard = `<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`;
    const svgLogout = `<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`;
    const svgSparkles = `<svg class="w-5 h-5 animate-pulse shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`;
    const svgCheck = `<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    const svgPlus = `<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

    // Trích xuất dữ liệu khách hàng
    const customer = session?.customer || {};
    const customerName = session?.customer_name || customer.name || (isOccupied ? t('rooms_beds.guest', 'Khách vãng lai') : '');
    const customerPhone = session?.customer_phone || customer.phone || '—';
    const customerDob = customer.dob || customer.birthday || '—';

    // Danh sách dịch vụ thực hiện trên giường này
    const rawServices = (session?.services && session.services.length > 0)
      ? session.services
      : session?.service_name
        ? [{
            service_name: session.service_name,
            staff_name: session.technician_name || session.staff_name || '',
            staff_id: session.technician_id || session.staff_id,
            price: session.price || 0
          }]
        : [{
            service_name: t('rooms_beds.standard_service', 'Dịch vụ Spa'),
            staff_name: session?.technician_name || '',
            price: session?.price || 0
          }];

    const servicesList = rawServices.filter(svc => !svc.bed_id || String(svc.bed_id) === String(bed.id));

    // Tập hợp KTV phụ trách
    const staffMap = new Map();
    servicesList.forEach(svc => {
      const sName = svc.staff_name || svc.staff?.name || svc.staff?.full_name || '';
      const sId = svc.staff_id || svc.staff?.id;
      if (!sId && !sName) return;

      const matched = (callbacksRef.current.staff || []).find(st =>
        (sId && st.id === sId) ||
        (sName && (st.full_name === sName || st.name === sName))
      );

      const key = matched?.id || sId || sName;
      const finalName = matched?.full_name || matched?.name || sName;
      const finalColor = svc.staff_color || matched?.avatar_color || '#0ea5e9';

      if (!staffMap.has(key)) {
        staffMap.set(key, { name: finalName, color: finalColor, count: 1 });
      }
    });

    if (staffMap.size === 0 && (session?.technician_name || session?.staff_name)) {
      const sName = session.technician_name || session.staff_name;
      const matched = (callbacksRef.current.staff || []).find(st =>
        (st.full_name === sName || st.name === sName)
      );
      staffMap.set(sName, {
        name: matched?.full_name || matched?.name || sName,
        color: matched?.avatar_color || '#0ea5e9',
        count: 1
      });
    }

    const assignedStaffList = Array.from(staffMap.values());

    // Thời gian và tiến độ
    const startTime = session?.start_time || '08:00';
    const endTime = session?.end_time || '09:15';
    const elapsedMins = session?.elapsed_minutes ?? 0;
    const remainingMins = session?.remaining_minutes ?? 0;
    const progressPercent = Math.min(100, Math.max(0, session?.progress_percent ?? 0));
    const overtimeMins = session?.overtime_minutes ?? 0;
    const isOver = statusKey === 'overtime';
    const isWaiting = statusKey === 'waiting';
    const isCleaning = statusKey === 'cleaning';
    const cleaningInfo = session?.cleaning_info || null;

    const div = document.createElement('div');
    div.className = 'bed-spatial-container select-none pointer-events-auto';
    div.setAttribute('data-bed-id', bed.id);

    div.innerHTML = `
      <!-- 1. Trạng thái Pill gọn gàng mặc định (Không che khuất không gian 3D) -->
      <div class="bed-spatial-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-xl cursor-pointer transition-all duration-200 ${
        isDark 
          ? 'bg-slate-950/85 text-white border-white/15 hover:border-sky-500/50' 
          : 'bg-white/95 text-slate-800 border-slate-200/90 hover:border-sky-500/50 shadow-md'
      }">
        <span class="relative flex h-2 w-2 shrink-0">
          ${isOccupied && !isWaiting ? `<span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style="background: ${cfg.colorStr}"></span>` : ''}
          <span class="relative inline-flex rounded-full h-2 w-2" style="background: ${cfg.colorStr}"></span>
        </span>
        <span class="text-xs font-bold tracking-tight">${bed.name || 'Vị trí'}</span>
        ${isOccupied ? `
          <span class="text-[10px] font-medium ${isOver ? 'text-rose-400 font-bold' : isDark ? 'text-slate-400' : 'text-slate-500'}">
            · ${isOver ? 'Quá giờ' : isCleaning ? 'Đang dọn' : isWaiting ? 'Chờ KTV' : `Còn ${remainingMins}p`}
          </span>
        ` : ''}
      </div>

      <!-- 2. Thẻ Popup Chi Tiết Khi Hover (Đầy đủ thông tin như ở dạng lưới) -->
      <div class="bed-spatial-card w-[330px] sm:w-[350px] rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl border text-left cursor-default ${
        isDark 
          ? 'bg-slate-950/95 text-white border-white/15' 
          : 'bg-white/95 text-slate-900 border-slate-200/90 shadow-2xl'
      }" style="filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.45));">
        <!-- Glowing Top Accent Line -->
        <div class="absolute -top-[1px] left-4 right-4 h-[2px] rounded-full" style="background: ${cfg.colorStr}; box-shadow: 0 0 10px ${cfg.colorStr};"></div>

        <!-- Header: Tên phòng | Tên giường + Badge trạng thái -->
        <div class="flex items-center justify-between pb-2.5 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}">
          <div class="flex items-center gap-1.5 text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}">
            ${svgBuilding}
            <span>${room?.name || 'Phòng'} | ${bed.name || 'Vị trí'}</span>
          </div>
          <span class="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border uppercase ${cfg.cssBadge}">
            ${cfg.label}
          </span>
        </div>

        ${isCleaning ? `
          <!-- Khi ở trạng thái Đang Dọn Dẹp -->
          <div class="py-3 space-y-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                ${svgSparkles}
              </div>
              <div>
                <h4 class="text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}">Vệ sinh & Thay ga gối</h4>
                <p class="text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5">
                  Thời gian quy định: <span class="font-bold text-teal-400">${session?.cleaning_duration_minutes || bed.cleaning_duration || 10} phút</span>
                </p>
              </div>
            </div>
            <div class="space-y-1 pt-1">
              <div class="flex items-center justify-between text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}">
                <span>Đang dọn dẹp...</span>
                <span class="font-bold text-teal-400">
                  ${cleaningInfo ? `Còn ${cleaningInfo.remainingMinutes} phút` : 'Đang xử lý'}
                </span>
              </div>
              <div class="w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}">
                <div class="h-full bg-teal-500 rounded-full transition-all duration-500" style="width: ${cleaningInfo?.progressPercent || 50}%"></div>
              </div>
            </div>
          </div>
          <div class="pt-2.5 border-t ${isDark ? 'border-white/10' : 'border-slate-100'} grid grid-cols-3 gap-1.5 w-full">
            <button
              type="button"
              data-action="transfer"
              class="w-full min-w-0 px-2 py-2 text-[11px] font-bold rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                isDark ? 'border-sky-500/40 text-sky-400 hover:bg-sky-500/10' : 'border-sky-300 text-sky-600 hover:bg-sky-50'
              }"
              title="Chuyển phòng"
            >
              ${svgTransfer}
              <span class="truncate">Chuyển</span>
            </button>
            <button
              type="button"
              data-action="main"
              class="w-full min-w-0 px-2 py-2 text-[11px] font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center gap-1 cursor-pointer shadow-md transition-colors"
              title="Xong dọn dẹp"
            >
              ${svgCheck}
              <span class="truncate">Xong dọn</span>
            </button>
            <button
              type="button"
              data-action="release"
              class="w-full min-w-0 px-2 py-2 text-[11px] font-bold rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                isDark ? 'border-rose-500/40 text-rose-400 hover:bg-rose-500/10' : 'border-rose-300 text-rose-600 hover:bg-rose-50'
              }"
              title="Trả phòng"
            >
              ${svgLogout}
              <span class="truncate">Trả giường</span>
            </button>
          </div>
        ` : isOccupied ? `
          <!-- Khách hàng (Không hiển thị avatar tròn) -->
          <div class="py-2.5 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}">
            <div class="flex items-center justify-between gap-2">
              <h4 class="text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}">${customerName}</h4>
              ${customerPhone !== '—' ? `
                <div class="flex items-center gap-1 text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'} shrink-0">
                  ${svgPhone}
                  <span>${customerPhone}</span>
                </div>
              ` : ''}
            </div>
            ${customerDob !== '—' ? `
              <div class="flex items-center gap-1 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1">
                ${svgCalendar}
                <span>Ngày sinh: ${customerDob}</span>
              </div>
            ` : ''}
          </div>

          <!-- KTV xếp vào vị trí (Không hiển thị avatar tròn) -->
          <div class="py-2 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}">
            <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1.5">
              <span>Nhân viên xếp vào vị trí (${assignedStaffList.length})</span>
              ${assignedStaffList.length > 1 ? `
                <span class="text-[9px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-full border border-sky-500/20">
                  ${assignedStaffList.length} KTV phối hợp
                </span>
              ` : assignedStaffList.length === 1 ? `
                <span class="text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-normal">1 KTV phụ trách</span>
              ` : ''}
            </div>

            ${assignedStaffList.length > 0 ? `
              <div class="flex flex-wrap gap-1.5">
                ${assignedStaffList.map(st => `
                  <div class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold border ${
                    isDark ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-700'
                  }">
                    <span class="text-[11px] truncate max-w-[140px]">${st.name}</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="text-[11px] italic ${isDark ? 'text-slate-500' : 'text-slate-400'}">Chưa phân công KTV</div>
            `}
          </div>

          <!-- Dịch vụ thực hiện -->
          <div class="py-2 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}">
            <div class="text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1.5">
              Dịch vụ thực hiện (${servicesList.length})
            </div>
            <div class="space-y-1.5 max-h-[105px] overflow-y-auto pr-1">
              ${servicesList.map(svc => `
                <div class="flex items-center justify-between text-xs p-1.5 rounded-xl ${
                  isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50/90 border border-slate-100'
                }">
                  <div class="min-w-0 flex-1 pr-2">
                    <div class="font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}">
                      ${svc.service_name || svc.name || 'Dịch vụ'}
                      ${svc.is_from_package ? `<span class="ml-1 text-[9px] px-1 py-0.2 rounded font-normal bg-emerald-500/15 text-emerald-400">Gói</span>` : ''}
                    </div>
                    ${svc.staff_name ? `
                      <div class="text-[10px] text-sky-400 truncate mt-0.5">KTV: ${svc.staff_name}</div>
                    ` : ''}
                  </div>
                  <div class="font-bold shrink-0 text-right ${isDark ? 'text-slate-200' : 'text-slate-900'}">
                    ${svc.is_from_package ? '0 ₫' : formatVND(svc.price || 0)}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Timeline & Tiến độ -->
          <div class="py-2 border-b ${isDark ? 'border-white/10' : 'border-slate-100'} space-y-1.5">
            <div class="flex items-center justify-between text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}">
              <div class="flex items-center gap-1.5">
                ${svgClock}
                <span>Bắt đầu: <strong class="${isDark ? 'text-slate-200' : 'text-slate-700'}">${startTime}</strong></span>
                <span class="opacity-40">|</span>
                <span>Kết thúc: <strong class="${isDark ? 'text-slate-200' : 'text-slate-700'}">${endTime}</strong></span>
              </div>
            </div>
            <div class="flex items-center justify-between text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}">
              <span>Đã qua: <strong class="${isDark ? 'text-slate-200' : 'text-slate-700'}">${elapsedMins} phút</strong></span>
              <span>
                ${isOver ? `
                  <strong class="text-rose-500 dark:text-rose-400">100% (quá ${overtimeMins} phút)</strong>
                ` : isWaiting ? `
                  <strong class="text-sky-500 dark:text-sky-400">0% (Đang chờ)</strong>
                ` : `
                  <strong class="${isDark ? 'text-slate-200' : 'text-slate-700'}">${progressPercent}%</strong>
                `}
              </span>
            </div>
            <div class="w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}">
              <div class="h-full rounded-full transition-all duration-300" style="width: ${isWaiting ? 10 : progressPercent}%; background: ${cfg.colorStr}; box-shadow: 0 0 8px ${cfg.colorStr};"></div>
            </div>
          </div>

          <!-- Action Buttons (3 cột chuẩn mực) -->
          <div class="pt-2.5 grid grid-cols-3 gap-1.5 w-full">
            <button
              type="button"
              data-action="transfer"
              class="w-full min-w-0 px-2 py-2 text-[11px] font-bold rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                isDark ? 'border-sky-500/40 text-sky-400 hover:bg-sky-500/10' : 'border-sky-300 text-sky-600 hover:bg-sky-50'
              }"
              title="Chuyển phòng"
            >
              ${svgTransfer}
              <span class="truncate">Chuyển</span>
            </button>

            ${(isWaiting || statusKey === 'reserved') ? `
              <button
                type="button"
                data-action="main"
                class="w-full min-w-0 px-2 py-2 text-[11px] font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 cursor-pointer shadow-md transition-colors"
                title="Bắt đầu phục vụ"
              >
                ${svgPlay}
                <span class="truncate">${isWaiting ? 'Phục vụ' : 'Bắt đầu'}</span>
              </button>
            ` : `
              <button
                type="button"
                data-action="main"
                class="w-full min-w-0 px-2 py-2 text-[11px] font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 cursor-pointer shadow-md transition-colors"
                title="Thanh toán"
              >
                ${svgCreditCard}
                <span class="truncate">Thanh toán</span>
              </button>
            `}

            <button
              type="button"
              data-action="release"
              class="w-full min-w-0 px-2 py-2 text-[11px] font-bold rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                isDark ? 'border-rose-500/40 text-rose-400 hover:bg-rose-500/10' : 'border-rose-300 text-rose-600 hover:bg-rose-50'
              }"
              title="Trả phòng"
            >
              ${svgLogout}
              <span class="truncate">Trả giường</span>
            </button>
          </div>
        ` : `
          <!-- Vị trí đang trống -->
          <div class="py-3 text-center space-y-1">
            <div class="text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}">
              Vị trí đang trống
            </div>
            <div class="text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}">
              Sẵn sàng tiếp nhận khách hàng mới
            </div>
          </div>
          <div class="pt-2 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}">
            <button
              type="button"
              data-action="assign"
              class="w-full py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
              ${svgPlus}
              <span>Xếp chỗ / Đặt trước</span>
            </button>
          </div>
        `}
      </div>
    `;

    // Gắn sự kiện tương tác
    const btnTransfer = div.querySelector('[data-action="transfer"]');
    if (btnTransfer) {
      btnTransfer.onclick = (e) => {
        e.stopPropagation();
        callbacksRef.current.onTransferRoom?.(bed, session);
      };
    }

    const btnMain = div.querySelector('[data-action="main"]');
    if (btnMain) {
      btnMain.onclick = (e) => {
        e.stopPropagation();
        if (statusKey === 'cleaning') {
          callbacksRef.current.onFinishCleaning?.(bed, session);
        } else if (statusKey === 'waiting' || statusKey === 'reserved') {
          callbacksRef.current.onStartServing?.(bed, session);
        } else {
          callbacksRef.current.onCheckout?.(bed, session);
        }
      };
    }

    const btnRelease = div.querySelector('[data-action="release"]');
    if (btnRelease) {
      btnRelease.onclick = (e) => {
        e.stopPropagation();
        callbacksRef.current.onReleaseBed?.(bed, session);
      };
    }

    const btnAssign = div.querySelector('[data-action="assign"]');
    if (btnAssign) {
      btnAssign.onclick = (e) => {
        e.stopPropagation();
        callbacksRef.current.onSelectBed?.(bed);
      };
    }

    const pillEl = div.querySelector('.bed-spatial-pill');
    if (pillEl) {
      pillEl.onclick = (e) => {
        e.stopPropagation();
        callbacksRef.current.onSelectBed?.(bed);
      };
    }

    const cardEl = div.querySelector('.bed-spatial-card');
    if (cardEl) {
      cardEl.onclick = (e) => {
        if (!e.target.closest('button')) {
          e.stopPropagation();
          callbacksRef.current.onSelectBed?.(bed);
        }
      };
    }

    div.onmouseenter = () => {
      updatePopupPlacement(div);
      div.classList.add('is-hovered');
      div.style.zIndex = '999999';
      if (div.parentNode) {
        div.parentNode.appendChild(div);
      }
    };
    div.onmouseleave = () => {
      div.classList.remove('is-hovered');
      div.style.zIndex = '10';
    };

    div.onclick = (e) => {
      e.stopPropagation();
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
    const bgCol = isDark ? 0x090d16 : 0xf8fafc;
    scene.background = new THREE.Color(bgCol);
    scene.fog = new THREE.FogExp2(bgCol, isDark ? 0.012 : 0.007);

    // 2. Camera setup: Góc quay Isometric điện ảnh (FOV 32)
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 1000);
    camera.position.set(0, 24, 38);
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
    renderer.toneMappingExposure = isDark ? 1.25 : 1.2;
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
    controls.minDistance = 6;
    controls.maxDistance = 85;
    controls.maxPolarAngle = Math.PI / 2.08;
    controls.target.set(0, 1.2, 5);
    controlsRef.current = controls;

    // Cập nhật vị trí popup linh hoạt theo góc quay camera
    controls.addEventListener('change', () => {
      bedMeshesRef.current.forEach(item => {
        if (item.labelObj?.element && (item.labelObj.element.classList.contains('is-hovered') || item.labelObj.element.matches(':hover'))) {
          updatePopupPlacement(item.labelObj.element);
        }
      });
    });

    // 6. Ánh sáng Kiến Trúc Studio & Đèn sảnh ấm cúng
    const hemiLight = new THREE.HemisphereLight(
      isDark ? 0x93c5fd : 0xffedd5,
      isDark ? 0x0f172a : 0xf1f5f9,
      isDark ? 0.9 : 1.3
    );
    hemiLight.position.set(0, 40, 0);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(isDark ? 0x334155 : 0xffffff, isDark ? 0.7 : 0.85);
    scene.add(ambientLight);

    // Đèn chính (Key Directional Sun) tạo bóng đổ mềm
    const sunLight = new THREE.DirectionalLight(isDark ? 0xffffff : 0xffedd5, isDark ? 2.2 : 2.5);
    sunLight.position.set(20, 45, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    // Đèn phụ dịu mắt (Fill Light)
    const fillLight = new THREE.DirectionalLight(isDark ? 0x38bdf8 : 0xbae6fd, isDark ? 0.8 : 0.6);
    fillLight.position.set(-25, 20, -25);
    scene.add(fillLight);

    // 7. Lưới sàn định hướng không gian
    const gridHelper = new THREE.GridHelper(90, 45, isDark ? 0x1e293b : 0xe2e8f0, isDark ? 0x0f172a : 0xf1f5f9);
    gridHelper.position.y = -0.01;
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
      if (cashierHitboxRef.current) hitboxes.push(cashierHitboxRef.current);
      if (loungeHitboxRef.current) hitboxes.push(loungeHitboxRef.current);

      const intersects = raycaster.intersectObjects(hitboxes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        renderer.domElement.style.cursor = 'pointer';
        if (hit.userData.isBedHitbox) {
          const bId = hit.userData.bedId;
          setHoveredBed(hit.userData.bedData);
          bedMeshesRef.current.forEach((item, id) => {
            if (item.labelObj && item.labelObj.element) {
              if (id === bId) {
                updatePopupPlacement(item.labelObj.element);
                item.labelObj.element.classList.add('is-hovered');
                item.labelObj.element.style.zIndex = '999999';
                if (item.labelObj.element.parentNode) {
                  item.labelObj.element.parentNode.appendChild(item.labelObj.element);
                }
              } else if (!item.labelObj.element.matches(':hover')) {
                item.labelObj.element.classList.remove('is-hovered');
                item.labelObj.element.style.zIndex = '10';
              }
            }
          });
        } else {
          bedMeshesRef.current.forEach(item => {
            if (item.labelObj && item.labelObj.element && !item.labelObj.element.matches(':hover')) {
              item.labelObj.element.classList.remove('is-hovered');
              item.labelObj.element.style.zIndex = '10';
            }
          });
        }
      } else {
        renderer.domElement.style.cursor = 'default';
        setHoveredBed(null);
        bedMeshesRef.current.forEach(item => {
          if (item.labelObj && item.labelObj.element && !item.labelObj.element.matches(':hover')) {
            item.labelObj.element.classList.remove('is-hovered');
            item.labelObj.element.style.zIndex = '10';
          }
        });
      }
    };

    const handlePointerLeave = () => {
      renderer.domElement.style.cursor = 'default';
      setHoveredBed(null);
      bedMeshesRef.current.forEach(item => {
        if (item.labelObj && item.labelObj.element && !item.labelObj.element.matches(':hover')) {
          item.labelObj.element.classList.remove('is-hovered');
          item.labelObj.element.style.zIndex = '10';
        }
      });
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
      if (cashierHitboxRef.current) hitboxes.push(cashierHitboxRef.current);
      if (loungeHitboxRef.current) hitboxes.push(loungeHitboxRef.current);

      const intersects = raycaster.intersectObjects(hitboxes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData.isCashierHitbox || hit.userData.isLoungeHitbox) {
          handleFocusCashier();
          return;
        }

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
    domEl.addEventListener('pointerleave', handlePointerLeave);

    // 9. Animation Loop (hỗ trợ Auto-Tour quay chậm)
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.autoRotate = isAutoTour;
        controlsRef.current.autoRotateSpeed = 0.8;
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    // 10. Resize Observer
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
      domEl.removeEventListener('pointerleave', handlePointerLeave);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (animFlightRef.current) cancelAnimationFrame(animFlightRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (labelRenderer.domElement && container.contains(labelRenderer.domElement)) {
        container.removeChild(labelRenderer.domElement);
      }
      renderer.dispose();
    };
  }, [themeMode, isAutoTour]);

  // Lướt camera điện ảnh mượt mà đến vị trí đích (Smooth Cinematic Flight)
  const animateCameraFlight = (endTarget, endCamPos, duration = 650) => {
    if (!controlsRef.current || !cameraRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    if (animFlightRef.current) {
      cancelAnimationFrame(animFlightRef.current);
      animFlightRef.current = null;
    }

    const startTarget = controls.target.clone();
    const startCamPos = camera.position.clone();
    const startTime = performance.now();

    const step = () => {
      const now = performance.now();
      const progress = Math.min((now - startTime) / duration, 1);
      // Cubic ease-out cho chuyển động camera đầm và êm ái
      const ease = 1 - Math.pow(1 - progress, 3);

      controls.target.lerpVectors(startTarget, endTarget, ease);
      camera.position.lerpVectors(startCamPos, endCamPos, ease);
      controls.update();

      if (progress < 1) {
        animFlightRef.current = requestAnimationFrame(step);
      } else {
        animFlightRef.current = null;
      }
    };
    animFlightRef.current = requestAnimationFrame(step);
  };

  // Focus đối tượng tương thích theo cameraMode hiện hành
  const focusCameraOnObject = (targetPos) => {
    const curMode = cameraModeRef.current || 'iso';
    let offset = new THREE.Vector3(9.5, 9.0, 11.0);
    if (curMode === 'top') {
      offset = new THREE.Vector3(0, 18.0, 0.1);
    } else if (curMode === 'front') {
      offset = new THREE.Vector3(0, 5.5, 13.5);
    }
    const endTarget = new THREE.Vector3(targetPos.x, targetPos.y + 0.8, targetPos.z);
    const endCamPos = endTarget.clone().add(offset);
    animateCameraFlight(endTarget, endCamPos);
  };

  // Tái tạo Cửa Hàng, Quầy Thu Ngân, Phòng & Giường trong không gian 3D
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Dọn dẹp an toàn toàn bộ các thẻ DOM CSS2D cũ để tránh lặp trùng lặp
    if (labelRendererRef.current?.domElement) {
      labelRendererRef.current.domElement.replaceChildren();
    }

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
    cashierHitboxRef.current = null;
    loungeHitboxRef.current = null;

    const oldRooms = scene.children.filter(c => c && c.name && typeof c.name === 'string' && (c.name.startsWith('room_arch_') || c.name.startsWith('store_')));
    oldRooms.forEach(r => {
      if (r) {
        try { scene.remove(r); } catch (_) {}
      }
    });

    const isDark = themeMode === 'dark';
    const shadowTex = contactShadowTexRef.current || createContactShadowTexture();
    const oakTex = createOakFloorTexture(isDark);
    const marbleTex = createMarbleTexture();
    const flutedTex = createFlutedWoodTexture(isDark);
    const signTex = createSignTexture(isDark);

    const ROOM_SPACING_X = 16.5;
    const ROOM_SPACING_Z = 14.5;
    const totalRooms = bedsByRoom.length;
    const columns = Math.max(1, Math.ceil(Math.sqrt(totalRooms || 1)));

    // Tính toán biên giới của các phòng để đặt sảnh đón tiếp phía trước
    const maxRow = Math.max(0, Math.floor((totalRooms - 1) / columns));
    const lobbyZ = (maxRow - (Math.ceil(totalRooms / columns) - 1) / 2) * ROOM_SPACING_Z + 13;
    lobbyPosRef.current.set(0, 1.2, lobbyZ);

    // =========================================================================
    // 1. TẠO SẢNH ĐÓN TIẾP & QUẦY THU NGÂN 3D (Reception & Cashier Lobby Zone)
    // =========================================================================
    const lobbyGroup = new THREE.Group();
    lobbyGroup.name = 'store_reception_lobby';
    lobbyGroup.position.set(0, 0, lobbyZ);

    const lobbyW = Math.max(19, columns * ROOM_SPACING_X * 0.88);
    const lobbyD = 10;

    // Sàn gỗ sồi có vân tự nhiên cao cấp
    const lobbyFloorGeo = new THREE.BoxGeometry(lobbyW, 0.25, lobbyD);
    const lobbyFloorMat = new THREE.MeshStandardMaterial({
      map: oakTex,
      roughness: isDark ? 0.45 : 0.35,
      metalness: 0.05
    });
    const lobbyFloor = new THREE.Mesh(lobbyFloorGeo, lobbyFloorMat);
    lobbyFloor.position.y = 0.125;
    lobbyFloor.receiveShadow = true;
    lobbyGroup.add(lobbyFloor);

    // Len chân tường / Viền kim loại đồng sang trọng quanh sàn sảnh
    const lobbyTrimMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x38bdf8 : 0xd97706,
      metalness: 0.85,
      roughness: 0.2
    });
    const lobbyTrimGeo = new THREE.BoxGeometry(lobbyW + 0.16, 0.08, lobbyD + 0.16);
    const lobbyTrim = new THREE.Mesh(lobbyTrimGeo, lobbyTrimMat);
    lobbyTrim.position.y = 0.25;
    lobbyGroup.add(lobbyTrim);

    // Thảm len chào mừng lối vào
    const rugGeo = new THREE.BoxGeometry(4.8, 0.02, 2.4);
    const rugMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0xe2e8f0,
      roughness: 0.95
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.position.set(0, 0.26, lobbyD / 2 - 1.5);
    lobbyGroup.add(rug);

    // VÁCH FEATURE WALL PHÍA SAU QUẦY THU NGÂN (Fluted Oak Wall with Backlit Sign)
    const wallGroup = new THREE.Group();
    wallGroup.position.set(-3.5, 0.25, -2.2);

    const featureWallGeo = new THREE.BoxGeometry(6.4, 3.4, 0.2);
    const featureWallMat = new THREE.MeshStandardMaterial({
      map: flutedTex,
      roughness: 0.5,
      metalness: 0.1
    });
    const featureWall = new THREE.Mesh(featureWallGeo, featureWallMat);
    featureWall.position.y = 1.7;
    featureWall.castShadow = true;
    wallGroup.add(featureWall);

    // Biển hiệu GlowPro phát sáng trên vách
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.5, 1.15),
      new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
    );
    signMesh.position.set(0, 2.3, 0.12);
    wallGroup.add(signMesh);

    lobbyGroup.add(wallGroup);

    // QUẦY THU NGÂN UỐN CONG NGHỆ THUẬT (Curved Reception Counter)
    const cashierGroup = new THREE.Group();
    cashierGroup.position.set(-3.5, 0.25, 0.4);

    const counterW = 4.6;
    const counterH = 1.18;
    const counterD = 1.6;
    const counterMat = new THREE.MeshStandardMaterial({
      map: flutedTex,
      roughness: 0.4,
      metalness: 0.15
    });
    const counterBody = new THREE.Mesh(new THREE.BoxGeometry(counterW, counterH, counterD), counterMat);
    counterBody.position.y = counterH / 2;
    counterBody.castShadow = true;
    cashierGroup.add(counterBody);

    // Mặt đá cẩm thạch trắng Carrara Marble
    const counterTopMat = new THREE.MeshStandardMaterial({
      map: marbleTex,
      roughness: 0.15,
      metalness: 0.15
    });
    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(counterW + 0.25, 0.09, counterD + 0.25), counterTopMat);
    counterTop.position.y = counterH + 0.045;
    counterTop.castShadow = true;
    cashierGroup.add(counterTop);

    // Dải đèn LED vàng ấm hắt chân quầy
    const cashierLed = new THREE.Mesh(
      new THREE.BoxGeometry(counterW + 0.06, 0.04, counterD + 0.06),
      new THREE.MeshBasicMaterial({ color: isDark ? 0x38bdf8 : 0xf59e0b })
    );
    cashierLed.position.y = 0.08;
    cashierGroup.add(cashierLed);

    // ĐÈN THẢ TRẦN SCANDINAVIAN PENDANT LIGHTS (3 đèn thả sang trọng)
    for (let i = -1; i <= 1; i++) {
      const dropWire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 2.2, 8),
        new THREE.MeshBasicMaterial({ color: 0x1e293b })
      );
      dropWire.position.set(i * 1.3, counterH + 1.8, 0);
      cashierGroup.add(dropWire);

      const lampShade = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.28, 24, 1, true),
        new THREE.MeshStandardMaterial({ color: isDark ? 0x38bdf8 : 0xd97706, metalness: 0.9, roughness: 0.2 })
      );
      lampShade.position.set(i * 1.3, counterH + 0.72, 0);
      cashierGroup.add(lampShade);
    }

    // Màn hình iPad POS / Thu ngân siêu mỏng
    const posStand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.08, 0.28, 16),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
    );
    posStand.position.set(-0.9, counterH + 0.2, 0.1);
    cashierGroup.add(posStand);

    const screenMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.4, 0.03),
      new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    );
    screenMesh.position.set(-0.9, counterH + 0.42, 0.08);
    screenMesh.rotation.x = -Math.PI / 8;
    cashierGroup.add(screenMesh);

    // Máy in hóa đơn & Máy quẹt thẻ
    const posDev = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.16, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
    );
    posDev.position.set(-0.3, counterH + 0.16, 0.2);
    cashierGroup.add(posDev);

    // Bình gốm hoa cỏ lau trang trí
    const vase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.15, 0.32, 16),
      new THREE.MeshStandardMaterial({ color: 0xfafaf9, roughness: 0.1 })
    );
    vase.position.set(1.5, counterH + 0.22, 0.1);
    cashierGroup.add(vase);

    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.7 })
    );
    flower.position.set(1.5, counterH + 0.46, 0.1);
    cashierGroup.add(flower);

    // Nhân viên tiếp tân 3D
    const staffGroup = new THREE.Group();
    staffGroup.position.set(0, 0, -0.9);
    const bodyMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.3, 0.85, 16),
      new THREE.MeshStandardMaterial({ color: isDark ? 0x3b82f6 : 0x0284c7, roughness: 0.5 })
    );
    bodyMesh.position.y = 0.9;
    staffGroup.add(bodyMesh);

    const headMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.4 })
    );
    headMesh.position.y = 1.5;
    staffGroup.add(headMesh);
    cashierGroup.add(staffGroup);

    // Hitbox tương tác quầy thu ngân
    const cashierHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(counterW + 0.8, counterH + 1.2, counterD + 1.6),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    cashierHitbox.position.y = counterH / 2;
    cashierHitbox.userData = { isCashierHitbox: true };
    cashierGroup.add(cashierHitbox);
    cashierHitboxRef.current = cashierHitbox;

    lobbyGroup.add(cashierGroup);

    // KHU VỰC GHẾ CHỜ KHÁCH BOUTIQUE (Curved Bouclé Sofa & Marble Table)
    const loungeGroup = new THREE.Group();
    loungeGroup.position.set(4.5, 0.25, 0.5);

    const sofaMat = new THREE.MeshStandardMaterial({ color: isDark ? 0x1e293b : 0xf8fafc, roughness: 0.8 });
    const sofaSeat = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.38, 1.4), sofaMat);
    sofaSeat.position.y = 0.35;
    sofaSeat.castShadow = true;
    loungeGroup.add(sofaSeat);

    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.72, 0.38), sofaMat);
    sofaBack.position.set(0, 0.76, -0.55);
    sofaBack.castShadow = true;
    loungeGroup.add(sofaBack);

    // Bàn trà tròn đá marble Carrara
    const coffeeTable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.06, 32),
      new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.2, metalness: 0.15 })
    );
    coffeeTable.position.set(0, 0.38, 1.45);
    loungeGroup.add(coffeeTable);

    const tableLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.36, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85 })
    );
    tableLeg.position.set(0, 0.18, 1.45);
    loungeGroup.add(tableLeg);

    // Hitbox tương tác cho toàn bộ khu vực Ghế Chờ Sofa
    const sofaHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 1.3, 2.6),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    sofaHitbox.position.set(0, 0.65, 0.5);
    sofaHitbox.userData = { isLoungeHitbox: true };
    loungeGroup.add(sofaHitbox);
    loungeHitboxRef.current = sofaHitbox;

    // Hình người 3D ngồi chờ tại sảnh nếu có khách đang chờ
    if (waitingGuests.length > 0) {
      const guestCount = Math.min(waitingGuests.length, 3);
      for (let gi = 0; gi < guestCount; gi++) {
        const guestSitting = new THREE.Group();
        const offsetX = (gi - (guestCount - 1) / 2) * 1.05;
        guestSitting.position.set(offsetX, 0.36, 0.0);

        // Thân người ngồi
        const gBody = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24, 0.28, 0.52, 16),
          new THREE.MeshStandardMaterial({
            color: gi % 2 === 0 ? 0x0284c7 : 0xd97706,
            roughness: 0.5
          })
        );
        gBody.position.y = 0.26;
        guestSitting.add(gBody);

        // Đầu người
        const gHead = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.4 })
        );
        gHead.position.y = 0.62;
        guestSitting.add(gHead);

        loungeGroup.add(guestSitting);
      }
    }

    lobbyGroup.add(loungeGroup);

    // CÂY XANH KIỂNG BOUTIQUE (Monstera in Ceramic Planter)
    const addPlant = (x, z) => {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.26, 0.75, 20),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
      );
      pot.position.set(x, 0.25 + 0.38, z);
      pot.castShadow = true;
      lobbyGroup.add(pot);

      const foliage = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.58, 1),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 })
      );
      foliage.position.set(x, 0.25 + 1.0, z);
      foliage.scale.set(1, 1.3, 1);
      foliage.castShadow = true;
      lobbyGroup.add(foliage);
    };

    addPlant(-lobbyW / 2 + 1.4, lobbyD / 2 - 1.4);
    addPlant(lobbyW / 2 - 1.4, lobbyD / 2 - 1.4);
    addPlant(0.5, -lobbyD / 2 + 1.0);



    // Đèn chiếu ấm áp quầy lễ tân
    const lobbySpot = new THREE.PointLight(0xffedd5, isDark ? 1.0 : 0.85, 16, 1.2);
    lobbySpot.position.set(-3.5, 4.2, 0.5);
    lobbyGroup.add(lobbySpot);

    scene.add(lobbyGroup);

    // =========================================================================
    // 2. TẠO CÁC PHÒNG ĐIỀU TRỊ & GIƯỜNG DỊCH VỤ (Treatment Rooms & Beds)
    // =========================================================================
    if (!bedsByRoom || bedsByRoom.length === 0) return;

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

      const roomKey = room.id || `idx_${roomIdx}`;
      const roomInfo = {
        id: roomKey,
        center: new THREE.Vector3(roomX, 0, roomZ),
        name: room.name || `Phòng ${roomIdx + 1}`
      };
      roomPositionsRef.current.set(roomKey, roomInfo);
      if (room.id) roomPositionsRef.current.set(String(room.id), roomInfo);
      if (room.name) roomPositionsRef.current.set(String(room.name), roomInfo);
      roomPositionsRef.current.set(`idx_${roomIdx}`, roomInfo);

      // 1. Sàn phòng riêng biệt với texture gỗ sồi ấm áp
      const roomW = 14.4;
      const roomD = 12.0;
      const podiumMat = new THREE.MeshStandardMaterial({
        map: oakTex,
        roughness: isDark ? 0.45 : 0.35,
        metalness: 0.05
      });
      const podiumMesh = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.25, roomD), podiumMat);
      podiumMesh.position.y = 0.125;
      podiumMesh.receiveShadow = true;
      roomGroup.add(podiumMesh);

      // Viền kim loại sang trọng xung quanh bục
      const trimMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x334155 : 0xd97706,
        metalness: 0.85,
        roughness: 0.2
      });
      const trimMesh = new THREE.Mesh(new THREE.BoxGeometry(roomW + 0.14, 0.08, roomD + 0.14), trimMat);
      trimMesh.position.y = 0.25;
      roomGroup.add(trimMesh);

      // 2. Vách kính sọc mờ kết hợp nan gỗ kiến trúc
      const partitionMat = new THREE.MeshPhysicalMaterial({
        color: isDark ? 0x38bdf8 : 0xbae6fd,
        transparent: true,
        opacity: isDark ? 0.35 : 0.45,
        roughness: 0.15,
        transmission: 0.8,
        thickness: 0.4
      });
      const partition = new THREE.Mesh(new THREE.BoxGeometry(roomW - 1, 2.4, 0.1), partitionMat);
      partition.position.set(0, 1.35, -roomD / 2 + 0.3);
      partition.castShadow = true;
      roomGroup.add(partition);

      // Nan gỗ trang trí trên đỉnh vách kính
      const slatCap = new THREE.Mesh(
        new THREE.BoxGeometry(roomW - 0.8, 0.08, 0.18),
        new THREE.MeshStandardMaterial({ color: isDark ? 0x475569 : 0xb45309, roughness: 0.5 })
      );
      slatCap.position.set(0, 2.58, -roomD / 2 + 0.3);
      roomGroup.add(slatCap);

      // 4. Biển tên phòng gắn trên đỉnh vách ngăn kiến trúc (Clean Architectural Room Signage)
      const roomBadgeDom = document.createElement('div');
      roomBadgeDom.className = 'room-spatial-badge select-none pointer-events-none transform -translate-y-1';
      roomBadgeDom.style.zIndex = '1';
      roomBadgeDom.innerHTML = `
        <div class="px-3 py-1 rounded-xl shadow-lg backdrop-blur-xl flex items-center gap-2 border ${
          isDark 
            ? 'bg-slate-900/90 text-white border-blue-500/40' 
            : 'bg-white/95 text-slate-900 border-slate-200/90 shadow-slate-300/40'
        }">
          <div class="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500"></div>
          <span class="text-xs font-black tracking-wider uppercase">${room.name || `Phòng ${roomIdx + 1}`}</span>
        </div>
      `;
      const roomBadgeObj = new CSS2DObject(roomBadgeDom);
      roomBadgeObj.position.set(0, 2.85, -roomD / 2 + 0.3);
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

        const { group: bedGroup, ledMesh, haloMesh, hitbox } = createLuxuryBedModel(bed, cfg, shadowTex, sess);

        const bX = roomX + (bIdx - (bedCols - 1) / 2) * bedSpacingX;
        const bZ = roomZ + bedZOffset;
        bedGroup.position.set(bX, 0.25, bZ);

        // Gắn Floating CSS2D Card
        const bedCardDom = createBedCSS2DElement(bed, room, sess);
        const bedLabelObj = new CSS2DObject(bedCardDom);
        bedLabelObj.position.set(0, 2.5, 0);
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
  }, [bedsByRoom, bedSessions, waitingGuests, themeMode, t, onOpenCashier, staff]);

  // Tính toán tọa độ Camera & Target theo từng View Mode và Vị trí (Toàn cửa hàng hoặc Từng phòng)
  const getCameraCoordinates = (roomId, mode) => {
    const lPos = lobbyPosRef.current || new THREE.Vector3(0, 0, 10);

    // 1. Quầy thu ngân & Sảnh đón tiếp
    if (mode === 'cashier') {
      return {
        target: new THREE.Vector3(0.5, 1.2, lPos.z + 0.5),
        position: new THREE.Vector3(0.5, 5.0, lPos.z + 8.8)
      };
    }

    // 2. Chế độ xem "Toàn cửa hàng" (Tất cả)
    if (!roomId || roomId === 'all') {
      if (mode === 'top') {
        return {
          target: new THREE.Vector3(0, 0, 2),
          position: new THREE.Vector3(0, 46, 2.1)
        };
      }
      if (mode === 'front') {
        return {
          target: new THREE.Vector3(0, 1.5, 2),
          position: new THREE.Vector3(0, 13, 40)
        };
      }
      // Mặc định 'iso' (Góc 3D toàn cảnh)
      return {
        target: new THREE.Vector3(0, 0, 2),
        position: new THREE.Vector3(26, 24, 32)
      };
    }

    // 3. Chế độ xem Focus vào từng phòng cụ thể
    const roomInfo = roomPositionsRef.current.get(roomId);
    if (!roomInfo) {
      // Fallback nếu không tìm thấy ID phòng
      return getCameraCoordinates('all', mode);
    }

    const { x, z } = roomInfo.center;

    if (mode === 'top') {
      return {
        target: new THREE.Vector3(x, 0, z),
        position: new THREE.Vector3(x, 20.0, z + 0.1)
      };
    }
    if (mode === 'front') {
      return {
        target: new THREE.Vector3(x, 1.2, z),
        position: new THREE.Vector3(x, 5.8, z + 14.0)
      };
    }
    // Mặc định 'iso' (Góc 3D riêng cho phòng)
    return {
      target: new THREE.Vector3(x, 0.8, z),
      position: new THREE.Vector3(x + 9.5, 9.0, z + 11.0)
    };
  };

  // Chuyển đổi linh hoạt giữa các Chế độ View (Góc 3D | Mặt bằng | Chính diện | Quầy thu ngân)
  const handleSwitchViewMode = (mode) => {
    cameraModeRef.current = mode;
    setCameraMode(mode);
    setIsAutoTour(false);

    if (mode === 'cashier') {
      const coords = getCameraCoordinates('all', 'cashier');
      animateCameraFlight(coords.target, coords.position);
      setShowLoungeModal(true);
      return;
    }

    // Chuyển góc quay theo phòng hiện tại đang được chọn (Toàn cửa hàng hoặc phòng đang focus)
    const coords = getCameraCoordinates(selectedRoomId, mode);
    animateCameraFlight(coords.target, coords.position);
  };

  // Chọn phòng hoặc chọn Xem toàn cửa hàng
  const handleSelectRoom = (roomId) => {
    setSelectedRoomId(roomId);
    setIsAutoTour(false);

    let activeMode = cameraModeRef.current || cameraMode;
    // Nếu đang ở góc thu ngân mà click phòng, tự động chuyển về góc 3D để tập trung vào phòng đó
    if (activeMode === 'cashier') {
      activeMode = 'iso';
      cameraModeRef.current = 'iso';
      setCameraMode('iso');
    }

    const coords = getCameraCoordinates(roomId, activeMode);
    animateCameraFlight(coords.target, coords.position);
  };

  const handleFocusCashier = () => {
    handleSwitchViewMode('cashier');
  };

  const handleResetCamera = () => {
    handleSwitchViewMode('iso');
  };

  const handleTopDownView = () => {
    handleSwitchViewMode('top');
  };

  const handleZoom = (delta) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const dir = new THREE.Vector3();
    cameraRef.current.getWorldDirection(dir);
    cameraRef.current.position.addScaledVector(dir, delta * 3.5);
    controlsRef.current.update();
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

  const isDark = themeMode === 'dark';

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden border transition-all duration-500 shadow-2xl ${
      isFullscreen 
        ? 'fixed inset-0 z-50 rounded-none h-screen w-screen border-none' 
        : 'h-[690px] border-slate-200/80 dark:border-slate-800'
    } ${isDark ? 'bg-[#090d16]' : 'bg-[#f8fafc]'}`}>

      {/* Scoped CSS cho Thẻ Không gian 3D & Hiệu ứng Hover nở rộng thông tin thích ứng thông minh */}
      <style>{`
        .room-spatial-badge {
          z-index: 1 !important;
          pointer-events: none !important;
        }
        .bed-spatial-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
          user-select: none;
          z-index: 10;
        }
        .bed-spatial-container:hover,
        .bed-spatial-container.is-hovered {
          z-index: 999999 !important;
        }
        .bed-spatial-pill {
          display: inline-flex;
          align-items: center;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }
        .bed-spatial-container:hover .bed-spatial-pill,
        .bed-spatial-container.is-hovered .bed-spatial-pill {
          transform: scale(1.05);
          border-color: rgba(56, 189, 248, 0.7);
          box-shadow: 0 0 14px rgba(56, 189, 248, 0.4);
        }
        .bed-spatial-card {
          position: absolute;
          width: 340px;
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 120px);
          opacity: 0;
          pointer-events: none;
          visibility: hidden;
          transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), 
                      transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                      visibility 0.22s;
          z-index: 999999 !important;
        }

        /* 1. Mặc định / Phía trên (placement-top) */
        .bed-spatial-container:not(.placement-bottom) .bed-spatial-card,
        .bed-spatial-container.placement-top .bed-spatial-card {
          bottom: calc(100% + 10px);
          top: auto;
        }
        .bed-spatial-container:not(.placement-bottom):not(.align-left):not(.align-right) .bed-spatial-card,
        .bed-spatial-container.placement-top.align-center .bed-spatial-card {
          left: 50%;
          right: auto;
          transform: translate(-50%, 6px) scale(0.96);
        }
        .bed-spatial-container:not(.placement-bottom):not(.align-left):not(.align-right):hover .bed-spatial-card,
        .bed-spatial-container:not(.placement-bottom):not(.align-left):not(.align-right).is-hovered .bed-spatial-card,
        .bed-spatial-container.placement-top.align-center:hover .bed-spatial-card,
        .bed-spatial-container.placement-top.align-center.is-hovered .bed-spatial-card {
          opacity: 1;
          pointer-events: auto;
          visibility: visible;
          transform: translate(-50%, 0) scale(1);
        }

        /* 2. Lật xuống phía dưới (placement-bottom) khi phía trên sát mép hoặc bị khuất */
        .bed-spatial-container.placement-bottom .bed-spatial-card {
          top: calc(100% + 10px);
          bottom: auto;
        }
        .bed-spatial-container.placement-bottom:not(.align-left):not(.align-right) .bed-spatial-card,
        .bed-spatial-container.placement-bottom.align-center .bed-spatial-card {
          left: 50%;
          right: auto;
          transform: translate(-50%, -6px) scale(0.96);
        }
        .bed-spatial-container.placement-bottom:not(.align-left):not(.align-right):hover .bed-spatial-card,
        .bed-spatial-container.placement-bottom:not(.align-left):not(.align-right).is-hovered .bed-spatial-card,
        .bed-spatial-container.placement-bottom.align-center:hover .bed-spatial-card,
        .bed-spatial-container.placement-bottom.align-center.is-hovered .bed-spatial-card {
          opacity: 1;
          pointer-events: auto;
          visibility: visible;
          transform: translate(-50%, 0) scale(1);
        }

        /* 3. Căn sát mép trái (align-left) */
        .bed-spatial-container.align-left .bed-spatial-card {
          left: 0 !important;
          right: auto !important;
        }
        .bed-spatial-container:not(.placement-bottom).align-left .bed-spatial-card,
        .bed-spatial-container.placement-top.align-left .bed-spatial-card {
          transform: translate(0, 6px) scale(0.96);
        }
        .bed-spatial-container.placement-bottom.align-left .bed-spatial-card {
          transform: translate(0, -6px) scale(0.96);
        }
        .bed-spatial-container.align-left:hover .bed-spatial-card,
        .bed-spatial-container.align-left.is-hovered .bed-spatial-card {
          opacity: 1 !important;
          pointer-events: auto !important;
          visibility: visible !important;
          transform: translate(0, 0) scale(1) !important;
        }

        /* 4. Căn sát mép phải (align-right) */
        .bed-spatial-container.align-right .bed-spatial-card {
          right: 0 !important;
          left: auto !important;
        }
        .bed-spatial-container:not(.placement-bottom).align-right .bed-spatial-card,
        .bed-spatial-container.placement-top.align-right .bed-spatial-card {
          transform: translate(0, 6px) scale(0.96);
        }
        .bed-spatial-container.placement-bottom.align-right .bed-spatial-card {
          transform: translate(0, -6px) scale(0.96);
        }
        .bed-spatial-container.align-right:hover .bed-spatial-card,
        .bed-spatial-container.align-right.is-hovered .bed-spatial-card {
          opacity: 1 !important;
          pointer-events: auto !important;
          visibility: visible !important;
          transform: translate(0, 0) scale(1) !important;
        }

        /* Cầu nối bắt chuột (hit bridge) */
        .bed-spatial-container:not(.placement-bottom) .bed-spatial-card::after,
        .bed-spatial-container.placement-top .bed-spatial-card::after {
          content: '';
          position: absolute;
          top: 100%;
          left: -20px;
          right: -20px;
          height: 25px;
          pointer-events: auto;
        }
        .bed-spatial-container.placement-bottom .bed-spatial-card::after {
          content: '';
          position: absolute;
          bottom: 100%;
          top: auto;
          left: -20px;
          right: -20px;
          height: 25px;
          pointer-events: auto;
        }
      `}</style>

      {/* Canvas Three.js & CSS2D */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* ========================================================================= */}
      {/* TOP HUD: Room Switcher Pills, Quick Cashier Button & Stats                */}
      {/* ========================================================================= */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-10">
        {/* Pills chọn Phòng / Tầng */}
        <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl shadow-2xl backdrop-blur-2xl pointer-events-auto border overflow-x-auto max-w-[65%] scrollbar-none ${
          isDark 
            ? 'bg-slate-950/85 border-white/10 text-white' 
            : 'bg-white/95 border-slate-200/90 text-slate-800 shadow-slate-200/60'
        }`}>
          <button
            type="button"
            onClick={() => handleSelectRoom('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              selectedRoomId === 'all'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Toàn cửa hàng</span>
          </button>

          {bedsByRoom.map((group, rIdx) => {
            const rId = group.room?.id || group.room?.name || `idx_${rIdx}`;
            const isSel = selectedRoomId === rId ||
                          (group.room?.id && selectedRoomId === group.room?.id) ||
                          (group.room?.name && selectedRoomId === group.room?.name) ||
                          (selectedRoomId === `idx_${rIdx}`);
            return (
              <button
                key={rId}
                type="button"
                onClick={() => handleSelectRoom(rId)}
                title={`Tập trung xem ${group.room?.name || `Phòng ${rIdx + 1}`}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{group.room?.name || `Phòng ${rIdx + 1}`}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSel ? 'bg-white/20 text-white' : isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'
                }`}>
                  {group.beds?.length || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Cụm Thống kê Vị trí Trực quan */}
        <div className="flex items-center gap-2 pointer-events-auto">

          <div className={`hidden lg:flex items-center gap-2 p-1.5 rounded-2xl shadow-2xl backdrop-blur-2xl border ${
            isDark ? 'bg-slate-950/85 border-white/10 text-white' : 'bg-white/95 border-slate-200/90 text-slate-800'
          }`}>
            <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tổng vị trí:</span>
              <span className="font-bold">{stats.total}</span>
            </div>

            <div className={`w-px h-3.5 ${isDark ? 'bg-white/15' : 'bg-slate-200'}`} />

            <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500"></span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Đang bận:</span>
              <span className="font-bold text-rose-500">{stats.occupied}</span>
            </div>

            <div className={`w-px h-3.5 ${isDark ? 'bg-white/15' : 'bg-slate-200'}`} />

            <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500"></span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Đang trống:</span>
              <span className="font-bold text-emerald-500">{stats.available}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM-LEFT: Bảng chú thích hào quang LED sàn                             */}
      {/* ========================================================================= */}
      <div className={`absolute bottom-4 left-4 p-2.5 rounded-2xl shadow-2xl backdrop-blur-2xl pointer-events-auto border flex flex-wrap items-center gap-3.5 z-10 ${
        isDark ? 'bg-slate-950/85 border-white/10 text-white' : 'bg-white/95 border-slate-200/90 text-slate-800'
      }`}>
        <span className="text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          Trạng thái:
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
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500"></span>
            <span>Sắp hoàn thành</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shadow-sm shadow-rose-600"></span>
            <span className="text-rose-500 font-bold">Quá giờ</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM-RIGHT: Chế độ Camera Store, Theme & Fullscreen                     */}
      {/* ========================================================================= */}
      <div className={`absolute bottom-4 right-4 flex items-center gap-1.5 p-1.5 rounded-2xl shadow-2xl backdrop-blur-2xl pointer-events-auto border z-10 ${
        isDark ? 'bg-slate-950/85 border-white/10 text-white' : 'bg-white/95 border-slate-200/90 text-slate-800'
      }`}>
        {/* Nút Xem Quầy Thu Ngân & Sảnh Chờ (Focus Cashier & Lounge) */}
        <button
          type="button"
          onClick={handleFocusCashier}
          title="🏢 Quầy thu ngân & Sảnh ghế chờ"
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            cameraMode === 'cashier' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
              : isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Quầy Thu Ngân</span>
          {waitingGuests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
              {waitingGuests.length} chờ
            </span>
          )}
        </button>

        <div className={`w-px h-4 ${isDark ? 'bg-white/15' : 'bg-slate-200'}`} />

        {/* Cụm Chế độ View rõ ràng: Góc 3D | Mặt bằng | Chính diện */}
        <div className={`flex items-center gap-1 p-0.5 rounded-xl border ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200/80'
        }`}>
          {/* Nút 3D Toàn cảnh (Isometric) */}
          <button
            type="button"
            onClick={() => handleSwitchViewMode('iso')}
            title="Góc 3D không gian phối cảnh toàn tiệm"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              cameraMode === 'iso' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                : isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Góc 3D</span>
          </button>

          {/* Nút Mặt bằng tổng thể (Top-down) */}
          <button
            type="button"
            onClick={() => handleSwitchViewMode('top')}
            title="Mặt bằng kiến trúc nhìn thẳng từ trên xuống"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              cameraMode === 'top' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                : isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mặt bằng</span>
          </button>

          {/* Nút Góc nhìn trực diện (Front View) */}
          <button
            type="button"
            onClick={() => handleSwitchViewMode('front')}
            title="Góc nhìn ngang chính diện"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              cameraMode === 'front' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                : isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chính diện</span>
          </button>
        </div>

        <div className={`w-px h-4 ${isDark ? 'bg-white/15' : 'bg-slate-200'}`} />

        {/* Nút Xem tự động (Auto-Tour) */}
        <button
          type="button"
          onClick={() => setIsAutoTour(a => !a)}
          title={isAutoTour ? 'Dừng quay tự động' : 'Bật chế độ Xem tự động (Auto-Tour tiệm)'}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isAutoTour 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
              : isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          {isAutoTour ? <Pause className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => handleZoom(1)}
          title="Phóng to"
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleZoom(-1)}
          title="Thu nhỏ"
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className={`w-px h-4 ${isDark ? 'bg-white/15' : 'bg-slate-200'}`} />

        {/* Chuyển đổi Theme Boutique Sáng / Obsidian Tối */}
        <button
          type="button"
          onClick={() => setThemeMode(m => m === 'dark' ? 'boutique' : 'dark')}
          title={isDark ? 'Chuyển sang Chế độ Boutique Salon (Sáng ấm)' : 'Chuyển sang Chế độ Obsidian Luxury (Đêm)'}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isDark ? 'hover:bg-white/10 text-amber-400' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Nút Toàn màn hình */}
        <button
          type="button"
          onClick={() => setIsFullscreen(f => !f)}
          title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Mở toàn màn hình trung tâm điều hành'}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODAL / DRAWER: SẢNH CHỜ & QUẦY THU NGÂN (HIỂN THỊ KHÁCH ĐANG CHỜ)        */}
      {/* ========================================================================= */}
      {showLoungeModal && (
        <div className="absolute inset-0 z-40 bg-slate-950/40 backdrop-blur-xs flex justify-end pointer-events-auto animate-in fade-in duration-200">
          <div 
            className={`w-full max-w-md h-full flex flex-col shadow-2xl border-l backdrop-blur-2xl transition-all ${
              isDark 
                ? 'bg-slate-900/95 text-white border-white/10' 
                : 'bg-white/95 text-slate-800 border-slate-200 shadow-slate-900/20'
            }`}
          >
            {/* Header */}
            <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">Khách Chờ Phục Vụ</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                      Đang chờ
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Danh sách khách đang chờ và xếp vào vị trí giường
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLoungeModal(false)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary Badges */}
            <div className={`px-5 py-3 border-b grid grid-cols-3 gap-2 ${isDark ? 'border-white/10 bg-slate-950/40' : 'border-slate-100 bg-slate-50/70'}`}>
              <div className="text-center p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Khách ngồi chờ</div>
                <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {waitingGuests.length}
                </div>
              </div>
              <div className="text-center p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Đang phục vụ</div>
                <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">
                  {stats.occupied}
                </div>
              </div>
              <div className="text-center p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Giường trống</div>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {stats.available}
                </div>
              </div>
            </div>

            {/* Body: Danh sách khách đang ngồi ghế chờ */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {waitingGuests.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-4 ${
                    isDark ? 'bg-slate-800/80 text-slate-500' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Coffee className="w-8 h-8" />
                  </div>
                  <h4 className={`font-bold text-sm mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Hiện chưa có khách nào đang chờ phục vụ
                  </h4>
                  <p className="text-xs leading-relaxed max-w-xs mb-5">
                    Tất cả khách hàng đã được xếp vào giường làm liệu trình hoặc tiệm chưa có lịch hẹn mới trong danh sách chờ.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoungeModal(false);
                      onAssignGuest({ isWalkIn: true });
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tiếp nhận khách mới vào vị trí</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                    <span>Khách tại sảnh ({waitingGuests.length})</span>
                    <span>Trạng thái</span>
                  </div>

                  {waitingGuests.map((guest, idx) => {
                    const isWaitingBed = guest.type === 'waiting_for_bed';
                    return (
                      <div 
                        key={guest.id || idx}
                        className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] ${
                          isDark 
                            ? 'bg-slate-800/70 border-white/10 hover:border-blue-500/50' 
                            : 'bg-white border-slate-200/90 shadow-sm hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              isWaitingBed 
                                ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30' 
                                : 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                            }`}>
                              {(guest.customer_name || 'K').slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-sm">{guest.customer_name}</div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                {guest.customer_phone && guest.customer_phone !== '—' && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    <span>{guest.customer_phone}</span>
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{guest.time}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isWaitingBed 
                              ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30' 
                              : 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                          }`}>
                            {isWaitingBed ? 'Ghế chờ' : 'Chờ thanh toán'}
                          </span>
                        </div>

                        <div className={`mt-3 pt-3 border-t flex items-center justify-between gap-2 ${
                          isDark ? 'border-white/5' : 'border-slate-100'
                        }`}>
                          <div className="text-xs truncate max-w-[200px]">
                            <span className="text-slate-400">Dịch vụ: </span>
                            <span className="font-semibold">{guest.service_name}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setShowLoungeModal(false);
                              onAssignGuest(guest);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer transition-all active:scale-95 shrink-0"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Bắt đầu phục vụ</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t flex items-center gap-2 ${isDark ? 'border-white/10 bg-slate-950/60' : 'border-slate-100 bg-slate-50'}`}>
              <button
                type="button"
                onClick={() => {
                  setShowLoungeModal(false);
                  onAssignGuest({ isWalkIn: true });
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tiếp nhận khách mới</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLoungeModal(false)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isDark 
                    ? 'border-white/10 hover:bg-white/10 text-slate-300' 
                    : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
