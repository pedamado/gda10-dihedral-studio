# GDA-10 Dihedral Studio
**Estúdio Diédrico Interativo, Construtor de Exercícios e Gerador de Enunciados para Geometria Descritiva A (10.º Ano)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GDA: 10.º Ano](https://img.shields.io/badge/Disciplina-Geometria%20Descritiva%20A-00A3E0)](https://dge.mec.pt/)
[![FBAUP](https://img.shields.io/badge/Faculdade-FBAUP-E60000)](https://sigarra.up.pt/fbaup/)

---

## 👥 Coordenação & Autoria
- **Patrícia Rocha** (Conceção Pedagógica, Didática da Geometria Descritiva A)
- **Pedro Amado** (Design de Comunicação, Tipografia, Arquitetura de Software e Interação)
- **FBAUP** — Faculdade de Belas Artes da Universidade do Porto (2026–2027)

---

## 📐 Visão Geral do Projeto
O **GDA-10 Dihedral Studio** é uma aplicação web interativa concebida especificamente para o ensino e aprendizagem da **Geometria Descritiva A (10.º Ano do Ensino Secundário em Portugal)**.

A plataforma baseia-se exclusivamente no **Método Diédrico (Dupla Projeção Ortogonal de Monge / Épura)** sincronizado em tempo real com uma vista espacial tridimensional dos **Diedros ($\varphi_0$ e $\nu_0$)**, focando-se no programa do 10.º ano: **Pontos, Retas, Planos, Traços e Interseções**.

---

## ✨ Principais Funcionalidades

### 1. Sistema de Vistas Flexível & Alternância de Ecrã Inteiro
- **Vista Dividida (Split View):** Visualização simultânea da **Épura Diédrica 2D** e do **Espaço 3D (Diedros)**.
- **Modo Épura Ecrã Inteiro:** Maximização imediata da folha diédrica para desenho com o rato e precisão milimétrica.
- **Modo Espaço 3D Ecrã Inteiro:** Visualização imersiva dos semi-planos de projeção e rotação em órbita livre.
- **Painel Lateral Colapsável:** Permite libertar 100% da largura útil do ecrã para apresentação em sala de aula ou projetor interativo.

### 2. Rigor Matemático e Normas Portuguesas de GDA
- **Notação de Coordenadas:** Pontos definidos por $P(x; y; z)$ em centímetros com separador ponto e vírgula.
- **Sentido do Eixo $x$ (Linha de Terra):** Rigorosamente de acordo com a norma nacional portuguesa:
  - $+x$ (Abcissa positiva) desenvolve-se para a **ESQUERDA** da Origem $O(0; 0; 0)$.
  - $-x$ (Abcissa negativa) desenvolve-se para a **DIREITA** da Origem $O(0; 0; 0)$.
- **Afastamento ($y$):** Distância ao Plano Frontal ($\varphi_0$). No rebatimento da épura, $+y$ (anterior) rebate para **BAIXO**; $-y$ (posterior) rebate para **CIMA**.
- **Cota ($z$):** Distância ao Plano Horizontal ($\nu_0$). $+z$ (superior) situa-se **ACIMA** do eixo $x$; $-z$ (inferior) situa-se **ABAIXO** do eixo $x$.
- **Linha de Chamada:** Segmento perpendicular ao eixo $x$ conectando $P_1$ e $P_2$ ao longo da mesma abcissa $x$.

### 3. Modelo 3D Espacial com Slider Pedagógico de Rebatimento ($0^\circ \to 90^\circ$)
- Representação espacial do Plano Frontal ($\varphi_0$), Plano Horizontal ($\nu_0$), Eixo $x$ e Planos Bissetores ($\beta_{13}$ e $\beta_{24}$).
- **Slider Pedagógico:** Animação fluida da rotação do plano horizontal $\nu_0$ sobre $\varphi_0$, permitindo que os estudantes compreendam intuitivamente como as projeções espaciais $P_1$ e $r_1$ se transformam nas projeções 2D da Épura.

### 4. Construtor Estruturado por Blocos (Form Builder)
- Adição modular de entidades via menu pull-down:
  - **Ponto:** Definição por coordenadas decimais exatas $(x; y; z)$ com botões para omitir coordenadas.
  - **Reta:** Definição por 2 Pontos ou por 1 Ponto e Tipo de Reta (Oblíqua, Nível, Frontal, Topo, Vertical, Perfil, Fronto-Horizontal, Passante). Cálculo automático dos traços frontal ($F$) e horizontal ($H$), e pontos nos bissetores ($Q \in \beta_{13}$ e $I \in \beta_{24}$).
  - **Plano:** Definição por Traços diretos ($f_\alpha, h_\alpha$ e vértice $X_0$) ou por 3 Pontos não colineares.
  - **Interseção:** Cálculo e representação analítica de Reta $\cap$ Reta (concorrentes), Reta $\cap$ Plano e Plano $\cap$ Plano.

### 5. Gerador de Enunciados Formais de Exame Nacional
- Seleção de papéis por entidade e por coordenada:
  - `[x] Dado no Enunciado`: Fornecido nos dados iniciais.
  - `[x] Dar (x / y / z)`: Permite omitir uma coordenada específica, substituindo-a por `?` no enunciado (ex.: $A(3; ?; 4) \in \alpha$).
  - `[🎯] Objetivo a Determinar`: Oculta o elemento da folha do aluno e redige a questão no formato oficial do Exame Nacional de GDA (Código 708).
- Caixa de texto editável com botão de cópia com um clique para colar diretamente no Word, LaTeX ou Google Docs.
- **Chave de Resolução do Professor:** Síntese analítica das coordenadas exatas de todos os traços e pontos de interseção.

### 6. Exportador Vetorial 1:1 em Escala Real (Aluno + Professor)
- Exporta em tamanho físico real milimétrico (`width="300mm" height="300mm"` ou formato A4 cropped).
- Quando impresso a 100% de escala (sem redimensionar), **10 mm no papel correspondem rigorosamente a 1 cm na régua do estudante**.
- Hierarquia estrita de traços contínuos e interrompidos (linhas de chamada finas de $0.15\text{ mm}$, eixos de $0.35\text{ mm}$, soluções a $0.60\text{ mm}$).
- **Descarregamento Simultâneo em ZIP (`Exportar Pack 1:1`):**
  1. `gda10_folha_estudante_1para1.svg` (folha de trabalho do aluno com eixos e dados iniciais).
  2. `gda10_resolucao_professor_1para1.svg` (resolução completa com projeções, traços e nomenclatura).
  3. `gda10_enunciado_e_criterios.txt` (enunciado do problema e chave de coordenadas).

---

## 🎨 Sistema de Design e Identidade Visual
A interface foi desenhada seguindo princípios de **Flat Design rigoroso**, sem relevos, sombras projetadas (`drop-shadow: none`) ou contornos desnecessários:
- **Branco Puro:** `#FFFFFF` (Folha de trabalho da épura e cartões)
- **Off-White:** `#F8F9FA` (Fundo da aplicação e separadores)
- **Cinza Claro / Médio:** `#E9ECEF` / `#6C757D` (Grelhas de apoio e metadados)
- **Azul Ciano:** `#00A3E0` (Destaques visuais e projeções horizontais no espaço)
- **Azul Escuro:** `#00729C` (Ciano com 30% preto — botões de ação e cabeçalhos de destaque)
- **Vermelho Destaque:** `#E60000` (Ponto no espaço, objetivos a determinar e seleções ativas)
- **Tipografia:**
  - **Excon** (Fontshare) para identidade de marca, títulos e controlos de interface.
  - **Martian Mono** (Google Fonts) para dados técnicos, coordenadas, tabelas e notação matemática.

---

## 📁 Estrutura do Repositório

```text
GDA-10 Dihedral Studio/
├── index.html                   # Aplicação web autónoma completa (Zero-Build)
├── LICENSE                      # Licença MIT (Patrícia Rocha & Pedro Amado)
├── package.json                 # Metadados e scripts de build/packaging
├── README.md                    # Documentação e especificações
├── dist/                        # Versão de distribuição pronta para GitHub Pages
│   ├── index.html
│   ├── LICENSE
│   ├── README.md
│   └── src/
│       ├── css/style.css
│       └── js/
├── releases/                    # Ficheiros ZIP versionados de cada distro
│   └── gda10-dihedral-studio-v1.0.0.zip
├── scripts/
│   ├── build-dist.js            # Script de compilação da pasta dist/
│   └── package-release.js       # Script de empacotamento em ficheiro ZIP
└── src/
    ├── css/
    │   └── style.css            # Estilos flat e variáveis CSS do design system
    └── js/
        ├── geometry.js          # Motor matemático diédrico (GDA 10.º ano)
        ├── state.js             # Gestão de estado e biblioteca de exercícios modelo
        ├── epura.js             # Renderizador SVG 2D da Épura e manipulação de pontos
        ├── diedros3d.js         # Vista espacial 3D e slider de rebatimento
        ├── formBuilder.js       # Construtor de blocos do professor (Form Builder)
        ├── inspector.js         # Inspetor e análise geométrica detalhada
        ├── statement.js         # Gerador de enunciados formais em português
        └── export.js            # Exportador vetorial SVG 1:1 e gerador de pack ZIP
```

---

## 🚀 Como Executar Localmente
Não é necessária qualquer instalação complexa ou base de dados. Basta abrir o ficheiro `index.html` diretamente no browser (Chrome, Safari, Firefox, Edge).

Para correr com um servidor web local:
```bash
# Com Node.js:
npm start

# Ou com Python 3:
python3 -m http.server 3000
```
Abrir `http://localhost:3000` no navegador.

---

## 📦 Como Gerar Novas Versões / Pacotes ZIP
Para atualizar a pasta `dist/` e criar um novo ficheiro `.zip` de arquivo de versão:
```bash
# Atualizar a distribuição:
npm run build

# Criar o pacote ZIP da versão atual (guardado na pasta releases/):
npm run pack
```

---

## 🌐 Publicação no GitHub Pages
1. Crie o repositório no seu GitHub (ex.: `https://github.com/pedamado/gda10-dihedral-studio`).
2. Associe o repositório local e envie o código:
   ```bash
   git remote add origin https://github.com/pedamado/gda10-dihedral-studio.git
   git push -u origin main
   ```
3. No GitHub:
   - Aceda a **Settings** $\to$ **Pages**.
   - Em **Build and deployment / Source**, selecione **Deploy from a branch**.
   - Em **Branch**, selecione `main` e a pasta `/ (root)` ou `/dist` e clique em **Save**.
   - A aplicação ficará imediatamente online com HTTPS gratuito no URL `https://pedamado.github.io/gda10-dihedral-studio/`.

---

## 📄 Licença
Distribuído sob a licença **MIT**. Consulte o ficheiro [LICENSE](LICENSE) para mais informações.  
© 2026 Patrícia Rocha & Pedro Amado.
