/* ==========================================================================
   GDA-10 DIHEDRAL STUDIO — STRUCTURED FORM BUILDER (CONSTRUTOR POR BLOCOS)
   Allows teacher to compose problems with points, lines, planes, intersections
   ========================================================================== */

function addBlockFromDropdown() {
  const typeSelect = document.getElementById('newBlockType');
  const type = typeSelect ? typeSelect.value : 'point';

  const points = state.entities.filter(e => e.type === 'point');
  const lines = state.entities.filter(e => e.type === 'line');
  const planes = state.entities.filter(e => e.type === 'plane');

  if (type === 'point') {
    const label = getNextPointLetter();
    const id = 'pt_' + Date.now();
    state.entities.push({
      id,
      type: 'point',
      label,
      x: 3.0,
      y: 4.0,
      z: 5.0,
      inStatement: true,
      omitX: false,
      omitY: false,
      omitZ: false,
      isGoal: false
    });
    state.selectedId = id;
  } else if (type === 'line') {
    const label = getNextLineLetter();
    const id = 'ln_' + Date.now();
    const p1Id = points[0] ? points[0].id : '';
    const p2Id = points[1] ? points[1].id : p1Id;

    state.entities.push({
      id,
      type: 'line',
      label,
      mode: '2points',
      p1Id,
      p2Id,
      lineType: 'obliqua',
      angle: 45,
      inStatement: false,
      isGoal: true,
      showTraceF: true,
      askTraceF: true,
      showTraceH: true,
      askTraceH: false
    });
    state.selectedId = id;
  } else if (type === 'plane') {
    const label = getNextPlaneLetter();
    const id = 'pl_' + Date.now();
    state.entities.push({
      id,
      type: 'plane',
      label,
      mode: 'traces',
      x0: 5.0,
      angF: 45,
      angH: 40,
      dirF: 'left',
      dirH: 'left',
      p1Id: points[0] ? points[0].id : '',
      p2Id: points[1] ? points[1].id : '',
      p3Id: points[2] ? points[2].id : '',
      inStatement: true,
      isGoal: false
    });
    state.selectedId = id;
  } else if (type === 'intersection') {
    const id = 'int_' + Date.now();
    state.entities.push({
      id,
      type: 'intersection',
      label: 'I',
      mode: 'line-plane',
      lineId: lines[0] ? lines[0].id : '',
      planeId: planes[0] ? planes[0].id : '',
      line1Id: lines[0] ? lines[0].id : '',
      line2Id: lines[1] ? lines[1].id : '',
      plane1Id: planes[0] ? planes[0].id : '',
      plane2Id: planes[1] ? planes[1].id : '',
      inStatement: false,
      isGoal: true
    });
    state.selectedId = id;
  }

  renderAll();
  // Scroll to bottom of blocks list
  const container = document.getElementById('blocksContainer');
  if (container) {
    setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
  }
}

function selectEntity(id) {
  state.selectedId = id;
  renderAll();
}

function deleteEntity(id) {
  state.entities = state.entities.filter(e => e.id !== id);
  if (state.selectedId === id) state.selectedId = null;
  renderAll();
}

function duplicateEntity(id) {
  const orig = getEntity(id);
  if (!orig) return;
  const copy = JSON.parse(JSON.stringify(orig));
  copy.id = orig.type + '_' + Date.now();
  if (orig.type === 'point') copy.label = getNextPointLetter();
  else if (orig.type === 'line') copy.label = getNextLineLetter();
  else if (orig.type === 'plane') copy.label = getNextPlaneLetter();
  state.entities.push(copy);
  state.selectedId = copy.id;
  renderAll();
}

function updateEntityField(id, field, value, isNumeric = false) {
  const ent = getEntity(id);
  if (!ent) return;
  ent[field] = isNumeric ? (parseFloat(value) || 0) : value;

  // Selective fast re-render
  render2DEpura(epuraSvg, state.previewStudentSheet, false);
  if (typeof render3DView === 'function') render3DView();
  if (typeof generatePortugueseStatement === 'function') generatePortugueseStatement();
}

/**
 * Builds the HTML cards for all entities in Tab 1
 */
function renderSidebarBlocks() {
  const container = document.getElementById('blocksContainer');
  if (!container) return;

  const points = state.entities.filter(e => e.type === 'point');
  const lines = state.entities.filter(e => e.type === 'line');
  const planes = state.entities.filter(e => e.type === 'plane');

  if (state.entities.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 30px 10px; color: var(--c-medgray);">
        <p style="font-weight: 600; font-size: 13px; margin-bottom: 6px;">Nenhum elemento geométrico adicionado</p>
        <p style="font-size: 11px;">Use o seletor acima para adicionar Pontos, Retas, Planos ou Interseções, ou escolha um exemplo no topo.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.entities.map(ent => {
    const isSel = state.selectedId === ent.id;
    const selClass = isSel ? 'selected' : '';

    // ==========================================
    // 1. POINT CARD
    // ==========================================
    if (ent.type === 'point') {
      const classification = classifyPoint(ent);
      return `
        <div onclick="selectEntity('${ent.id}')" class="entity-card ${selClass}">
          <div class="card-header">
            <div class="card-entity-title">
              <span class="entity-type-badge badge-point">PONTO</span>
              <input type="text" value="${ent.label}" maxlength="3"
                onclick="event.stopPropagation()"
                onchange="updateEntityField('${ent.id}', 'label', this.value); renderAll();"
                class="entity-label-input" />
              <span class="entity-subclassification">${classification}</span>
            </div>
            <div class="card-actions">
              <button onclick="event.stopPropagation(); duplicateEntity('${ent.id}')" class="btn-card-del" title="Duplicar Ponto">⧉</button>
              <button onclick="event.stopPropagation(); deleteEntity('${ent.id}')" class="btn-card-del" title="Eliminar Ponto">✕</button>
            </div>
          </div>

          <!-- Coordinates Grid -->
          <div class="coords-grid" onclick="event.stopPropagation()">
            <!-- Abcissa X -->
            <div class="coord-cell">
              <div class="coord-header">
                <span class="coord-name">Abcissa x</span>
                <label class="coord-omit-label" title="Desmarque para omitir esta coordenada no enunciado">
                  <input type="checkbox" ${!ent.omitX ? 'checked' : ''}
                    onchange="updateEntityField('${ent.id}','omitX', !this.checked); renderSidebarBlocks();" />
                  <span>Dar</span>
                </label>
              </div>
              <input type="number" step="0.1" value="${ent.x}"
                oninput="updateEntityField('${ent.id}', 'x', this.value, true)"
                class="coord-input" />
            </div>

            <!-- Afastamento Y -->
            <div class="coord-cell">
              <div class="coord-header">
                <span class="coord-name">Afast. y (A₁)</span>
                <label class="coord-omit-label" title="Desmarque para omitir esta coordenada no enunciado">
                  <input type="checkbox" ${!ent.omitY ? 'checked' : ''}
                    onchange="updateEntityField('${ent.id}','omitY', !this.checked); renderSidebarBlocks();" />
                  <span>Dar</span>
                </label>
              </div>
              <input type="number" step="0.1" value="${ent.y}"
                oninput="updateEntityField('${ent.id}', 'y', this.value, true)"
                class="coord-input" />
            </div>

            <!-- Cota Z -->
            <div class="coord-cell">
              <div class="coord-header">
                <span class="coord-name">Cota z (A₂)</span>
                <label class="coord-omit-label" title="Desmarque para omitir esta coordenada no enunciado">
                  <input type="checkbox" ${!ent.omitZ ? 'checked' : ''}
                    onchange="updateEntityField('${ent.id}','omitZ', !this.checked); renderSidebarBlocks();" />
                  <span>Dar</span>
                </label>
              </div>
              <input type="number" step="0.1" value="${ent.z}"
                oninput="updateEntityField('${ent.id}', 'z', this.value, true)"
                class="coord-input" />
            </div>
          </div>

          <!-- Pedagogical Role Bar -->
          <div class="card-pedagogical-bar" onclick="event.stopPropagation()">
            <label class="role-checkbox">
              <input type="checkbox" ${ent.inStatement ? 'checked' : ''}
                onchange="updateEntityField('${ent.id}', 'inStatement', this.checked); generatePortugueseStatement();" />
              <span>Dado no enunciado</span>
            </label>
            <label class="role-checkbox goal">
              <input type="checkbox" ${ent.isGoal ? 'checked' : ''}
                onchange="updateEntityField('${ent.id}', 'isGoal', this.checked); renderAll();" />
              <span>🎯 Objetivo / Determinar</span>
            </label>
          </div>
        </div>
      `;
    }

    // ==========================================
    // 2. LINE CARD
    // ==========================================
    if (ent.type === 'line') {
      const lg = computeLineGeometry(ent, getEntity);
      const lineClass = classifyLine(lg);
      const ptOpts1 = points.map(p => `<option value="${p.id}" ${p.id === ent.p1Id ? 'selected' : ''}>Ponto ${p.label}</option>`).join('');
      const ptOpts2 = points.map(p => `<option value="${p.id}" ${p.id === ent.p2Id ? 'selected' : ''}>Ponto ${p.label}</option>`).join('');

      return `
        <div onclick="selectEntity('${ent.id}')" class="entity-card ${selClass}">
          <div class="card-header">
            <div class="card-entity-title">
              <span class="entity-type-badge badge-line">RETA</span>
              <input type="text" value="${ent.label}" maxlength="2"
                onclick="event.stopPropagation()"
                onchange="updateEntityField('${ent.id}', 'label', this.value); renderAll();"
                class="entity-label-input" />
              <span class="entity-subclassification">${lineClass}</span>
            </div>
            <div class="card-actions">
              <button onclick="event.stopPropagation(); duplicateEntity('${ent.id}')" class="btn-card-del" title="Duplicar Reta">⧉</button>
              <button onclick="event.stopPropagation(); deleteEntity('${ent.id}')" class="btn-card-del" title="Eliminar Reta">✕</button>
            </div>
          </div>

          <!-- Definition Mode Selector -->
          <div style="display: flex; gap: 6px; margin-bottom: 8px;" onclick="event.stopPropagation()">
            <select onchange="updateEntityField('${ent.id}', 'mode', this.value); renderSidebarBlocks();"
              class="add-block-select" style="font-size: 11px; padding: 4px 6px;">
              <option value="2points" ${ent.mode === '2points' ? 'selected' : ''}>Definida por 2 Pontos</option>
              <option value="point-type" ${ent.mode === 'point-type' ? 'selected' : ''}>Por 1 Ponto e Tipo / Direção</option>
            </select>
          </div>

          ${ent.mode === 'point-type' ? `
            <!-- Mode 1 Point + Type -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;" onclick="event.stopPropagation()">
              <div>
                <span class="coord-name" style="display:block; margin-bottom: 2px;">Ponto de Passagem</span>
                <select onchange="updateEntityField('${ent.id}', 'p1Id', this.value); renderAll();" class="add-block-select" style="padding: 3px 5px;">
                  ${ptOpts1}
                </select>
              </div>
              <div>
                <span class="coord-name" style="display:block; margin-bottom: 2px;">Tipo de Reta</span>
                <select onchange="updateEntityField('${ent.id}', 'lineType', this.value); renderAll();" class="add-block-select" style="padding: 3px 5px;">
                  <option value="obliqua" ${ent.lineType === 'obliqua' ? 'selected' : ''}>Oblíqua</option>
                  <option value="nivel" ${ent.lineType === 'nivel' ? 'selected' : ''}>De Nível (Horizontal)</option>
                  <option value="frontal" ${ent.lineType === 'frontal' ? 'selected' : ''}>Frontal (de Frente)</option>
                  <option value="topo" ${ent.lineType === 'topo' ? 'selected' : ''}>De Topo (⊥ φ₀)</option>
                  <option value="vertical" ${ent.lineType === 'vertical' ? 'selected' : ''}>Vertical (⊥ ν₀)</option>
                  <option value="perfil" ${ent.lineType === 'perfil' ? 'selected' : ''}>De Perfil (⊥ x)</option>
                  <option value="fronto-horizontal" ${ent.lineType === 'fronto-horizontal' ? 'selected' : ''}>Fronto-Horizontal</option>
                </select>
              </div>
            </div>
          ` : `
            <!-- Mode 2 Points -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;" onclick="event.stopPropagation()">
              <div>
                <span class="coord-name" style="display:block; margin-bottom: 2px;">Ponto 1</span>
                <select onchange="updateEntityField('${ent.id}', 'p1Id', this.value); renderAll();" class="add-block-select" style="padding: 3px 5px;">
                  ${ptOpts1}
                </select>
              </div>
              <div>
                <span class="coord-name" style="display:block; margin-bottom: 2px;">Ponto 2</span>
                <select onchange="updateEntityField('${ent.id}', 'p2Id', this.value); renderAll();" class="add-block-select" style="padding: 3px 5px;">
                  ${ptOpts2}
                </select>
              </div>
            </div>
          `}

          <!-- Pedagogical Trace Goals -->
          <div style="background-color: var(--c-offwhite); border: 1px solid var(--c-border); padding: 6px 8px; border-radius: 2px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 4px;" onclick="event.stopPropagation()">
            <div style="display: flex; gap: 12px; font-size: 11px;">
              <label class="role-checkbox">
                <input type="checkbox" ${ent.showTraceF ? 'checked' : ''}
                  onchange="updateEntityField('${ent.id}', 'showTraceF', this.checked); renderAll();" />
                <span>Mostrar Traço F</span>
              </label>
              <label class="role-checkbox goal">
                <input type="checkbox" ${ent.askTraceF ? 'checked' : ''}
                  onchange="updateEntityField('${ent.id}', 'askTraceF', this.checked); if(this.checked) updateEntityField('${ent.id}', 'showTraceF', true); renderAll();" />
                <span>🎯 Pedir F</span>
              </label>
            </div>
            <div style="display: flex; gap: 12px; font-size: 11px;">
              <label class="role-checkbox">
                <input type="checkbox" ${ent.showTraceH ? 'checked' : ''}
                  onchange="updateEntityField('${ent.id}', 'showTraceH', this.checked); renderAll();" />
                <span>Mostrar Traço H</span>
              </label>
              <label class="role-checkbox goal">
                <input type="checkbox" ${ent.askTraceH ? 'checked' : ''}
                  onchange="updateEntityField('${ent.id}', 'askTraceH', this.checked); if(this.checked) updateEntityField('${ent.id}', 'showTraceH', true); renderAll();" />
                <span>🎯 Pedir H</span>
              </label>
            </div>
          </div>

          <!-- Computed Traces Readout -->
          ${lg ? `
            <div class="mono" style="font-size: 10px; color: var(--c-darkblue); margin-bottom: 6px;">
              ${lg.traceF ? `F(${fmt(lg.traceF.x)}; 0; ${fmt(lg.traceF.z)})` : 'F: (Sem traço frontal)'} • 
              ${lg.traceH ? `H(${fmt(lg.traceH.x)}; ${fmt(lg.traceH.y)}; 0)` : 'H: (Sem traço horiz.)'}
            </div>
          ` : ''}

          <!-- Pedagogical Role Bar -->
          <div class="card-pedagogical-bar" onclick="event.stopPropagation()">
            <label class="role-checkbox">
              <input type="checkbox" ${ent.inStatement ? 'checked' : ''}
                onchange="updateEntityField('${ent.id}', 'inStatement', this.checked); generatePortugueseStatement();" />
              <span>Dado no enunciado</span>
            </label>
            <label class="role-checkbox goal">
              <input type="checkbox" ${ent.isGoal ? 'checked' : ''}
                onchange="updateEntityField('${ent.id}', 'isGoal', this.checked); renderAll();" />
              <span>🎯 Determinar Reta (${ent.label})</span>
            </label>
          </div>
        </div>
      `;
    }

    // ==========================================
    // 3. PLANE CARD
    // ==========================================
    if (ent.type === 'plane') {
      const pg = computePlaneGeometry(ent, getEntity);
      const planeClass = classifyPlane(pg);
      const ptOpts1 = points.map(p => `<option value="${p.id}" ${p.id === ent.p1Id ? 'selected' : ''}>Ponto ${p.label}</option>`).join('');
      const ptOpts2 = points.map(p => `<option value="${p.id}" ${p.id === ent.p2Id ? 'selected' : ''}>Ponto ${p.label}</option>`).join('');
      const ptOpts3 = points.map(p => `<option value="${p.id}" ${p.id === ent.p3Id ? 'selected' : ''}>Ponto ${p.label}</option>`).join('');

      return `
        <div onclick="selectEntity('${ent.id}')" class="entity-card ${selClass}">
          <div class="card-header">
            <div class="card-entity-title">
              <span class="entity-type-badge badge-plane">PLANO</span>
              <input type="text" value="${ent.label}" maxlength="2"
                onclick="event.stopPropagation()"
                onchange="updateEntityField('${ent.id}', 'label', this.value); renderAll();"
                class="entity-label-input" />
              <span class="entity-subclassification">${planeClass}</span>
            </div>
            <div class="card-actions">
              <button onclick="event.stopPropagation(); duplicateEntity('${ent.id}')" class="btn-card-del" title="Duplicar Plano">⧉</button>
              <button onclick="event.stopPropagation(); deleteEntity('${ent.id}')" class="btn-card-del" title="Eliminar Plano">✕</button>
            </div>
          </div>

          <!-- Definition Mode Selector -->
          <div style="margin-bottom: 8px;" onclick="event.stopPropagation()">
            <select onchange="updateEntityField('${ent.id}', 'mode', this.value); renderSidebarBlocks();"
              class="add-block-select" style="font-size: 11px; padding: 4px 6px; width: 100%;">
              <option value="traces" ${ent.mode === 'traces' ? 'selected' : ''}>Por Traços Diretos (fα, hα e Vértice X₀)</option>
              <option value="3points" ${ent.mode === '3points' ? 'selected' : ''}>Por 3 Pontos Não Colineares</option>
            </select>
          </div>

          ${ent.mode === 'traces' ? `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 8px;" onclick="event.stopPropagation()">
              <div class="coord-cell">
                <span class="coord-name">Vértice X₀ (cm)</span>
                <input type="number" step="0.5" value="${ent.x0}"
                  oninput="updateEntityField('${ent.id}', 'x0', this.value, true)"
                  class="coord-input" />
              </div>
              <div class="coord-cell">
                <span class="coord-name">Ângulo fα (°)</span>
                <input type="number" step="5" value="${ent.angF}"
                  oninput="updateEntityField('${ent.id}', 'angF', this.value, true)"
                  class="coord-input" />
              </div>
              <div class="coord-cell">
                <span class="coord-name">Ângulo hα (°)</span>
                <input type="number" step="5" value="${ent.angH}"
                  oninput="updateEntityField('${ent.id}', 'angH', this.value, true)"
                  class="coord-input" />
              </div>
            </div>
          ` : `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 8px;" onclick="event.stopPropagation()">
              <div>
                <span class="coord-name" style="display:block; margin-bottom: 2px;">Ponto 1</span>
                <select onchange="updateEntityField('${ent.id}','p1Id',this.value); renderAll();" class="add-block-select" style="padding: 3px 5px;">${ptOpts1}</select>
              </div>
              <div>
                <span class="coord-name" style="display:block; margin-bottom: 2px;">Ponto 2</span>
                <select onchange="updateEntityField('${ent.id}','p2Id',this.value); renderAll();" class="add-block-select" style="padding: 3px 5px;">${ptOpts2}</select>
              </div>
              <div>
                <span class="coord-name" style="display:block; margin-bottom: 2px;">Ponto 3</span>
                <select onchange="updateEntityField('${ent.id}','p3Id',this.value); renderAll();" class="add-block-select" style="padding: 3px 5px;">${ptOpts3}</select>
              </div>
            </div>
          `}

          <!-- Pedagogical Role Bar -->
          <div class="card-pedagogical-bar" onclick="event.stopPropagation()">
            <label class="role-checkbox">
              <input type="checkbox" ${ent.inStatement ? 'checked' : ''}
                onchange="updateEntityField('${ent.id}', 'inStatement', this.checked); generatePortugueseStatement();" />
              <span>Dado no enunciado</span>
            </label>
            <label class="role-checkbox goal">
              <input type="checkbox" ${ent.isGoal ? 'checked' : ''}
                onchange="updateEntityField('${ent.id}', 'isGoal', this.checked); renderAll();" />
              <span>🎯 Determinar Traços do Plano</span>
            </label>
          </div>
        </div>
      `;
    }

    // ==========================================
    // 4. INTERSECTION CARD
    // ==========================================
    if (ent.type === 'intersection') {
      const ig = computeIntersectionGeometry(ent, getEntity);
      const lnOpts = lines.map(l => `<option value="${l.id}" ${l.id === ent.lineId ? 'selected' : ''}>Reta ${l.label}</option>`).join('');
      const plOpts = planes.map(p => `<option value="${p.id}" ${p.id === ent.planeId ? 'selected' : ''}>Plano ${p.label}</option>`).join('');
      const lnOpts1 = lines.map(l => `<option value="${l.id}" ${l.id === ent.line1Id ? 'selected' : ''}>Reta ${l.label}</option>`).join('');
      const lnOpts2 = lines.map(l => `<option value="${l.id}" ${l.id === ent.line2Id ? 'selected' : ''}>Reta ${l.label}</option>`).join('');
      const plOpts1 = planes.map(p => `<option value="${p.id}" ${p.id === ent.plane1Id ? 'selected' : ''}>Plano ${p.label}</option>`).join('');
      const plOpts2 = planes.map(p => `<option value="${p.id}" ${p.id === ent.plane2Id ? 'selected' : ''}>Plano ${p.label}</option>`).join('');

      return `
        <div onclick="selectEntity('${ent.id}')" class="entity-card ${selClass}">
          <div class="card-header">
            <div class="card-entity-title">
              <span class="entity-type-badge badge-intersection">INTERSEÇÃO</span>
              <input type="text" value="${ent.label}" maxlength="2"
                onclick="event.stopPropagation()"
                onchange="updateEntityField('${ent.id}', 'label', this.value); renderAll();"
                class="entity-label-input" />
              <span class="entity-subclassification">
                ${ent.mode === 'line-plane' ? 'Reta ∩ Plano' : (ent.mode === 'line-line' ? 'Reta ∩ Reta' : 'Plano ∩ Plano')}
              </span>
            </div>
            <div class="card-actions">
              <button onclick="event.stopPropagation(); deleteEntity('${ent.id}')" class="btn-card-del" title="Eliminar Interseção">✕</button>
            </div>
          </div>

          <!-- Mode Selector -->
          <div style="margin-bottom: 8px;" onclick="event.stopPropagation()">
            <select onchange="updateEntityField('${ent.id}', 'mode', this.value); renderSidebarBlocks();"
              class="add-block-select" style="font-size: 11px; padding: 4px 6px; width: 100%;">
              <option value="line-plane" ${ent.mode === 'line-plane' ? 'selected' : ''}>Reta ∩ Plano (Ponto I)</option>
              <option value="line-line" ${ent.mode === 'line-line' ? 'selected' : ''}>Reta ∩ Reta (Concorrentes -> Ponto I)</option>
              <option value="plane-plane" ${ent.mode === 'plane-plane' ? 'selected' : ''}>Plano ∩ Plano (Reta de Interseção i)</option>
            </select>
          </div>

          ${ent.mode === 'line-plane' ? `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;" onclick="event.stopPropagation()">
              <div>
                <span class="coord-name" style="display:block; margin-bottom: 2px;">Reta</span>
                <select onchange="updateEntityField('${ent.id}', 'lineId', this.value); renderAll();" class="add-block-select" style="padding: 3px 5px;">${lnOpts}</select>
              </div>
              <div>
                <span class="coord-name" style="display:block; margin-bottom: 2px;">Plano</span>
                <select onchange="updateEntityField('${ent.id}', 'planeId', this.value); renderAll();" class="add-block-select" style="padding: 3px 5px;">${plOpts}</select>
              </div>
            </div>
          ` : (ent.mode === 'line-line' ? `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;" onclick="event.stopPropagation()">
              <div>
                <span class="coord-name" style="display:block; margin-bottom: 2px;">Reta 1</span>
                <select onchange="updateEntityField('${ent.id}', 'line1Id', this.value); renderAll();" class="add-block-select" style="padding: 3px 5px;">${lnOpts1}</select>
              </div>
              <div>
                <span class="coord-name" style="display:block; margin-bottom: 2px;">Reta 2</span>
                <select onchange="updateEntityField('${ent.id}', 'line2Id', this.value); renderAll();" class="add-block-select" style="padding: 3px 5px;">${lnOpts2}</select>
              </div>
            </div>
          ` : `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;" onclick="event.stopPropagation()">
              <div>
                <span class="coord-name" style="display:block; margin-bottom: 2px;">Plano 1</span>
                <select onchange="updateEntityField('${ent.id}', 'plane1Id', this.value); renderAll();" class="add-block-select" style="padding: 3px 5px;">${plOpts1}</select>
              </div>
              <div>
                <span class="coord-name" style="display:block; margin-bottom: 2px;">Plano 2</span>
                <select onchange="updateEntityField('${ent.id}', 'plane2Id', this.value); renderAll();" class="add-block-select" style="padding: 3px 5px;">${plOpts2}</select>
              </div>
            </div>
          `)}

          <!-- Computed Result Readout -->
          ${ig ? `
            <div class="mono" style="font-size: 11px; font-weight: 700; color: #0E9F6E; margin-bottom: 6px;">
              ${ig.type === 'point' && ig.point ? `${ent.label}(${fmt(ig.point.x)}; ${fmt(ig.point.y)}; ${fmt(ig.point.z)})` : ''}
              ${ig.type === 'line' ? `Reta de Interseção ${ent.label}` : ''}
            </div>
          ` : `
            <div class="mono" style="font-size: 10px; color: var(--c-medgray); margin-bottom: 6px;">(Sem interseção determinada)</div>
          `}

          <!-- Pedagogical Role Bar -->
          <div class="card-pedagogical-bar" onclick="event.stopPropagation()">
            <label class="role-checkbox">
              <input type="checkbox" ${ent.inStatement ? 'checked' : ''}
                onchange="updateEntityField('${ent.id}', 'inStatement', this.checked); generatePortugueseStatement();" />
              <span>Dado no enunciado</span>
            </label>
            <label class="role-checkbox goal">
              <input type="checkbox" ${ent.isGoal ? 'checked' : ''}
                onchange="updateEntityField('${ent.id}', 'isGoal', this.checked); renderAll();" />
              <span>🎯 Determinar Interseção (${ent.label})</span>
            </label>
          </div>
        </div>
      `;
    }

    return '';
  }).join('');
}
