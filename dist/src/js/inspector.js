/* ==========================================================================
   GDA-10 DIHEDRAL STUDIO — ENTITY INSPECTOR & MATHEMATICAL ANALYSIS (TAB 2)
   Provides in-depth geometric classifications, coordinates and properties
   ========================================================================== */

function renderInspectorTab() {
  const container = document.getElementById('inspectorContainer');
  if (!container) return;

  if (state.entities.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 30px 10px; color: var(--c-medgray);">
        <p style="font-weight: 600; font-size: 13px; margin-bottom: 6px;">Nenhum elemento geométrico selecionado</p>
        <p style="font-size: 11px;">Adicione elementos no Construtor por Blocos ou desenhe na Épura para ver as propriedades analíticas aqui.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.entities.map(ent => {
    const isSel = state.selectedId === ent.id;
    const borderStyle = isSel ? 'border-color: var(--c-darkblue); border-left: 3px solid var(--c-darkblue);' : '';

    if (ent.type === 'point') {
      const classification = classifyPoint(ent);
      return `
        <div onclick="selectEntity('${ent.id}')" class="inspector-card" style="${borderStyle} cursor: pointer;">
          <div class="inspector-card-title">
            <span>Ponto ${ent.label}</span>
            <span class="inspector-badge">${classification}</span>
          </div>
          <div class="inspector-meta-row">
            <span class="inspector-meta-key">Coordenadas Cartesianas:</span>
            <span class="inspector-meta-val">${ent.label}(${fmt(ent.x)}; ${fmt(ent.y)}; ${fmt(ent.z)}) cm</span>
          </div>
          <div class="inspector-meta-row">
            <span class="inspector-meta-key">Projeção Horizontal (A₁):</span>
            <span class="inspector-meta-val">${ent.label}₁ (x = ${fmtSigned(ent.x)}; y = ${fmt(ent.y)})</span>
          </div>
          <div class="inspector-meta-row">
            <span class="inspector-meta-key">Projeção Frontal (A₂):</span>
            <span class="inspector-meta-val">${ent.label}₂ (x = ${fmtSigned(ent.x)}; z = ${fmt(ent.z)})</span>
          </div>
          <div class="inspector-meta-row">
            <span class="inspector-meta-key">Distância ao Eixo x:</span>
            <span class="inspector-meta-val">${fmt(Math.hypot(ent.y, ent.z), 2)} cm</span>
          </div>
        </div>
      `;
    }

    if (ent.type === 'line') {
      const lg = computeLineGeometry(ent, getEntity);
      const lineClass = classifyLine(lg);
      return `
        <div onclick="selectEntity('${ent.id}')" class="inspector-card" style="${borderStyle} cursor: pointer;">
          <div class="inspector-card-title">
            <span>Reta ${ent.label}</span>
            <span class="inspector-badge">${lineClass}</span>
          </div>
          ${lg ? `
            <div class="inspector-meta-row">
              <span class="inspector-meta-key">Vetor Diretor:</span>
              <span class="inspector-meta-val">(${fmt(lg.dx)}; ${fmt(lg.dy)}; ${fmt(lg.dz)})</span>
            </div>
            <div class="inspector-meta-row">
              <span class="inspector-meta-key">Traço Frontal (F = r ∩ φ₀):</span>
              <span class="inspector-meta-val">${lg.traceF ? `F(${fmt(lg.traceF.x)}; 0; ${fmt(lg.traceF.z)})` : 'Não tem (paralela a φ₀)'}</span>
            </div>
            <div class="inspector-meta-row">
              <span class="inspector-meta-key">Traço Horizontal (H = r ∩ ν₀):</span>
              <span class="inspector-meta-val">${lg.traceH ? `H(${fmt(lg.traceH.x)}; ${fmt(lg.traceH.y)}; 0)` : 'Não tem (paralela a ν₀)'}</span>
            </div>
            <div class="inspector-meta-row">
              <span class="inspector-meta-key">Interseção com β₁₃ (Q):</span>
              <span class="inspector-meta-val">${lg.pointQ ? `Q(${fmt(lg.pointQ.x)}; ${fmt(lg.pointQ.y)}; ${fmt(lg.pointQ.z)})` : 'Não interseta'}</span>
            </div>
            <div class="inspector-meta-row">
              <span class="inspector-meta-key">Interseção com β₂₄ (I_β₂₄):</span>
              <span class="inspector-meta-val">${lg.pointI24 ? `I(${fmt(lg.pointI24.x)}; ${fmt(lg.pointI24.y)}; ${fmt(lg.pointI24.z)})` : 'Não interseta'}</span>
            </div>
          ` : '<div class="inspector-meta-row"><span class="inspector-meta-key">Definição incompleta</span></div>'}
        </div>
      `;
    }

    if (ent.type === 'plane') {
      const pg = computePlaneGeometry(ent, getEntity);
      const planeClass = classifyPlane(pg);
      return `
        <div onclick="selectEntity('${ent.id}')" class="inspector-card" style="${borderStyle} cursor: pointer;">
          <div class="inspector-card-title">
            <span>Plano ${ent.label}</span>
            <span class="inspector-badge">${planeClass}</span>
          </div>
          ${pg ? `
            <div class="inspector-meta-row">
              <span class="inspector-meta-key">Vértice no Eixo x (X₀):</span>
              <span class="inspector-meta-val">${pg.x0 !== null ? `x = ${fmt(pg.x0)} cm` : 'Paralelo ao eixo x'}</span>
            </div>
            <div class="inspector-meta-row">
              <span class="inspector-meta-key">Vetor Normal:</span>
              <span class="inspector-meta-val">n(${fmt(pg.nx, 2)}; ${fmt(pg.ny, 2)}; ${fmt(pg.nz, 2)})</span>
            </div>
            <div class="inspector-meta-row">
              <span class="inspector-meta-key">Traço Frontal f${ent.label}:</span>
              <span class="inspector-meta-val">${pg.traceFSeg ? 'Definido no semi-plano frontal' : 'Paralelo a φ₀'}</span>
            </div>
            <div class="inspector-meta-row">
              <span class="inspector-meta-key">Traço Horizontal h${ent.label}:</span>
              <span class="inspector-meta-val">${pg.traceHSeg ? 'Definido no semi-plano horizontal' : 'Paralelo a ν₀'}</span>
            </div>
          ` : '<div class="inspector-meta-row"><span class="inspector-meta-key">Definição incompleta</span></div>'}
        </div>
      `;
    }

    if (ent.type === 'intersection') {
      const ig = computeIntersectionGeometry(ent, getEntity);
      return `
        <div onclick="selectEntity('${ent.id}')" class="inspector-card" style="${borderStyle} cursor: pointer;">
          <div class="inspector-card-title">
            <span>Interseção ${ent.label}</span>
            <span class="inspector-badge">${ent.mode}</span>
          </div>
          ${ig && ig.type === 'point' && ig.point ? `
            <div class="inspector-meta-row">
              <span class="inspector-meta-key">Ponto de Interseção:</span>
              <span class="inspector-meta-val">${ent.label}(${fmt(ig.point.x)}; ${fmt(ig.point.y)}; ${fmt(ig.point.z)}) cm</span>
            </div>
            <div class="inspector-meta-row">
              <span class="inspector-meta-key">Diedro de Interseção:</span>
              <span class="inspector-meta-val">${classifyPoint(ig.point)}</span>
            </div>
          ` : (ig && ig.type === 'line' ? `
            <div class="inspector-meta-row">
              <span class="inspector-meta-key">Reta de Interseção (i):</span>
              <span class="inspector-meta-val">Reta definida por Fi e Hi</span>
            </div>
          ` : '<div class="inspector-meta-row"><span class="inspector-meta-key">Sem interseção determinada</span></div>')}
        </div>
      `;
    }

    return '';
  }).join('');
}
