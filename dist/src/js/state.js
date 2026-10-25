/* ==========================================================================
   GDA-10 DIHEDRAL STUDIO — REACTIVE STATE STORE & PRESETS
   ========================================================================== */

const state = {
  // Layout & Visibility
  layoutMode: 'split', // 'split' | 'epura' | '3d'
  sidebarOpen: true,
  activeTab: 'builder', // 'builder' | 'inspector' | 'statement'
  
  // Interactive Tools & Grid
  mouseTool: 'select', // 'select' | 'point'
  snap05: true,
  snapValue: 0.5,
  showGrid: true,
  showBisectors: true,
  previewStudentSheet: false,
  sheetFormat: '300x300', // '300x300' | 'a4-landscape' | 'a4-portrait'
  
  // Selection & 2-Click Insertion State
  selectedId: null,
  pendingPointStep1: null, // { x, y }
  
  // 3D Spatial Parameters
  rebatimentoDeg: 0,
  rebatimentoAnimating: false,
  
  // Geometric Entities Store
  entities: []
};

/**
 * Find entity by ID
 */
function getEntity(id) {
  return state.entities.find(e => e.id === id);
}

/**
 * Generates next unused Latin uppercase letter for points (A, B, C, ...)
 */
function getNextPointLetter() {
  const used = new Set(state.entities.filter(e => e.type === 'point').map(e => e.label));
  for (let code = 65; code <= 90; code++) {
    const ch = String.fromCharCode(code);
    if (!used.has(ch)) return ch;
  }
  return 'P';
}

/**
 * Generates next unused lowercase letter for lines (a, b, r, s, t, ...)
 */
function getNextLineLetter() {
  const preferred = ['a', 'b', 'r', 's', 't', 'm', 'n', 'p', 'f', 'h'];
  const used = new Set(state.entities.filter(e => e.type === 'line').map(e => e.label));
  for (const ch of preferred) {
    if (!used.has(ch)) return ch;
  }
  return 'r';
}

/**
 * Generates next unused Greek letter for planes (α, β, γ, θ, ω, ...)
 */
function getNextPlaneLetter() {
  const preferred = ['α', 'β', 'γ', 'θ', 'ω', 'δ', 'π', 'σ'];
  const used = new Set(state.entities.filter(e => e.type === 'plane').map(e => e.label));
  for (const ch of preferred) {
    if (!used.has(ch)) return ch;
  }
  return 'α';
}

/**
 * Preset Library tailored for 10th-grade Portuguese National Curriculum
 */
const presets = {
  // 1. Reta Oblíqua e Traços F e H (Patrícia & Pedro's Default)
  'default': [
    {
      id: 'ptA', type: 'point', label: 'A', x: 3, y: 5, z: 4,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'ptB', type: 'point', label: 'B', x: -1, y: 2, z: -5,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'lnA', type: 'line', label: 'a', mode: '2points', p1Id: 'ptA', p2Id: 'ptB',
      inStatement: false, isGoal: true, showTraceF: true, askTraceF: true, showTraceH: true, askTraceH: false
    }
  ],

  // 2. Reta de Nível (Horizontal) e Traço Frontal
  'reta-nivel': [
    {
      id: 'ptN1', type: 'point', label: 'N', x: 4, y: 3, z: 5,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'ptN2', type: 'point', label: 'M', x: -2, y: 7, z: 5,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'lnN', type: 'line', label: 'n', mode: '2points', p1Id: 'ptN1', p2Id: 'ptN2',
      inStatement: false, isGoal: true, showTraceF: true, askTraceF: true, showTraceH: false, askTraceH: false
    }
  ],

  // 3. Reta Frontal (de Frente) e Traço Horizontal
  'reta-frontal': [
    {
      id: 'ptF1', type: 'point', label: 'A', x: 5, y: 4, z: 2,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'ptF2', type: 'point', label: 'B', x: -3, y: 4, z: 7,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'lnF', type: 'line', label: 'f', mode: '2points', p1Id: 'ptF1', p2Id: 'ptF2',
      inStatement: false, isGoal: true, showTraceF: false, askTraceF: false, showTraceH: true, askTraceH: true
    }
  ],

  // 4. Reta de Topo
  'reta-topo': [
    {
      id: 'ptT1', type: 'point', label: 'T', x: 2, y: 2, z: 6,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'ptT2', type: 'point', label: 'S', x: 2, y: 8, z: 6,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'lnT', type: 'line', label: 't', mode: '2points', p1Id: 'ptT1', p2Id: 'ptT2',
      inStatement: false, isGoal: true, showTraceF: true, askTraceF: true, showTraceH: false, askTraceH: false
    }
  ],

  // 5. Reta Vertical
  'reta-vertical': [
    {
      id: 'ptV1', type: 'point', label: 'V', x: 3, y: 5, z: 1,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'ptV2', type: 'point', label: 'W', x: 3, y: 5, z: 7,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'lnV', type: 'line', label: 'v', mode: '2points', p1Id: 'ptV1', p2Id: 'ptV2',
      inStatement: false, isGoal: true, showTraceF: false, askTraceF: false, showTraceH: true, askTraceH: true
    }
  ],

  // 6. Retas Concorrentes r ∩ s
  'concorrentes': [
    {
      id: 'ptI', type: 'point', label: 'I', x: 2, y: 4, z: 4,
      inStatement: false, omitX: false, omitY: false, omitZ: false, isGoal: true
    },
    {
      id: 'ptA', type: 'point', label: 'A', x: 6, y: 2, z: 6,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'ptB', type: 'point', label: 'B', x: -2, y: 6, z: 2,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'ptC', type: 'point', label: 'C', x: 5, y: 7, z: 1,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'lnR', type: 'line', label: 'r', mode: '2points', p1Id: 'ptA', p2Id: 'ptB',
      inStatement: true, isGoal: false, showTraceF: true, askTraceF: false, showTraceH: true, askTraceH: false
    },
    {
      id: 'lnS', type: 'line', label: 's', mode: '2points', p1Id: 'ptC', p2Id: 'ptI',
      inStatement: true, isGoal: false, showTraceF: false, askTraceF: false, showTraceH: false, askTraceH: false
    },
    {
      id: 'intCC', type: 'intersection', label: 'I', mode: 'line-line', line1Id: 'lnR', line2Id: 'lnS',
      inStatement: false, isGoal: true
    }
  ],

  // 7. Interseção Reta r com Plano Oblíquo α
  'intersecao-plano': [
    {
      id: 'ptA', type: 'point', label: 'A', x: 5, y: 2, z: 6,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'ptB', type: 'point', label: 'B', x: -3, y: 7, z: 1,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'lnR', type: 'line', label: 'r', mode: '2points', p1Id: 'ptA', p2Id: 'ptB',
      inStatement: true, isGoal: false, showTraceF: false, askTraceF: false, showTraceH: false, askTraceH: false
    },
    {
      id: 'plAlpha', type: 'plane', label: 'α', mode: 'traces', x0: 7, angF: 40, angH: 45, dirF: 'left', dirH: 'left',
      inStatement: true, isGoal: false
    },
    {
      id: 'intI', type: 'intersection', label: 'I', mode: 'line-plane', lineId: 'lnR', planeId: 'plAlpha',
      inStatement: false, isGoal: true
    }
  ],

  // 8. Interseção de Dois Planos α ∩ β
  'intersecao-planos': [
    {
      id: 'plA', type: 'plane', label: 'α', mode: 'traces', x0: 6, angF: 45, angH: 50, dirF: 'left', dirH: 'left',
      inStatement: true, isGoal: false
    },
    {
      id: 'plB', type: 'plane', label: 'β', mode: 'traces', x0: -3, angF: 40, angH: 35, dirF: 'right', dirH: 'left',
      inStatement: true, isGoal: false
    },
    {
      id: 'intPlanes', type: 'intersection', label: 'i', mode: 'plane-plane', plane1Id: 'plA', plane2Id: 'plB',
      inStatement: false, isGoal: true
    }
  ],

  // 9. Plano Oblíquo por 3 Pontos
  'plano-3pontos': [
    {
      id: 'ptP1', type: 'point', label: 'A', x: 4, y: 2, z: 3,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'ptP2', type: 'point', label: 'B', x: 1, y: 5, z: 1,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'ptP3', type: 'point', label: 'C', x: -3, y: 1, z: 6,
      inStatement: true, omitX: false, omitY: false, omitZ: false, isGoal: false
    },
    {
      id: 'pl3P', type: 'plane', label: 'α', mode: '3points', p1Id: 'ptP1', p2Id: 'ptP2', p3Id: 'ptP3',
      inStatement: false, isGoal: true
    }
  ],

  // 10. Ponto pertencente ao Plano com Coordenada Omitida
  'ponto-omitido': [
    {
      id: 'plAlpha', type: 'plane', label: 'α', mode: 'traces', x0: 5, angF: 45, angH: 45, dirF: 'left', dirH: 'left',
      inStatement: true, isGoal: false
    },
    {
      id: 'ptP', type: 'point', label: 'P', x: 2, y: 3, z: 3,
      inStatement: true, omitX: false, omitY: true, omitZ: false, isGoal: false
    }
  ]
};

/**
 * Loads a preset by name
 */
function loadPreset(name) {
  state.selectedId = null;
  state.pendingPointStep1 = null;
  const list = presets[name] || presets['default'];
  // Deep clone entities to avoid mutating preset templates
  state.entities = JSON.parse(JSON.stringify(list));
  if (typeof renderAll === 'function') {
    renderAll();
  }
}
