/* ==========================================================================
   GDA-10 DIHEDRAL STUDIO — 3D SPATIAL DIHEDRAL VIEW & REBATIMENTO ANIMATION
   Shows Planes φ₀, ν₀, Bisectors β₁₃, β₂₄, and 4 Dihedral Quadrants
   Pedagogical Rebatimento: Rotates ν₀ (and horizontal projections) 0° -> 90°
   ========================================================================== */

let canvas3D = null;
let ctx3D = null;
let camYaw = -0.72; // Horizontal orbit angle
let camPitch = 0.42; // Vertical orbit angle
let isOrbiting = false;
let lastMouse3D = { x: 0, y: 0 };
let animFrameId = null;

/**
 * Initializes 3D Spatial Canvas and Mouse Orbit Controls
 */
function init3DView() {
  canvas3D = document.getElementById('canvas3D');
  if (!canvas3D) return;
  ctx3D = canvas3D.getContext('2d');

  canvas3D.addEventListener('pointerdown', (e) => {
    isOrbiting = true;
    lastMouse3D = { x: e.clientX, y: e.clientY };
    canvas3D.setPointerCapture(e.pointerId);
  });

  window.addEventListener('pointermove', (e) => {
    if (!isOrbiting) return;
    const dx = e.clientX - lastMouse3D.x;
    const dy = e.clientY - lastMouse3D.y;
    camYaw += dx * 0.007;
    camPitch = Math.max(-1.3, Math.min(1.3, camPitch + dy * 0.007));
    lastMouse3D = { x: e.clientX, y: e.clientY };
    render3DView();
  });

  window.addEventListener('pointerup', () => {
    isOrbiting = false;
  });

  window.addEventListener('resize', () => {
    render3DView();
  });
}

/**
 * Updates Rebatimento angle (0° to 90°)
 */
function updateRebatimento(val) {
  state.rebatimentoDeg = Math.max(0, Math.min(90, Number(val) || 0));
  const lbl = document.getElementById('rebAngleLabel');
  if (lbl) {
    lbl.textContent = state.rebatimentoDeg === 90 ? '90° (Épura 2D)' : `${Math.round(state.rebatimentoDeg)}°`;
  }
  render3DView();
}

/**
 * Toggles Rebatimento Animation between 0° and 90°
 */
function toggleRebatimentoAnim() {
  if (state.rebatimentoAnimating) return;
  const target = state.rebatimentoDeg > 45 ? 0 : 90;
  const start = state.rebatimentoDeg;
  const startTime = performance.now();
  const duration = 650; // ms

  state.rebatimentoAnimating = true;

  function step(time) {
    const elapsed = time - startTime;
    const progress = Math.min(1, elapsed / duration);
    // Smooth easeInOutCubic
    const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    const current = start + (target - start) * ease;

    const slider = document.getElementById('rebSlider');
    if (slider) slider.value = current;
    updateRebatimento(current);

    if (progress < 1) {
      animFrameId = requestAnimationFrame(step);
    } else {
      state.rebatimentoAnimating = false;
    }
  }

  animFrameId = requestAnimationFrame(step);
}

/**
 * Rotates a point on the horizontal plane (x, y, 0) around the x-axis
 * by the current rebatimento angle theta
 * Portuguese Convention:
 * Positive y (anterior) rotates DOWN into -z
 * Negative y (posterior) rotates UP into +z
 */
function rotateRebatimentoPoint(x, y) {
  const rad = (state.rebatimentoDeg * Math.PI) / 180;
  return {
    x: x,
    y: y * Math.cos(rad),
    z: -y * Math.sin(rad)
  };
}

/**
 * Projects a 3D coordinate (Portuguese: +x Left, +y Front, +z Up) onto the 2D Viewport Canvas
 */
function project3Dto2D(x, y, z, w, h, scale) {
  // In viewer coordinates:
  // World X = -x (so +x goes to the LEFT)
  // World Y = z  (so +z goes UP)
  // World Z = y  (so +y goes FORWARD towards viewer)
  const wx = -x;
  const wy = z;
  const wz = y;

  // Yaw around Y-axis
  const cosY = Math.cos(camYaw), sinY = Math.sin(camYaw);
  const rx = wx * cosY + wz * sinY;
  const rz = -wx * sinY + wz * cosY;

  // Pitch around X-axis
  const cosP = Math.cos(camPitch), sinP = Math.sin(camPitch);
  const ry = wy * cosP - rz * sinP;
  const depth = wy * sinP + rz * cosP;

  // Isometric / Weak perspective projection
  const perspFactor = 1 / (1 + depth * 0.012);

  return {
    px: w / 2 + rx * scale * perspFactor,
    py: h / 2 - ry * scale * perspFactor,
    depth: depth
  };
}

/**
 * Main 3D Spatial View Render Loop
 */
function render3DView() {
  if (!canvas3D || !ctx3D) return;
  const parent = canvas3D.parentElement;
  if (!parent) return;

  const rect = parent.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const dpr = window.devicePixelRatio || 1;
  canvas3D.width = rect.width * dpr;
  canvas3D.height = rect.height * dpr;

  ctx3D.save();
  ctx3D.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const scale = Math.min(w, h) / 36;

  // Clear background with crisp dark charcoal
  ctx3D.fillStyle = '#111827';
  ctx3D.fillRect(0, 0, w, h);

  // Helper: Draw 3D polygon
  function drawPolygon3D(pts, fill, stroke, strokeWidth = 1, strokeDash = []) {
    ctx3D.beginPath();
    ctx3D.setLineDash(strokeDash);
    pts.forEach((p, idx) => {
      const s = project3Dto2D(p.x, p.y, p.z, w, h, scale);
      if (idx === 0) ctx3D.moveTo(s.px, s.py);
      else ctx3D.lineTo(s.px, s.py);
    });
    ctx3D.closePath();
    if (fill) { ctx3D.fillStyle = fill; ctx3D.fill(); }
    if (stroke) { ctx3D.strokeStyle = stroke; ctx3D.lineWidth = strokeWidth; ctx3D.stroke(); }
    ctx3D.setLineDash([]);
  }

  // Helper: Draw 3D line
  function drawLine3D(p1, p2, color, width = 1.5, dash = []) {
    const s1 = project3Dto2D(p1.x, p1.y, p1.z, w, h, scale);
    const s2 = project3Dto2D(p2.x, p2.y, p2.z, w, h, scale);
    ctx3D.beginPath();
    ctx3D.setLineDash(dash);
    ctx3D.strokeStyle = color;
    ctx3D.lineWidth = width;
    ctx3D.moveTo(s1.px, s1.py);
    ctx3D.lineTo(s2.px, s2.py);
    ctx3D.stroke();
    ctx3D.setLineDash([]);
  }

  const planeBound = 11;

  // 1. FRONT PROJECTION PLANE φ₀ (Fixed vertical plane y = 0)
  drawPolygon3D([
    { x: -planeBound, y: 0, z: -planeBound },
    { x: planeBound, y: 0, z: -planeBound },
    { x: planeBound, y: 0, z: planeBound },
    { x: -planeBound, y: 0, z: planeBound }
  ], 'rgba(0, 163, 224, 0.08)', 'rgba(0, 163, 224, 0.35)', 1.2);

  // 2. HORIZONTAL PROJECTION PLANE ν₀ (Rotates with rebatimento)
  const nuPts = [
    rotateRebatimentoPoint(-planeBound, -planeBound),
    rotateRebatimentoPoint(planeBound, -planeBound),
    rotateRebatimentoPoint(planeBound, planeBound),
    rotateRebatimentoPoint(-planeBound, planeBound)
  ];
  drawPolygon3D(nuPts, 'rgba(0, 114, 156, 0.12)', 'rgba(0, 114, 156, 0.45)', 1.2);

  // 3. BISECTOR PLANES β₁₃ and β₂₄ (Optional toggle)
  if (state.showBisectors && state.rebatimentoDeg < 15) {
    // β₁₃: y = z
    drawPolygon3D([
      { x: -planeBound, y: -planeBound, z: -planeBound },
      { x: planeBound, y: -planeBound, z: -planeBound },
      { x: planeBound, y: planeBound, z: planeBound },
      { x: -planeBound, y: planeBound, z: planeBound }
    ], 'rgba(230, 0, 0, 0.04)', 'rgba(230, 0, 0, 0.25)', 0.8, [3, 3]);

    // β₂₄: y = -z
    drawPolygon3D([
      { x: -planeBound, y: -planeBound, z: planeBound },
      { x: planeBound, y: -planeBound, z: planeBound },
      { x: planeBound, y: planeBound, z: -planeBound },
      { x: -planeBound, y: planeBound, z: -planeBound }
    ], 'rgba(108, 117, 125, 0.05)', 'rgba(108, 117, 125, 0.25)', 0.8, [3, 3]);
  }

  // 4. AXIS X (Linha de Terra) passing through Origin
  drawLine3D({ x: -13.5, y: 0, z: 0 }, { x: 13.5, y: 0, z: 0 }, '#F8F9FA', 2.0);
  const pOrigin = project3Dto2D(0, 0, 0, w, h, scale);
  ctx3D.fillStyle = '#FFFFFF';
  ctx3D.beginPath(); ctx3D.arc(pOrigin.px, pOrigin.py, 3, 0, Math.PI * 2); ctx3D.fill();

  // Labels for +x and -x
  const pPlusX = project3Dto2D(13.8, 0, 0, w, h, scale);
  const pMinusX = project3Dto2D(-13.8, 0, 0, w, h, scale);
  ctx3D.font = "bold 11px 'Excon', sans-serif";
  ctx3D.fillStyle = '#F8F9FA';
  ctx3D.fillText('+x (Esquerda)', pPlusX.px + 4, pPlusX.py - 4);
  ctx3D.fillStyle = '#9CA3AF';
  ctx3D.fillText('-x', pMinusX.px - 16, pMinusX.py - 4);

  // Plane Labels (φ₀ and ν₀)
  const pPhi = project3Dto2D(-planeBound + 1, 0, planeBound - 1, w, h, scale);
  ctx3D.fillStyle = '#00A3E0';
  ctx3D.fillText('Plano Frontal (φ₀)', pPhi.px, pPhi.py);

  const pNu = project3Dto2D(
    nuPts[3].x + 1,
    nuPts[3].y,
    nuPts[3].z,
    w, h, scale
  );
  ctx3D.fillStyle = '#00729C';
  ctx3D.fillText('Plano Horizontal (ν₀)', pNu.px, pNu.py + 12);

  // 5. RENDER 3D LINES
  state.entities.filter(e => e.type === 'line').forEach(ln => {
    const lg = computeLineGeometry(ln, getEntity);
    if (!lg) return;

    // Spatial line in 3D (visible when not fully rebated)
    if (state.rebatimentoDeg < 89) {
      drawLine3D(lg.pStart, lg.pEnd, '#00A3E0', 2.0);
    }

    // Frontal projection r2 on φ₀ (y = 0)
    drawLine3D(
      { x: lg.pStart.x, y: 0, z: lg.pStart.z },
      { x: lg.pEnd.x, y: 0, z: lg.pEnd.z },
      '#9CA3AF', 1.5
    );

    // Horizontal projection r1 on rotating ν₀
    const r1Start = rotateRebatimentoPoint(lg.pStart.x, lg.pStart.y);
    const r1End = rotateRebatimentoPoint(lg.pEnd.x, lg.pEnd.y);
    drawLine3D(r1Start, r1End, '#00729C', 1.5);
  });

  // 6. RENDER 3D POINTS & PROJECTORS
  state.entities.filter(e => e.type === 'point').forEach(pt => {
    const pSpace = { x: pt.x, y: pt.y, z: pt.z };
    const pA2 = { x: pt.x, y: 0, z: pt.z }; // Frontal projection on φ₀
    const pA1 = rotateRebatimentoPoint(pt.x, pt.y); // Horizontal projection on ν₀
    const pA0 = { x: pt.x, y: 0, z: 0 }; // Ground projection on axis x

    // Orthogonal Projector Lines
    if (state.rebatimentoDeg < 89) {
      drawLine3D(pSpace, pA2, 'rgba(156, 163, 175, 0.4)', 1, [2, 2]);
      drawLine3D(pSpace, { x: pt.x, y: pt.y, z: 0 }, 'rgba(156, 163, 175, 0.4)', 1, [2, 2]);
    }
    drawLine3D(pA2, pA0, 'rgba(229, 231, 235, 0.65)', 1);
    drawLine3D(pA1, pA0, 'rgba(0, 114, 156, 0.75)', 1);

    // Draw projection dots
    const sA2 = project3Dto2D(pA2.x, pA2.y, pA2.z, w, h, scale);
    const sA1 = project3Dto2D(pA1.x, pA1.y, pA1.z, w, h, scale);

    // A2 (Frontal)
    ctx3D.fillStyle = '#FFFFFF';
    ctx3D.beginPath(); ctx3D.arc(sA2.px, sA2.py, 3.2, 0, Math.PI * 2); ctx3D.fill();
    ctx3D.font = "bold 11px 'Excon', sans-serif";
    ctx3D.fillStyle = '#E5E7EB';
    ctx3D.fillText(`${pt.label}₂`, sA2.px + 5, sA2.py - 3);

    // A1 (Horizontal)
    ctx3D.fillStyle = '#00A3E0';
    ctx3D.beginPath(); ctx3D.arc(sA1.px, sA1.py, 3.2, 0, Math.PI * 2); ctx3D.fill();
    ctx3D.fillStyle = '#00A3E0';
    ctx3D.fillText(`${pt.label}₁`, sA1.px + 5, sA1.py + 10);

    // Spatial Point P
    if (state.rebatimentoDeg < 89) {
      const sSp = project3Dto2D(pSpace.x, pSpace.y, pSpace.z, w, h, scale);
      ctx3D.fillStyle = '#E60000';
      ctx3D.beginPath(); ctx3D.arc(sSp.px, sSp.py, 4.2, 0, Math.PI * 2); ctx3D.fill();
      ctx3D.font = "bold 12px 'Excon', sans-serif";
      ctx3D.fillStyle = '#FFFFFF';
      ctx3D.fillText(pt.label, sSp.px + 6, sSp.py - 5);
    }
  });

  ctx3D.restore();
}
