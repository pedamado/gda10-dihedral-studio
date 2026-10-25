/* ==========================================================================
   GDA-10 DIHEDRAL STUDIO — MATHEMATICAL ENGINE (PORTUGUESE GDA CONVENTIONS)
   Exact Norms: +X (Abcissa) Left of Origin; +Y (Afastamento) Down; +Z (Cota) Up
   ========================================================================== */

const MM_PER_CM = 10;
const MAX_CM = 15;

/**
 * Rounds a number to a specific step (e.g. 0.5 cm or 0.1 cm)
 */
function roundStep(val, step = 0.5) {
  if (!step || step <= 0) return Math.round(val * 100) / 100;
  return Math.round(val / step) * step;
}

/**
 * Formats a coordinate number in Portuguese standard (comma as decimal separator)
 */
function fmt(n, decimals = 1) {
  if (n === undefined || n === null || isNaN(n)) return '0';
  const factor = Math.pow(10, decimals);
  const r = Math.round(n * factor) / factor;
  return r.toString().replace('.', ',');
}

/**
 * Format coordinate with explicit sign (+ or -)
 */
function fmtSigned(n, decimals = 1) {
  if (n === undefined || n === null || isNaN(n)) return '0';
  const factor = Math.pow(10, decimals);
  const r = Math.round(n * factor) / factor;
  const s = r.toString().replace('.', ',');
  return r > 0 ? `+${s}` : s;
}

/**
 * Converts Dihedral Point Coordinates to 2D SVG coordinates (in mm)
 * Origin O(0; 0) is at SVG (0, 0)
 * +X is to the LEFT  -> svgX = -x * 10
 * +Y is DOWN         -> svgY = +y * 10 (Horizontal Projection A1)
 * +Z is UP           -> svgY = -z * 10 (Frontal Projection A2)
 */
function toSvgA1(x, y) {
  return { sx: -x * MM_PER_CM, sy: y * MM_PER_CM };
}

function toSvgA2(x, z) {
  return { sx: -x * MM_PER_CM, sy: -z * MM_PER_CM };
}

/**
 * Convert SVG mouse coordinates back to GDA coordinates in cm
 */
function fromSvgCoords(svgX, svgY, snap = true, snapStep = 0.5) {
  let x = -svgX / MM_PER_CM;
  let yDown = svgY / MM_PER_CM;
  let zUp = -svgY / MM_PER_CM;

  if (snap) {
    x = roundStep(x, snapStep);
    yDown = roundStep(yDown, snapStep);
    zUp = roundStep(zUp, snapStep);
  } else {
    x = Math.round(x * 10) / 10;
    yDown = Math.round(yDown * 10) / 10;
    zUp = Math.round(zUp * 10) / 10;
  }

  // Constrain within sheet boundaries [-15 cm, +15 cm]
  x = Math.max(-MAX_CM, Math.min(MAX_CM, x));
  yDown = Math.max(-MAX_CM, Math.min(MAX_CM, yDown));
  zUp = Math.max(-MAX_CM, Math.min(MAX_CM, zUp));

  return { x, yDown, zUp };
}

/**
 * Classifies a point according to 10th-grade GDA syllabus
 */
function classifyPoint(p) {
  const { x, y, z } = p;
  if (Math.abs(y) < 1e-4 && Math.abs(z) < 1e-4) return 'No Eixo x (Linha de Terra)';
  if (Math.abs(y) < 1e-4) return 'No Plano Frontal φ₀';
  if (Math.abs(z) < 1e-4) return 'No Plano Horizontal ν₀';

  let diedro = '';
  if (y > 0 && z > 0) diedro = '1.º Diedro';
  else if (y < 0 && z > 0) diedro = '2.º Diedro';
  else if (y < 0 && z < 0) diedro = '3.º Diedro';
  else if (y > 0 && z < 0) diedro = '4.º Diedro';

  let bissetor = '';
  if (Math.abs(y - z) < 1e-4) bissetor = ' • β₁₃';
  else if (Math.abs(y + z) < 1e-4) bissetor = ' • β₂₄';

  return `${diedro}${bissetor}`;
}

/**
 * Classifies a line according to 10th-grade GDA line types
 */
function classifyLine(lg) {
  if (!lg) return 'Reta';
  const { dx, dy, dz } = lg;
  const isHoriz = Math.abs(dz) < 1e-4; // z is constant
  const isFront = Math.abs(dy) < 1e-4; // y is constant
  const isVert = Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4; // x and y constant (perp to nu0)
  const isTopo = Math.abs(dx) < 1e-4 && Math.abs(dz) < 1e-4; // x and z constant (perp to phi0)
  const isPerfil = Math.abs(dx) < 1e-4 && !isVert && !isTopo; // x constant (perp to x)

  if (isVert) return 'Reta Vertical';
  if (isTopo) return 'Reta de Topo';
  if (isPerfil) return 'Reta de Perfil';
  if (isHoriz && isFront) return 'Reta Fronto-Horizontal';
  if (isHoriz) return 'Reta de Nível (Horizontal)';
  if (isFront) return 'Reta Frontal (de Frente)';

  // Check if passante (passes through x axis)
  if (lg.traceF && lg.traceH && Math.abs(lg.traceF.x - lg.traceH.x) < 1e-3) {
    return 'Reta Passante';
  }

  return 'Reta Oblíqua';
}

/**
 * Classifies a plane according to 10th-grade GDA plane types
 */
function classifyPlane(pg) {
  if (!pg) return 'Plano';
  const { nx, ny, nz } = pg;
  const ax = Math.abs(nx) < 1e-4;
  const ay = Math.abs(ny) < 1e-4;
  const az = Math.abs(nz) < 1e-4;

  if (ax && ay) return 'Plano de Nível (Horizontal)';
  if (ax && az) return 'Plano Frontal';
  if (ay && az) return 'Plano de Perfil';
  if (az) return 'Plano Vertical';
  if (ay) return 'Plano de Topo';
  if (ax) return 'Plano de Rampa';

  if (pg.x0 !== null && Math.abs(pg.x0) < 1e-3 && Math.abs(pg.d) < 1e-3) {
    return 'Plano Passante';
  }

  return 'Plano Oblíquo';
}

/**
 * Computes 3D and 2D geometry for a line, including traces F, H, and bisector points
 */
function computeLineGeometry(lineEnt, getEntityFn) {
  let pA = null;
  let pB = null;

  if (lineEnt.mode === 'point-type') {
    pA = getEntityFn(lineEnt.p1Id);
    if (!pA) return null;
    const type = lineEnt.lineType || 'obliqua';
    const ang = (Number(lineEnt.angle) || 30) * Math.PI / 180;
    const L = 8;

    pB = { id: 'inline_b', label: 'B', x: pA.x, y: pA.y, z: pA.z };
    if (type === 'nivel') {
      pB.x = pA.x + L * Math.cos(ang);
      pB.y = pA.y + L * Math.sin(ang);
      pB.z = pA.z;
    } else if (type === 'frontal') {
      pB.x = pA.x + L * Math.cos(ang);
      pB.y = pA.y;
      pB.z = pA.z + L * Math.sin(ang);
    } else if (type === 'topo') {
      pB.x = pA.x;
      pB.y = pA.y + L;
      pB.z = pA.z;
    } else if (type === 'vertical') {
      pB.x = pA.x;
      pB.y = pA.y;
      pB.z = pA.z + L;
    } else if (type === 'perfil') {
      pB.x = pA.x;
      pB.y = pA.y + L * Math.cos(ang);
      pB.z = pA.z + L * Math.sin(ang);
    } else if (type === 'fronto-horizontal') {
      pB.x = pA.x + L;
      pB.y = pA.y;
      pB.z = pA.z;
    } else {
      // Default obliqua
      pB.x = pA.x + L * Math.cos(ang);
      pB.y = pA.y + L * Math.sin(ang);
      pB.z = pA.z + L * Math.sin(ang) * 0.8;
    }
  } else {
    pA = getEntityFn(lineEnt.p1Id);
    pB = getEntityFn(lineEnt.p2Id);
  }

  if (!pA || !pB) return null;

  const dx = pB.x - pA.x;
  const dy = pB.y - pA.y;
  const dz = pB.z - pA.z;

  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len < 1e-6) return null;

  // Frontal Trace F: y = 0 => pA.y + tF * dy = 0 => tF = -pA.y / dy
  let traceF = null;
  if (Math.abs(dy) > 1e-5) {
    const tF = -pA.y / dy;
    traceF = {
      x: pA.x + tF * dx,
      y: 0,
      z: pA.z + tF * dz
    };
  }

  // Horizontal Trace H: z = 0 => pA.z + tH * dz = 0 => tH = -pA.z / dz
  let traceH = null;
  if (Math.abs(dz) > 1e-5) {
    const tH = -pA.z / dz;
    traceH = {
      x: pA.x + tH * dx,
      y: pA.y + tH * dy,
      z: 0
    };
  }

  // Point Q on beta13: y = z => pA.y + tQ * dy = pA.z + tQ * dz => tQ * (dy - dz) = pA.z - pA.y
  let pointQ = null;
  if (Math.abs(dy - dz) > 1e-5) {
    const tQ = (pA.z - pA.y) / (dy - dz);
    pointQ = {
      x: pA.x + tQ * dx,
      y: pA.y + tQ * dy,
      z: pA.z + tQ * dz
    };
  }

  // Point I_beta24 on beta24: y = -z => pA.y + t24 * dy = -(pA.z + t24 * dz) => t24 * (dy + dz) = -(pA.z + pA.y)
  let pointI24 = null;
  if (Math.abs(dy + dz) > 1e-5) {
    const t24 = -(pA.z + pA.y) / (dy + dz);
    pointI24 = {
      x: pA.x + t24 * dx,
      y: pA.y + t24 * dy,
      z: pA.z + t24 * dz
    };
  }

  // Extended endpoints across canvas [-15 cm, +15 cm]
  // Parameter range calculation to clip inside box [-15, 15] x [-15, 15] x [-15, 15]
  let tMin = -15;
  let tMax = 15;
  const span = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
  const mult = span > 0 ? 30 / span : 10;

  const pStart = { x: pA.x - dx * mult, y: pA.y - dy * mult, z: pA.z - dz * mult };
  const pEnd   = { x: pA.x + dx * mult, y: pA.y + dy * mult, z: pA.z + dz * mult };

  return { pA, pB, dx, dy, dz, traceF, traceH, pointQ, pointI24, pStart, pEnd };
}

/**
 * Clips a 2D line A*x + B*w + C = 0 within the box [-15, 15] x [-15, 15]
 */
function clip2DLine(A, B, C, limit = MAX_CM) {
  const pts = [];
  const L = limit;
  const eps = 1e-6;

  // Intersect with x = -L and x = L
  if (Math.abs(B) > eps) {
    [-L, L].forEach(x => {
      const w = (-C - A * x) / B;
      if (w >= -L - eps && w <= L + eps) pts.push({ x, w });
    });
  }
  // Intersect with w = -L and w = L
  if (Math.abs(A) > eps) {
    [-L, L].forEach(w => {
      const x = (-C - B * w) / A;
      if (x > -L - eps && x < L + eps) pts.push({ x, w });
    });
  }

  if (pts.length < 2) return null;
  // Dedup close points
  const p1 = pts[0];
  let p2 = pts[1];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - p1.x, pts[i].w - p1.w);
    if (d > 0.05) { p2 = pts[i]; break; }
  }
  return [p1, p2];
}

/**
 * Builds plane geometry from 3 points
 */
function buildPlaneFrom3Points(p1, p2, p3) {
  const u = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
  const v = { x: p3.x - p1.x, y: p3.y - p1.y, z: p3.z - p1.z };
  const nx = u.y * v.z - u.z * v.y;
  const ny = u.z * v.x - u.x * v.z;
  const nz = u.x * v.y - u.y * v.x;
  const d = -(nx * p1.x + ny * p1.y + nz * p1.z);

  const lenN = Math.hypot(nx, ny, nz);
  if (lenN < 1e-6) return null;

  // Frontal trace f_alpha (y = 0): nx * x + nz * z + d = 0
  const traceFSeg = clip2DLine(nx, nz, d);
  // Horizontal trace h_alpha (z = 0): nx * x + ny * y + d = 0
  const traceHSeg = clip2DLine(nx, ny, d);

  const x0 = Math.abs(nx) > 1e-5 ? -d / nx : null;

  return { nx, ny, nz, d, traceFSeg, traceHSeg, x0, p1, p2, p3 };
}

/**
 * Computes Plane Geometry and Traces (f_alpha, h_alpha)
 */
function computePlaneGeometry(planeEnt, getEntityFn) {
  if (planeEnt.mode === 'traces') {
    // Defined by vertex X0 on x-axis and angles (deg)
    // angF: angle of frontal trace f_alpha with +x (towards left or right)
    // angH: angle of horizontal trace h_alpha with +x
    const x0 = Number(planeEnt.x0) || 0;
    const angF = (Number(planeEnt.angF) || 45) * Math.PI / 180;
    const angH = (Number(planeEnt.angH) || 40) * Math.PI / 180;
    const dirF = planeEnt.dirF === 'right' ? -1 : 1;
    const dirH = planeEnt.dirH === 'right' ? -1 : 1;

    const P0 = { x: x0, y: 0, z: 0 };
    const PF = { x: x0 + dirF * 10 * Math.cos(angF), y: 0, z: 10 * Math.sin(angF) };
    const PH = { x: x0 + dirH * 10 * Math.cos(angH), y: 10 * Math.sin(angH), z: 0 };
    return buildPlaneFrom3Points(P0, PF, PH);
  } else if (planeEnt.mode === '2lines') {
    const l1 = getEntityFn(planeEnt.line1Id);
    const l2 = getEntityFn(planeEnt.line2Id);
    if (!l1 || !l2) return null;
    const g1 = computeLineGeometry(l1, getEntityFn);
    const g2 = computeLineGeometry(l2, getEntityFn);
    if (!g1 || !g2) return null;
    return buildPlaneFrom3Points(g1.pA, g1.pB, g2.pA);
  } else if (planeEnt.mode === 'line-point') {
    const ln = getEntityFn(planeEnt.lineId);
    const pt = getEntityFn(planeEnt.pointId);
    if (!ln || !pt) return null;
    const lg = computeLineGeometry(ln, getEntityFn);
    if (!lg) return null;
    return buildPlaneFrom3Points(lg.pA, lg.pB, pt);
  } else {
    // 3 points mode
    const p1 = getEntityFn(planeEnt.p1Id);
    const p2 = getEntityFn(planeEnt.p2Id);
    const p3 = getEntityFn(planeEnt.p3Id);
    if (!p1 || !p2 || !p3) return null;
    return buildPlaneFrom3Points(p1, p2, p3);
  }
}

/**
 * Computes Intersections (Line ∩ Line, Line ∩ Plane, Plane ∩ Plane)
 */
function computeIntersectionGeometry(intEnt, getEntityFn) {
  if (intEnt.mode === 'line-plane') {
    const lineEnt = getEntityFn(intEnt.lineId);
    const planeEnt = getEntityFn(intEnt.planeId);
    if (!lineEnt || !planeEnt) return null;

    const lg = computeLineGeometry(lineEnt, getEntityFn);
    const pg = computePlaneGeometry(planeEnt, getEntityFn);
    if (!lg || !pg) return null;

    const denom = pg.nx * lg.dx + pg.ny * lg.dy + pg.nz * lg.dz;
    if (Math.abs(denom) < 1e-6) return null; // parallel

    const t = -(pg.nx * lg.pA.x + pg.ny * lg.pA.y + pg.nz * lg.pA.z + pg.d) / denom;
    return {
      type: 'point',
      point: {
        x: lg.pA.x + t * lg.dx,
        y: lg.pA.y + t * lg.dy,
        z: lg.pA.z + t * lg.dz
      }
    };
  } else if (intEnt.mode === 'line-line') {
    const l1 = getEntityFn(intEnt.line1Id);
    const l2 = getEntityFn(intEnt.line2Id);
    if (!l1 || !l2) return null;
    const g1 = computeLineGeometry(l1, getEntityFn);
    const g2 = computeLineGeometry(l2, getEntityFn);
    if (!g1 || !g2) return null;

    // Solve in horizontal projection (x, y)
    const det = g1.dx * (-g2.dy) - g1.dy * (-g2.dx);
    if (Math.abs(det) < 1e-6) return null; // parallel or degenerate
    const rhsX = g2.pA.x - g1.pA.x;
    const rhsY = g2.pA.y - g1.pA.y;
    const t1 = (rhsX * (-g2.dy) - rhsY * (-g2.dx)) / det;

    return {
      type: 'point',
      point: {
        x: g1.pA.x + t1 * g1.dx,
        y: g1.pA.y + t1 * g1.dy,
        z: g1.pA.z + t1 * g1.dz
      }
    };
  } else if (intEnt.mode === 'plane-plane') {
    const pl1 = getEntityFn(intEnt.plane1Id);
    const pl2 = getEntityFn(intEnt.plane2Id);
    if (!pl1 || !pl2) return null;
    const g1 = computePlaneGeometry(pl1, getEntityFn);
    const g2 = computePlaneGeometry(pl2, getEntityFn);
    if (!g1 || !g2) return null;

    // Intersection line i direction: v = n1 x n2
    const vx = g1.ny * g2.nz - g1.nz * g2.ny;
    const vy = g1.nz * g2.nx - g1.nx * g2.nz;
    const vz = g1.nx * g2.ny - g1.ny * g2.nx;
    const lenV = Math.hypot(vx, vy, vz);
    if (lenV < 1e-6) return null; // parallel planes

    // Frontal Trace Fi = f_alpha ∩ f_beta (y = 0)
    // nx1*x + nz1*z + d1 = 0 AND nx2*x + nz2*z + d2 = 0
    const detF = g1.nx * g2.nz - g1.nz * g2.nx;
    let traceF = null;
    if (Math.abs(detF) > 1e-5) {
      const xF = (-g1.d * g2.nz - (-g2.d) * g1.nz) / detF;
      const zF = (g1.nx * (-g2.d) - g2.nx * (-g1.d)) / detF;
      traceF = { x: xF, y: 0, z: zF };
    }

    // Horizontal Trace Hi = h_alpha ∩ h_beta (z = 0)
    const detH = g1.nx * g2.ny - g1.ny * g2.nx;
    let traceH = null;
    if (Math.abs(detH) > 1e-5) {
      const xH = (-g1.d * g2.ny - (-g2.d) * g1.ny) / detH;
      const yH = (g1.nx * (-g2.d) - g2.nx * (-g1.d)) / detH;
      traceH = { x: xH, y: yH, z: 0 };
    }

    // Extended endpoints for line i
    const refPt = traceF || traceH || { x: 0, y: 0, z: 0 };
    const pStart = { x: refPt.x - vx * 10, y: refPt.y - vy * 10, z: refPt.z - vz * 10 };
    const pEnd   = { x: refPt.x + vx * 10, y: refPt.y + vy * 10, z: refPt.z + vz * 10 };

    return {
      type: 'line',
      traceF,
      traceH,
      vx, vy, vz,
      pStart,
      pEnd
    };
  }
  return null;
}
