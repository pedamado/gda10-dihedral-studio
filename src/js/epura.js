/* ==========================================================================
   GDA-10 DIHEDRAL STUDIO — 2D ÉPURA SVG RENDERER & INTERACTION ENGINE
   ========================================================================== */

let epuraSvg = null;
let dragState = null; // { id, proj: 'A1' | 'A2' }

/**
 * Initializes the 2D Épura SVG element and mouse listeners
 */
function initEpura() {
  epuraSvg = document.getElementById('epuraSvg');
  if (!epuraSvg) return;

  epuraSvg.addEventListener('pointerdown', handleEpuraPointerDown);
  epuraSvg.addEventListener('pointermove', handleEpuraPointerMove);
  window.addEventListener('pointerup', handleEpuraPointerUp);
}

/**
 * Translates mouse event into Portuguese GDA cm coordinates
 */
function getMouseGdaCoords(evt) {
  if (!epuraSvg) return { x: 0, yDown: 0, zUp: 0 };
  const pt = epuraSvg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const svgP = pt.matrixTransform(epuraSvg.getScreenCTM().inverse());

  return fromSvgCoords(svgP.x, svgP.y, state.snap05, state.snapValue);
}

function handleEpuraPointerDown(evt) {
  const coords = getMouseGdaCoords(evt);

  // 1. Two-Click Point Insertion Mode
  if (state.mouseTool === 'point') {
    if (!state.pendingPointStep1) {
      // Step 1: Mark A1 (x and y)
      state.pendingPointStep1 = { x: coords.x, y: coords.yDown };
      const badge = document.getElementById('insertStatusBadge');
      if (badge) {
        badge.className = 'status-badge step2';
        badge.textContent = `2.º Passo: Marcar cota (A₂) na linha de chamada x = ${fmtSigned(coords.x)} cm`;
      }
      renderAll();
    } else {
      // Step 2: Mark A2 (z)
      const label = getNextPointLetter();
      const newPt = {
        id: 'pt_' + Date.now(),
        type: 'point',
        label,
        x: state.pendingPointStep1.x,
        y: state.pendingPointStep1.y,
        z: coords.zUp,
        inStatement: true,
        omitX: false,
        omitY: false,
        omitZ: false,
        isGoal: false
      };
      state.entities.push(newPt);
      state.selectedId = newPt.id;
      state.pendingPointStep1 = null;
      setMouseTool('select');
      renderAll();
    }
    return;
  }

  // 2. Select & Drag Mode
  const handle = evt.target.closest('.epura-handle');
  if (handle) {
    const id = handle.getAttribute('data-id');
    const proj = handle.getAttribute('data-proj');
    state.selectedId = id;
    dragState = { id, proj };
    epuraSvg.setPointerCapture(evt.pointerId);
    renderAll();
    return;
  }

  // Check if clicked an interactive line or trace
  const lineEl = evt.target.closest('.interactive-line');
  if (lineEl) {
    const id = lineEl.getAttribute('data-id');
    if (id) {
      state.selectedId = id;
      renderAll();
      return;
    }
  }

  // Clicked empty background
  if (!evt.target.closest('.epura-handle') && !evt.target.closest('.interactive-line')) {
    state.selectedId = null;
    renderAll();
  }
}

function handleEpuraPointerMove(evt) {
  const coords = getMouseGdaCoords(evt);
  const readout = document.getElementById('cursorCoords');
  if (readout) {
    readout.textContent = `x: ${fmtSigned(coords.x)} | y: ${fmtSigned(coords.yDown)} | z: ${fmtSigned(coords.zUp)} cm`;
  }

  // Handle Dragging Point Projections
  if (dragState) {
    const pt = getEntity(dragState.id);
    if (pt) {
      // Both projections A1 and A2 ALWAYS share the same abcissa x!
      pt.x = coords.x;
      if (dragState.proj === 'A1') {
        pt.y = coords.yDown;
      } else if (dragState.proj === 'A2') {
        pt.z = coords.zUp;
      }
      render2DEpura(epuraSvg, state.previewStudentSheet, false);
      if (typeof render3DView === 'function') render3DView();
      if (typeof renderSidebarBlocks === 'function') renderSidebarBlocks();
      if (typeof generatePortugueseStatement === 'function') generatePortugueseStatement();
    }
  }
}

function handleEpuraPointerUp(evt) {
  if (dragState) {
    dragState = null;
    renderAll();
  }
}

function setMouseTool(tool) {
  state.mouseTool = tool;
  state.pendingPointStep1 = null;
  const btnSel = document.getElementById('toolSelect');
  const btnPt = document.getElementById('toolInsertPoint');
  const badge = document.getElementById('insertStatusBadge');

  if (tool === 'point') {
    if (btnPt) btnPt.className = 'tool-btn active';
    if (btnSel) btnSel.className = 'tool-btn';
    if (epuraSvg) epuraSvg.classList.add('tool-point');
    if (badge) {
      badge.style.display = 'inline-flex';
      badge.className = 'status-badge';
      badge.textContent = '1.º Passo: Marcar projeção horizontal A₁ (define abcissa x e afastamento y)';
    }
  } else {
    if (btnSel) btnSel.className = 'tool-btn active';
    if (btnPt) btnPt.className = 'tool-btn';
    if (epuraSvg) epuraSvg.classList.remove('tool-point');
    if (badge) badge.style.display = 'none';
  }
  renderAll();
}

/**
 * Main 2D Épura SVG Renderer
 * Can target screen SVG or print-export SVG
 */
function render2DEpura(targetSvg, forStudentSheet = false, forPrintMm = false) {
  if (!targetSvg) return;

  const gridG = targetSvg.querySelector('#svgGridLayer');
  const axisG = targetSvg.querySelector('#svgAxisLayer');
  const constG = targetSvg.querySelector('#svgConstructionLayer');
  const projG = targetSvg.querySelector('#svgProjectionsLayer');
  const solG = targetSvg.querySelector('#svgSolutionLayer');
  const interG = targetSvg.querySelector('#svgInteractiveLayer');
  const labelG = targetSvg.querySelector('#svgLabelsLayer');

  [gridG, axisG, constG, projG, solG, interG, labelG].forEach(g => { if (g) g.innerHTML = ''; });

  // 1. GRID LAYER (-15 cm to +15 cm)
  if (gridG && state.showGrid && !forPrintMm) {
    for (let cm = -MAX_CM; cm <= MAX_CM; cm += 1) {
      const pos = cm * MM_PER_CM;
      const isMajor = cm % 5 === 0;
      const stroke = isMajor ? '#CED4DA' : '#E9ECEF';
      const sw = isMajor ? '0.35' : '0.2';
      gridG.innerHTML += `<line x1="${pos}" y1="-150" x2="${pos}" y2="150" stroke="${stroke}" stroke-width="${sw}" />`;
      gridG.innerHTML += `<line x1="-150" y1="${pos}" x2="150" y2="${pos}" stroke="${stroke}" stroke-width="${sw}" />`;
    }
    // Outer bounding sheet (-15cm to +15cm)
    gridG.innerHTML += `<rect x="-150" y="-150" width="300" height="300" fill="none" stroke="#ADB5BD" stroke-width="0.35" />`;
  }

  // 2. AXIS X (Linha de Terra) & ORIGIN O
  if (axisG) {
    axisG.innerHTML += `
      <!-- Linha de Terra (Axis x) -->
      <line x1="-150" y1="0" x2="150" y2="0" stroke="#000000" stroke-width="0.4" />
      <!-- Origin Tick at x=0 -->
      <line x1="0" y1="-2" x2="0" y2="2" stroke="#000000" stroke-width="0.4" />
      <!-- Axis Labels: +x is to the LEFT in Portuguese GDA -->
      <text x="-147" y="-2.5" font-family="'Excon', sans-serif" font-size="4.2" font-weight="700" fill="#000000">x</text>
      <text x="1.5" y="-2.5" font-family="'Excon', sans-serif" font-size="3.8" font-weight="700" fill="#000000">O</text>
    `;
  }

  // Helper to append labels with clean font styling
  function appendSvgLabel(targetLayer, x, y, mainText, subText = '', color = '#000000', isBold = false) {
    if (!targetLayer) return;
    const weight = isBold ? '700' : '500';
    const sub = subText ? `<tspan dy="1.4" font-size="2.8">${subText}</tspan>` : '';
    targetLayer.innerHTML += `
      <text x="${x + 2}" y="${y - 1.5}" font-family="'Excon', sans-serif" font-size="3.8" font-weight="${weight}" fill="${color}">${mainText}${sub}</text>
    `;
  }

  // 3. RENDER PLANES
  state.entities.filter(e => e.type === 'plane').forEach(pl => {
    if (forStudentSheet && pl.isGoal) return;
    const pg = computePlaneGeometry(pl, getEntity);
    if (!pg) return;

    const isSel = state.selectedId === pl.id && !forPrintMm;
    const strokeColor = isSel ? '#E60000' : '#000000';
    const strokeW = pl.isGoal ? '0.6' : '0.35';
    const targetLayer = pl.isGoal ? solG : projG;

    // Frontal Trace f_alpha (y=0, z vertical up)
    if (pg.traceFSeg) {
      const p1 = toSvgA2(pg.traceFSeg[0].x, pg.traceFSeg[0].w);
      const p2 = toSvgA2(pg.traceFSeg[1].x, pg.traceFSeg[1].w);
      targetLayer.innerHTML += `
        <line class="interactive-line" data-id="${pl.id}" x1="${p1.sx}" y1="${p1.sy}" x2="${p2.sx}" y2="${p2.sy}" stroke="${strokeColor}" stroke-width="${strokeW}" />
      `;
      appendSvgLabel(labelG, p2.sx - 6, p2.sy + 4, 'f', pl.label, strokeColor, pl.isGoal);
    }

    // Horizontal Trace h_alpha (z=0, y vertical down)
    if (pg.traceHSeg) {
      const p1 = toSvgA1(pg.traceHSeg[0].x, pg.traceHSeg[0].w);
      const p2 = toSvgA1(pg.traceHSeg[1].x, pg.traceHSeg[1].w);
      targetLayer.innerHTML += `
        <line class="interactive-line" data-id="${pl.id}" x1="${p1.sx}" y1="${p1.sy}" x2="${p2.sx}" y2="${p2.sy}" stroke="${strokeColor}" stroke-width="${strokeW}" />
      `;
      appendSvgLabel(labelG, p2.sx - 6, p2.sy - 2, 'h', pl.label, strokeColor, pl.isGoal);
    }
  });

  // 4. RENDER LINES & AUTOMATIC TRACES (F and H)
  state.entities.filter(e => e.type === 'line').forEach(ln => {
    if (forStudentSheet && ln.isGoal) return;
    const lg = computeLineGeometry(ln, getEntity);
    if (!lg) return;

    const isSel = state.selectedId === ln.id && !forPrintMm;
    const strokeColor = isSel ? '#E60000' : '#000000';
    const strokeW = ln.isGoal ? '0.6' : '0.35';
    const targetLayer = ln.isGoal ? solG : projG;

    // Horizontal projection r1
    const s1 = toSvgA1(lg.pStart.x, lg.pStart.y);
    const e1 = toSvgA1(lg.pEnd.x, lg.pEnd.y);
    targetLayer.innerHTML += `
      <line class="interactive-line" data-id="${ln.id}" x1="${s1.sx}" y1="${s1.sy}" x2="${e1.sx}" y2="${e1.sy}" stroke="${strokeColor}" stroke-width="${strokeW}" />
    `;

    // Frontal projection r2
    const s2 = toSvgA2(lg.pStart.x, lg.pStart.z);
    const e2 = toSvgA2(lg.pEnd.x, lg.pEnd.z);
    targetLayer.innerHTML += `
      <line class="interactive-line" data-id="${ln.id}" x1="${s2.sx}" y1="${s2.sy}" x2="${e2.sx}" y2="${e2.sy}" stroke="${strokeColor}" stroke-width="${strokeW}" />
    `;

    // Labels r1, r2
    const refB = lg.pB || lg.pA;
    const b1 = toSvgA1(refB.x, refB.y);
    const b2 = toSvgA2(refB.x, refB.z);
    appendSvgLabel(labelG, b1.sx + 4, b1.sy + 4, ln.label, '1', strokeColor, ln.isGoal);
    appendSvgLabel(labelG, b2.sx + 4, b2.sy - 3, ln.label, '2', strokeColor, ln.isGoal);

    // Frontal Trace F (F1 on x-axis, F2 at z)
    if (ln.showTraceF && lg.traceF && (!forStudentSheet || !ln.askTraceF)) {
      const f1 = toSvgA1(lg.traceF.x, 0);
      const f2 = toSvgA2(lg.traceF.x, lg.traceF.z);
      // Recall line connecting F1 and F2
      constG.innerHTML += `
        <line x1="${f1.sx}" y1="${f1.sy}" x2="${f2.sx}" y2="${f2.sy}" stroke="#000000" stroke-width="0.18" stroke-dasharray="1.5,1.5" />
      `;
      solG.innerHTML += `
        <circle cx="${f1.sx}" cy="${f1.sy}" r="1.1" fill="#000000" />
        <circle cx="${f2.sx}" cy="${f2.sy}" r="1.4" fill="#000000" />
      `;
      appendSvgLabel(labelG, f1.sx - 6, f1.sy + 4.5, 'F', '1', '#000000', true);
      appendSvgLabel(labelG, f2.sx + 1.5, f2.sy - 1.5, 'F', '2', '#000000', true);
    }

    // Horizontal Trace H (H2 on x-axis, H1 at y)
    if (ln.showTraceH && lg.traceH && (!forStudentSheet || !ln.askTraceH)) {
      const h1 = toSvgA1(lg.traceH.x, lg.traceH.y);
      const h2 = toSvgA2(lg.traceH.x, 0);
      // Recall line connecting H1 and H2
      constG.innerHTML += `
        <line x1="${h1.sx}" y1="${h1.sy}" x2="${h2.sx}" y2="${h2.sy}" stroke="#000000" stroke-width="0.18" stroke-dasharray="1.5,1.5" />
      `;
      solG.innerHTML += `
        <circle cx="${h2.sx}" cy="${h2.sy}" r="1.1" fill="#000000" />
        <circle cx="${h1.sx}" cy="${h1.sy}" r="1.4" fill="#000000" />
      `;
      appendSvgLabel(labelG, h2.sx - 6, h2.sy - 2, 'H', '2', '#000000', true);
      appendSvgLabel(labelG, h1.sx + 1.5, h1.sy + 3.5, 'H', '1', '#000000', true);
    }
  });

  // 5. RENDER INTERSECTIONS
  state.entities.filter(e => e.type === 'intersection').forEach(intEnt => {
    if (forStudentSheet && intEnt.isGoal) return;
    const ig = computeIntersectionGeometry(intEnt, getEntity);
    if (!ig) return;

    const isSel = state.selectedId === intEnt.id && !forPrintMm;
    const col = isSel ? '#E60000' : '#00729C';

    if (ig.type === 'point' && ig.point) {
      const p1 = toSvgA1(ig.point.x, ig.point.y);
      const p2 = toSvgA2(ig.point.x, ig.point.z);

      constG.innerHTML += `
        <line x1="${p1.sx}" y1="${p1.sy}" x2="${p2.sx}" y2="${p2.sy}" stroke="${col}" stroke-width="0.2" stroke-dasharray="1.5,1.5" />
      `;
      solG.innerHTML += `
        <circle cx="${p1.sx}" cy="${p1.sy}" r="1.6" fill="${col}" />
        <circle cx="${p2.sx}" cy="${p2.sy}" r="1.6" fill="${col}" />
      `;
      appendSvgLabel(labelG, p1.sx + 1.5, p1.sy + 3.5, intEnt.label, '1', col, true);
      appendSvgLabel(labelG, p2.sx + 1.5, p2.sy - 1.5, intEnt.label, '2', col, true);
    } else if (ig.type === 'line' && ig.pStart && ig.pEnd) {
      const s1 = toSvgA1(ig.pStart.x, ig.pStart.y);
      const e1 = toSvgA1(ig.pEnd.x, ig.pEnd.y);
      const s2 = toSvgA2(ig.pStart.x, ig.pStart.z);
      const e2 = toSvgA2(ig.pEnd.x, ig.pEnd.z);

      solG.innerHTML += `
        <line class="interactive-line" data-id="${intEnt.id}" x1="${s1.sx}" y1="${s1.sy}" x2="${e1.sx}" y2="${e1.sy}" stroke="${col}" stroke-width="0.55" />
        <line class="interactive-line" data-id="${intEnt.id}" x1="${s2.sx}" y1="${s2.sy}" x2="${e2.sx}" y2="${e2.sy}" stroke="${col}" stroke-width="0.55" />
      `;
      appendSvgLabel(labelG, s1.sx + 3, s1.sy + 3, intEnt.label, '1', col, true);
      appendSvgLabel(labelG, s2.sx + 3, s2.sy - 3, intEnt.label, '2', col, true);
    }
  });

  // 6. RENDER POINTS (A1, A2 & LINHA DE CHAMADA)
  state.entities.filter(e => e.type === 'point').forEach(pt => {
    if (forStudentSheet && pt.isGoal) return;
    const a1 = toSvgA1(pt.x, pt.y);
    const a2 = toSvgA2(pt.x, pt.z);

    const isSel = state.selectedId === pt.id && !forPrintMm;
    const dotColor = isSel ? '#E60000' : '#000000';
    const rSize = isSel ? '1.8' : '1.35';

    // Linha de chamada (Connecting projector line)
    const minY = Math.min(0, a1.sy, a2.sy);
    const maxY = Math.max(0, a1.sy, a2.sy);
    if (!forStudentSheet || (!pt.omitY && !pt.omitZ)) {
      constG.innerHTML += `
        <line x1="${a1.sx}" y1="${minY}" x2="${a1.sx}" y2="${maxY}" stroke="${isSel ? '#E60000' : '#6C757D'}" stroke-width="0.18" />
      `;
    }

    // Horizontal Projection A1
    if (!forStudentSheet || !pt.omitY) {
      projG.innerHTML += `<circle cx="${a1.sx}" cy="${a1.sy}" r="${rSize}" fill="${dotColor}" />`;
      appendSvgLabel(labelG, a1.sx, a1.sy, pt.label, '1', dotColor, isSel);

      // Invisible grab handle for smooth pointer dragging
      if (!forPrintMm && interG) {
        interG.innerHTML += `
          <circle class="epura-handle" data-id="${pt.id}" data-proj="A1" cx="${a1.sx}" cy="${a1.sy}" r="3.4" fill="transparent" />
        `;
      }
    }

    // Frontal Projection A2
    if (!forStudentSheet || !pt.omitZ) {
      projG.innerHTML += `<circle cx="${a2.sx}" cy="${a2.sy}" r="${rSize}" fill="${dotColor}" />`;
      appendSvgLabel(labelG, a2.sx, a2.sy, pt.label, '2', dotColor, isSel);

      if (!forPrintMm && interG) {
        interG.innerHTML += `
          <circle class="epura-handle" data-id="${pt.id}" data-proj="A2" cx="${a2.sx}" cy="${a2.sy}" r="3.4" fill="transparent" />
        `;
      }
    }
  });

  // 7. PENDING 2-CLICK POINT INSERTION GUIDELINE
  if (state.pendingPointStep1 && !forPrintMm && interG) {
    const p1 = toSvgA1(state.pendingPointStep1.x, state.pendingPointStep1.y);
    interG.innerHTML += `
      <!-- Vertical Line of Recall Guideline -->
      <line x1="${p1.sx}" y1="-150" x2="${p1.sx}" y2="150" stroke="#00A3E0" stroke-width="0.35" stroke-dasharray="2,2" />
      <!-- Point A1 placed -->
      <circle cx="${p1.sx}" cy="${p1.sy}" r="1.8" fill="#00A3E0" />
      <text x="${p1.sx + 2.5}" y="${p1.sy - 1.5}" font-family="'Excon', sans-serif" font-size="3.6" fill="#00729C" font-weight="700">Novo₁ (x=${fmtSigned(state.pendingPointStep1.x)}; y=${fmt(state.pendingPointStep1.y)})</text>
    `;
  }
}
