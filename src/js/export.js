/* ==========================================================================
   GDA-10 DIHEDRAL STUDIO — 1:1 REAL-SCALE PRINT SVG EXPORTER
   Produces 300mm x 300mm (or A4) vector files for exact physical printing
   Generates Student Worksheet, Teacher Resolution Key, and Statement Pack
   ========================================================================== */

/**
 * Builds standalone printable SVG XML string
 */
function buildPrintableSvgString(isStudentMode, sheetFormat = '300x300') {
  let widthMm = '300mm';
  let heightMm = '300mm';
  let vb = '-150 -150 300 300';
  let rectW = 300;
  let rectH = 300;
  let rectX = -150;
  let rectY = -150;

  if (sheetFormat === 'a4-landscape') {
    widthMm = '297mm';
    heightMm = '210mm';
    vb = '-148.5 -105 297 210';
    rectW = 297;
    rectH = 210;
    rectX = -148.5;
    rectY = -105;
  } else if (sheetFormat === 'a4-portrait') {
    widthMm = '210mm';
    heightMm = '297mm';
    vb = '-105 -148.5 210 297';
    rectW = 210;
    rectH = 297;
    rectX = -105;
    rectY = -148.5;
  }

  // Create temporary SVG element to generate exact DOM layers
  const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  tempSvg.innerHTML = `
    <g id="svgGridLayer"></g>
    <g id="svgAxisLayer"></g>
    <g id="svgConstructionLayer"></g>
    <g id="svgProjectionsLayer"></g>
    <g id="svgSolutionLayer"></g>
    <g id="svgLabelsLayer"></g>
  `;

  // Render elements in print mode (true)
  render2DEpura(tempSvg, isStudentMode, true);

  const titleMode = isStudentMode ? 'Folha de Enunciado do Estudante' : 'Chave de Resolução do Professor';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${widthMm}"
     height="${heightMm}"
     viewBox="${vb}"
     style="background-color: #FFFFFF; font-family: 'Excon', -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
  <title>GDA 10.º Ano — ${titleMode} (Escala Real 1:1)</title>
  <desc>Geometria Descritiva A — Patrícia Rocha &amp; Pedro Amado (FBAUP)</desc>
  
  <!-- Outer Paper Border (0.25mm) -->
  <rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" fill="#FFFFFF" stroke="#000000" stroke-width="0.25" />

  <!-- Sheet Metadata Header -->
  <text x="${rectX + 8}" y="${rectY + 10}" font-size="3.2" font-weight="700" fill="#000000">GDA 10.º ANO — ${titleMode.toUpperCase()}</text>
  <text x="${rectX + 8}" y="${rectY + 14}" font-size="2.6" fill="#666666">Dupla Projeção Ortográfica • Escala Real 1:1 (10 mm = 1 cm) • Patrícia Rocha &amp; Pedro Amado</text>

  <!-- Geometric Content Layers -->
  ${tempSvg.innerHTML}
</svg>`;
}

/**
 * Utility to trigger browser file download
 */
function downloadFile(filename, content, mime = 'image/svg+xml;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports both Student and Teacher SVGs and Statement text
 */
function exportDualPack() {
  const statementBox = document.getElementById('statementOutput');
  const solutionBox = document.getElementById('teacherSolutionSummary');
  const statementText = statementBox ? statementBox.value : '';
  const solutionText = solutionBox ? solutionBox.textContent : '';

  const studentSvg = buildPrintableSvgString(true, state.sheetFormat);
  const teacherSvg = buildPrintableSvgString(false, state.sheetFormat);

  const packSummary =
`================================================================================
GDA 10.º ANO — ESTÚDIO DIÉDRICO & GERADOR DE ENUNCIADOS
Autores / Coordenação: Patrícia Rocha & Pedro Amado (FBAUP)
Geometria Descritiva A — Método Diédrico / Dupla Projeção Ortogonal
Data de Criação: ${new Date().toLocaleDateString('pt-PT')}
================================================================================

1. ENUNCIADO DO EXERCÍCIO (PARA O ESTUDANTE):
--------------------------------------------------------------------------------
${statementText}

2. CRITÉRIOS DE RESOLUÇÃO & CHAVE DE COORDENADAS (PROFESSOR):
--------------------------------------------------------------------------------
${solutionText}

3. INSTRUÇÕES DE IMPRESSÃO (ESCALA REAL 1:1):
--------------------------------------------------------------------------------
- Imprimir o ficheiro SVG em formato A3 ou A4 sem ajuste de escala ("Tamanho Real" / 100%).
- 10 mm no papel correspondem exatamente a 1 cm na régua do estudante.
- Convenção GDA: O sentido positivo do eixo x situa-se à ESQUERDA da Origem O.
`;

  // If JSZip is available, create a single bundled zip file
  if (typeof JSZip !== 'undefined') {
    const zip = new JSZip();
    zip.file('gda10_folha_estudante_1para1.svg', studentSvg);
    zip.file('gda10_resolucao_professor_1para1.svg', teacherSvg);
    zip.file('gda10_enunciado_e_criterios.txt', packSummary);

    zip.generateAsync({ type: 'blob' }).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gda10_pack_aluno_professor_1para1.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Pack ZIP descarregado com sucesso!');
    });
  } else {
    // Multi-file download fallback
    downloadFile('gda10_folha_estudante_1para1.svg', studentSvg);
    setTimeout(() => downloadFile('gda10_resolucao_professor_1para1.svg', teacherSvg), 250);
    setTimeout(() => downloadFile('gda10_enunciado.txt', packSummary, 'text/plain;charset=utf-8'), 500);
    showToast('Ficheiros SVG e Enunciado descarregados!');
  }
}

/**
 * Export only student sheet SVG
 */
function exportStudentSvgOnly() {
  const svg = buildPrintableSvgString(true, state.sheetFormat);
  downloadFile('gda10_folha_estudante_1para1.svg', svg);
  showToast('Folha do Estudante (SVG 1:1) descarregada!');
}

/**
 * Export only teacher resolution SVG
 */
function exportTeacherSvgOnly() {
  const svg = buildPrintableSvgString(false, state.sheetFormat);
  downloadFile('gda10_resolucao_professor_1para1.svg', svg);
  showToast('Resolução do Professor (SVG 1:1) descarregada!');
}
