/* ==========================================================================
   GDA-10 DIHEDRAL STUDIO — PEDAGOGICAL STATEMENT GENERATOR & OMISSION ENGINE
   Generates formal Portuguese GDA 10th-grade exam statements & answer keys
   ========================================================================== */

/**
 * Formats a point's coordinates for student statement, masking omitted values with '?'
 */
function formatPointForStudent(pt) {
  const xStr = pt.omitX ? '?' : fmt(pt.x);
  const yStr = pt.omitY ? '?' : fmt(pt.y);
  const zStr = pt.omitZ ? '?' : fmt(pt.z);
  return `${pt.label}(${xStr}; ${yStr}; ${zStr})`;
}

/**
 * Formats a point's exact coordinates for teacher key
 */
function formatPointExact(pt) {
  return `${pt.label}(${fmt(pt.x)}; ${fmt(pt.y)}; ${fmt(pt.z)})`;
}

/**
 * Generates Portuguese formal examination statements
 */
function generatePortugueseStatement() {
  const statementBox = document.getElementById('statementOutput');
  const solutionBox = document.getElementById('teacherSolutionSummary');
  if (!statementBox) return;

  const sentences = [];
  const solutions = [];

  const points = state.entities.filter(e => e.type === 'point');
  const lines = state.entities.filter(e => e.type === 'line');
  const planes = state.entities.filter(e => e.type === 'plane');
  const intersections = state.entities.filter(e => e.type === 'intersection');

  const givenPoints = points.filter(p => p.inStatement && !p.isGoal);
  const goalPoints = points.filter(p => p.isGoal);

  // 1. LINES
  lines.forEach(ln => {
    const lg = computeLineGeometry(ln, getEntity);
    const pA = lg ? lg.pA : getEntity(ln.p1Id);
    const pB = lg ? lg.pB : getEntity(ln.p2Id);

    const goals = [];
    if (ln.isGoal) goals.push(`as projeções da reta ${ln.label}`);
    if (ln.askTraceF) goals.push(`o seu traço frontal F`);
    if (ln.askTraceH) goals.push(`o seu traço horizontal H`);

    if (goals.length > 0 && pA && pB) {
      sentences.push(
        `Determine ${goals.join(' e ')}, sabendo que a reta ${ln.label} é definida pelos pontos ${formatPointForStudent(pA)} e ${formatPointForStudent(pB)}.`
      );
    } else if (ln.inStatement && pA && pB) {
      sentences.push(
        `Considere a reta ${ln.label}, definida pelos pontos ${formatPointForStudent(pA)} e ${formatPointForStudent(pB)}.`
      );
    }

    if (lg && lg.traceF) solutions.push(`F_${ln.label}(${fmt(lg.traceF.x)}; 0; ${fmt(lg.traceF.z)})`);
    if (lg && lg.traceH) solutions.push(`H_${ln.label}(${fmt(lg.traceH.x)}; ${fmt(lg.traceH.y)}; 0)`);
  });

  // 2. PLANES
  planes.forEach(pl => {
    if (pl.inStatement && pl.mode === 'traces') {
      const dirTextF = pl.dirF === 'right' ? 'para a direita' : 'para a esquerda';
      const dirTextH = pl.dirH === 'right' ? 'para a direita' : 'para a esquerda';
      sentences.push(
        `O plano oblíquo ${pl.label} interseta o eixo x no ponto de abcissa ${fmt(pl.x0)} cm; os seus traços frontal (f${pl.label}) e horizontal (h${pl.label}) fazem, respetivamente, ângulos de ${fmt(pl.angF)}° (de abertura ${dirTextF}) e ${fmt(pl.angH)}° (de abertura ${dirTextH}) com o eixo x.`
      );
    } else if (pl.isGoal && pl.mode === '3points') {
      const p1 = getEntity(pl.p1Id);
      const p2 = getEntity(pl.p2Id);
      const p3 = getEntity(pl.p3Id);
      if (p1 && p2 && p3) {
        sentences.push(
          `Determine os traços frontal (f${pl.label}) e horizontal (h${pl.label}) do plano ${pl.label}, definido pelos pontos ${formatPointForStudent(p1)}, ${formatPointForStudent(p2)} e ${formatPointForStudent(p3)}.`
        );
      }
    }
  });

  // 3. INTERSECTIONS
  intersections.forEach(intEnt => {
    const ig = computeIntersectionGeometry(intEnt, getEntity);

    if (intEnt.mode === 'line-plane') {
      const ln = getEntity(intEnt.lineId);
      const pl = getEntity(intEnt.planeId);
      if (intEnt.isGoal && ln && pl) {
        sentences.push(
          `Determine as projeções do ponto ${intEnt.label} de interseção da reta ${ln.label} com o plano ${pl.label}.`
        );
      }
    } else if (intEnt.mode === 'line-line') {
      const l1 = getEntity(intEnt.line1Id);
      const l2 = getEntity(intEnt.line2Id);
      if (intEnt.isGoal && l1 && l2) {
        sentences.push(
          `Determine as projeções do ponto ${intEnt.label} de interseção das retas concorrentes ${l1.label} e ${l2.label}.`
        );
      }
    } else if (intEnt.mode === 'plane-plane') {
      const pl1 = getEntity(intEnt.plane1Id);
      const pl2 = getEntity(intEnt.plane2Id);
      if (intEnt.isGoal && pl1 && pl2) {
        sentences.push(
          `Determine as projeções da reta de interseção ${intEnt.label} entre os planos ${pl1.label} e ${pl2.label}.`
        );
      }
    }

    if (ig && ig.type === 'point' && ig.point) {
      solutions.push(`${intEnt.label}(${fmt(ig.point.x)}; ${fmt(ig.point.y)}; ${fmt(ig.point.z)})`);
    } else if (ig && ig.type === 'line' && ig.traceF && ig.traceH) {
      solutions.push(`Reta ${intEnt.label}: F(${fmt(ig.traceF.x)}; 0; ${fmt(ig.traceF.z)}) | H(${fmt(ig.traceH.x)}; ${fmt(ig.traceH.y)}; 0)`);
    }
  });

  // 4. STANDALONE POINTS
  if (sentences.length === 0 && givenPoints.length > 0) {
    sentences.push(
      `Represente pelas suas projeções diedricas os seguintes pontos: ${givenPoints.map(formatPointForStudent).join(', ')}.`
    );
  }

  // Fallback statement
  const fullStatement = sentences.length > 0
    ? sentences.join('\n\n')
    : 'Adicione elementos ao exercício para gerar o enunciado formal do exame.';

  statementBox.value = fullStatement;

  if (solutionBox) {
    solutionBox.textContent = solutions.length > 0
      ? `Chave Professor: ${solutions.join('  •  ')}`
      : 'Chave Professor: Coordenadas exatas calculadas prontas para verificação 1:1';
  }
}

/**
 * Copies statement to clipboard
 */
function copyStatement() {
  const box = document.getElementById('statementOutput');
  if (!box) return;
  box.select();
  navigator.clipboard.writeText(box.value).then(() => {
    showToast('Enunciado copiado para a área de transferência!');
  });
}

/**
 * Simple toast notification
 */
function showToast(msg) {
  const existing = document.querySelector('.toast-msg');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.innerHTML = `<span>✓</span> <span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2500);
}
