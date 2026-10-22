'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { 
  Building2, ZoomIn, ZoomOut, Layers, AlertCircle, 
  Sparkles, Compass, Maximize2, Minimize2,
  Sun, Moon, Eye, CreditCard, Store, Play, Pause,
  RefreshCw, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useT } from '@/lib/i18n';

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
    label: 'Sắp trống',
    hex: 0xfbbf24, // Amber 400
    colorStr: '#fbbf24',
    cssDot: 'bg-amber-400',
    cssBadge: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-400/30',
    glowColor: 'rgba(251, 191, 36, 0.45)'
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
  onOpenCashier = () => {}
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
  const lobbyPosRef = useRef(new THREE.Vector3(0, 0, 10));
  const contactShadowTexRef = useRef(null);

  // Trạng thái giao diện
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('all');
  const [cameraMode, setCameraMode] = useState('entrance'); // 'entrance' | 'iso' | 'top' | 'cashier'
  const [themeMode, setThemeMode] = useState('boutique'); // 'boutique' (Sáng ấm tự nhiên) | 'dark' (Obsidian Luxury)
  const [hoveredBed, setHoveredBed] = useState(null);
  const [isAutoTour, setIsAutoTour] = useState(false);
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

  // Sinh mô hình 3D Giường Spa Cao Cấp (Luxury Contoured Bed Model with Treatment Lamp)
  const createLuxuryBedModel = (bed, statusConfig, shadowTex) => {
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
    const pillowGeo = new THREE.CylinderGeometry(0.38, 0.38, 1.1, 32);
    const pillow = new THREE.Mesh(pillowGeo, pillowMat);
    pillow.rotation.z = Math.PI / 2;
    pillow.position.set(0, 1.02, -0.85);
    pillow.scale.set(1, 0.45, 1);
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

    // Hitbox vô hình bắt click/hover
    const hitboxGeo = new THREE.BoxGeometry(2.6, 2.2, 3.4);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    hitbox.position.y = 1.0;
    hitbox.userData = { isBedHitbox: true, bedId: bed.id, bedData: bed };
    group.add(hitbox);

    return { group, ledMesh, haloMesh, hitbox };
  };

  // Tạo Floating Spatial Card bằng CSS2D
  const createBedCSS2DElement = (bed, room, session) => {
    const statusKey = session ? (session.status || 'in_progress') : 'available';
    const cfg = STATUS_THEME[statusKey] || STATUS_THEME.available;
    const isOccupied = Boolean(session);
    const isDark = themeMode === 'dark';

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
        <div class="group relative rounded-2xl p-3 shadow-2xl backdrop-blur-2xl transition-all duration-300 min-w-[220px] max-w-[260px] cursor-pointer text-left border ${
          isDark 
            ? 'bg-slate-950/90 text-white border-white/10 hover:border-blue-500/80 hover:shadow-blue-500/20' 
            : 'bg-white/95 text-slate-900 border-slate-200/90 hover:border-blue-500/80 hover:shadow-slate-300/60'
        }">
          <!-- Glowing Top Accent Line -->
          <div class="absolute -top-[1px] left-4 right-4 h-[2px] rounded-full" style="background: ${cfg.colorStr}; box-shadow: 0 0 10px ${cfg.colorStr};"></div>

          <!-- Header Row -->
          <div class="flex items-center justify-between gap-2 pb-2 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}">
            <div class="flex items-center gap-1.5">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style="background: ${cfg.colorStr}"></span>
                <span class="relative inline-flex rounded-full h-2 w-2" style="background: ${cfg.colorStr}"></span>
              </span>
              <span class="text-xs font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}">${bed.name || 'Vị trí'}</span>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-bold border tracking-wide uppercase ${cfg.cssBadge}">
              ${cfg.label}
            </span>
          </div>

          <!-- Customer Info -->
          <div class="mt-2.5 flex items-center gap-2.5">
            <div class="relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-md ${
              isDark ? 'bg-gradient-to-tr from-slate-800 to-slate-700 text-blue-400 border border-white/15' : 'bg-gradient-to-tr from-blue-50 to-blue-100 text-blue-700 border border-blue-200'
            }">
              ${initialLetter}
              <svg class="absolute -inset-0.5 w-9 h-9 -rotate-90 pointer-events-none" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}" stroke-width="2.5" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="${cfg.colorStr}" stroke-width="2.5" stroke-dasharray="100" stroke-dashoffset="${100 - progressPercent}" stroke-linecap="round" />
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <div class="text-xs font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}">
                ${customerName}
              </div>
              <div class="text-[11px] truncate flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}">
                <span class="font-medium">KTV:</span>
                <span class="font-semibold text-sky-500 dark:text-sky-400">${techName}</span>
              </div>
            </div>
          </div>

          <!-- Service Tag & Timer -->
          <div class="mt-2.5 pt-2 border-t flex items-center justify-between text-[11px] ${isDark ? 'border-white/5' : 'border-slate-100'}">
            <span class="font-medium text-slate-400 truncate max-w-[130px]">
              ${serviceName}
            </span>
            <span class="font-bold text-[10px] px-1.5 py-0.5 rounded-md ${
              isOver 
                ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30' 
                : isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-700'
            }">
              ${isOver ? 'Quá giờ' : `Còn ${remainingMins}p`}
            </span>
          </div>
        </div>
      `;
    } else {
      cardHtml = `
        <div class="rounded-xl px-3 py-1.5 shadow-xl backdrop-blur-2xl border flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
          isDark 
            ? 'bg-slate-950/85 text-white border-white/10 hover:border-emerald-500/50' 
            : 'bg-white/95 text-slate-800 border-slate-200/90 hover:border-emerald-500/50'
        }">
          <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500"></span>
          <span class="text-xs font-black tracking-tight">${bed.name || 'Vị trí'}</span>
          <span class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
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

  // Tạo Thẻ nổi CSS2D trên Quầy Thu Ngân
  const createCashierCSS2DElement = () => {
    const isDark = themeMode === 'dark';
    const div = document.createElement('div');
    div.className = 'select-none pointer-events-auto transform transition-all duration-300 hover:scale-105 cursor-pointer';

    div.innerHTML = `
      <div class="px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-2xl border flex items-center gap-3 transition-all ${
        isDark 
          ? 'bg-slate-950/90 text-white border-blue-500/40 hover:border-blue-400' 
          : 'bg-white/95 text-slate-900 border-amber-300/80 hover:border-amber-400 shadow-amber-500/10'
      }">
        <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shrink-0 shadow-lg bg-gradient-to-tr from-blue-600 to-indigo-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
          </svg>
        </div>

        <div class="text-left">
          <div class="flex items-center gap-2">
            <span class="text-xs font-black tracking-wider uppercase text-blue-600">QUẦY THU NGÂN & TIẾP TÂN</span>
            <span class="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
              Sẵn sàng
            </span>
          </div>
          <div class="text-[11px] text-slate-500 font-semibold flex items-center gap-2 mt-0.5">
            <span>${stats.occupied} khách đang phục vụ</span>
            <span>•</span>
            <span class="text-blue-600 font-bold hover:underline flex items-center gap-0.5">
              <span>Mở POS thanh toán</span>
              <span>→</span>
            </span>
          </div>
        </div>
      </div>
    `;

    div.onclick = (e) => {
      e.stopPropagation();
      onOpenCashier();
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
    camera.position.set(0, 7.5, 25);
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

      const intersects = raycaster.intersectObjects(hitboxes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        renderer.domElement.style.cursor = 'pointer';
        if (hit.userData.isBedHitbox) {
          setHoveredBed(hit.userData.bedData);
        }
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
      if (cashierHitboxRef.current) hitboxes.push(cashierHitboxRef.current);

      const intersects = raycaster.intersectObjects(hitboxes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData.isCashierHitbox) {
          onOpenCashier();
          focusCameraOnObject(hit.parent.position);
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
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (labelRenderer.domElement && container.contains(labelRenderer.domElement)) {
        container.removeChild(labelRenderer.domElement);
      }
      renderer.dispose();
    };
  }, [themeMode, isAutoTour]);

  // Lướt camera mượt mà (Cinematic Flight)
  const focusCameraOnObject = (targetPos) => {
    if (!controlsRef.current || !cameraRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    const startTarget = controls.target.clone();
    const endTarget = new THREE.Vector3(targetPos.x, targetPos.y + 0.8, targetPos.z);

    const startCamPos = camera.position.clone();
    const offset = new THREE.Vector3(9, 8, 10);
    const endCamPos = endTarget.clone().add(offset);

    let progress = 0;
    const duration = 650;
    const startTime = performance.now();

    const step = () => {
      const now = performance.now();
      progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      controls.target.lerpVectors(startTarget, endTarget, ease);
      camera.position.lerpVectors(startCamPos, endCamPos, ease);
      controls.update();

      if (progress < duration) {
        requestAnimationFrame(step);
      }
    };
    step();
  };

  // Tái tạo Cửa Hàng, Quầy Thu Ngân, Phòng & Giường trong không gian 3D
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
    cashierHitboxRef.current = null;

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

    // Gắn Floating CSS2D Card trên Quầy Thu Ngân
    const cashierLabelDom = createCashierCSS2DElement();
    const cashierLabelObj = new CSS2DObject(cashierLabelDom);
    cashierLabelObj.position.set(-3.5, 3.4, 0.5);
    lobbyGroup.add(cashierLabelObj);

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

      roomPositionsRef.current.set(room.id || `idx_${roomIdx}`, {
        center: new THREE.Vector3(roomX, 0, roomZ),
        name: room.name || `Phòng ${roomIdx + 1}`
      });

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

      // 3. Đèn trần Spa rọi điểm dịu mắt (Downlight Spotlight)
      const spotLight = new THREE.PointLight(0xfffbeb, isDark ? 0.8 : 0.55, 14, 1.2);
      spotLight.position.set(0, 4.6, 0);
      roomGroup.add(spotLight);

      // 4. Biển tên phòng nổi phía trước (CSS2D Room Header)
      const roomBadgeDom = document.createElement('div');
      roomBadgeDom.className = 'select-none pointer-events-none transform -translate-y-2';
      roomBadgeDom.innerHTML = `
        <div class="px-4 py-1.5 rounded-2xl shadow-2xl backdrop-blur-2xl flex items-center gap-2.5 border ${
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
      roomBadgeObj.position.set(0, 2.9, -roomD / 2 + 0.3);
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
  }, [bedsByRoom, bedSessions, themeMode, t, onOpenCashier]);

  // Điều khiển góc quay Camera
  const handleStoreEntranceView = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    const lPos = lobbyPosRef.current;
    controlsRef.current.target.set(0, 1.2, lPos.z - 3);
    cameraRef.current.position.set(0, 6.2, lPos.z + 10);
    controlsRef.current.update();
    setCameraMode('entrance');
    setIsAutoTour(false);
  };

  const handleResetCamera = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    controlsRef.current.target.set(0, 0, 0);
    cameraRef.current.position.set(28, 24, 30);
    controlsRef.current.update();
    setCameraMode('iso');
    setIsAutoTour(false);
  };

  const handleTopDownView = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    controlsRef.current.target.set(0, 0, 0);
    cameraRef.current.position.set(0, 42, 0.1);
    controlsRef.current.update();
    setCameraMode('top');
    setIsAutoTour(false);
  };

  const handleFocusCashier = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    const lPos = lobbyPosRef.current;
    controlsRef.current.target.set(-3.5, 1.2, lPos.z + 0.5);
    cameraRef.current.position.set(-3.5, 4.2, lPos.z + 4.8);
    controlsRef.current.update();
    setCameraMode('cashier');
    setIsAutoTour(false);
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
      handleStoreEntranceView();
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

  const isDark = themeMode === 'dark';

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden border transition-all duration-500 shadow-2xl ${
      isFullscreen 
        ? 'fixed inset-0 z-50 rounded-none h-screen w-screen border-none' 
        : 'h-[690px] border-slate-200/80 dark:border-slate-800'
    } ${isDark ? 'bg-[#090d16]' : 'bg-[#f8fafc]'}`}>

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
                    : isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{group.room?.name || 'Phòng'}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSel ? 'bg-white/20 text-white' : isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'
                }`}>
                  {group.beds?.length || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Nút bấm nhanh mở Thu Ngân POS & Cụm Thống kê */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onOpenCashier}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xl shadow-blue-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Thu Ngân POS</span>
          </button>

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
        {/* Nút Góc Lối Vào Tiệm (Store Walk-in) */}
        <button
          type="button"
          onClick={handleStoreEntranceView}
          title="🏪 Góc nhìn cửa vào tiệm (Store Walk-in)"
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            cameraMode === 'entrance' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
              : isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cửa vào tiệm</span>
        </button>

        {/* Nút Xem Quầy Thu Ngân (Focus Cashier) */}
        <button
          type="button"
          onClick={handleFocusCashier}
          title="🏢 Quầy thu ngân & đón tiếp"
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            cameraMode === 'cashier' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
              : isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Quầy Thu Ngân</span>
        </button>

        <div className={`w-px h-4 ${isDark ? 'bg-white/15' : 'bg-slate-200'}`} />

        {/* Nút 3D Toàn cảnh (Isometric) */}
        <button
          type="button"
          onClick={handleResetCamera}
          title="✨ 3D Không gian toàn cảnh (Isometric)"
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            cameraMode === 'iso' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
              : isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Compass className="w-4 h-4" />
        </button>

        {/* Nút Mặt bằng tổng thể (Top-down) */}
        <button
          type="button"
          onClick={handleTopDownView}
          title="📐 Mặt bằng tổng thể từ trên xuống (Top-down)"
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            cameraMode === 'top' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
              : isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        <div className={`w-px h-4 ${isDark ? 'bg-white/15' : 'bg-slate-200'}`} />

        {/* Nút Xem tự động (Auto-Tour) */}
        <button
          type="button"
          onClick={() => setIsAutoTour(a => !a)}
          title={isAutoTour ? 'Dừng quay tự động' : 'Bật chế độ Xem tự động (Auto-Tour tiệm)'}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isAutoTour 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' 
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
    </div>
  );
}
