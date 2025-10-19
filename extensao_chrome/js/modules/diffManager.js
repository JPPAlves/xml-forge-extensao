<<<<<<< HEAD
// Função auxiliar para atualizar as barras de status do modal
function updateModalStatusBar(text, statusBarElement) {
    const lineCount = text ? text.split('\n').length : 0;
    const sizeInKB = text ? (new Blob([text]).size / 1024).toFixed(2) : 0;
    const statusInfo = statusBarElement.querySelector('.status-info');
    if (statusInfo) {
        statusInfo.innerHTML = `<span>Linhas: ${lineCount}</span><span>Tamanho: ${sizeInKB} KB</span>`;
    }
}

// Função auxiliar para configurar a leitura de arquivos
function setupFileReader(openBtn, fileInput, textArea, statusBar) {
    openBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                textArea.value = content;
                updateModalStatusBar(content, statusBar);
            };
            reader.readAsText(file);
        }
    });
}


export function setupDiffModal(elements) {
    // Abrir/Fechar modal
    elements.diffXmlBtn.addEventListener('click', () => elements.diffModal.style.display = 'flex');
    const closeDiffModal = () => elements.diffModal.style.display = 'none';
    elements.closeDiffModalBtn.addEventListener('click', closeDiffModal);
    window.addEventListener('click', (event) => {
        if (event.target === elements.diffModal) closeDiffModal();
    });

    // Atualização em tempo real das barras de status
    elements.xmlSourceInput.addEventListener('input', () => updateModalStatusBar(elements.xmlSourceInput.value, elements.sourceStatusBar));
    elements.xmlChangedInput.addEventListener('input', () => updateModalStatusBar(elements.xmlChangedInput.value, elements.changedStatusBar));
    
    // Botões "Abrir Arquivo"
    setupFileReader(elements.openFileSourceBtn, elements.openFileSourceInput, elements.xmlSourceInput, elements.sourceStatusBar);
    setupFileReader(elements.openFileChangedBtn, elements.openFileChangedInput, elements.xmlChangedInput, elements.changedStatusBar);

    // Botão "Executar Comparação"
    elements.runDiffBtn.addEventListener('click', () => {
        // Ativa o estado de carregamento
        elements.runDiffBtn.disabled = true;
        elements.runDiffBtn.classList.add('btn-loading');
        elements.runDiffBtn.textContent = 'Comparando...';
        
        // Usamos setTimeout para garantir que o navegador renderize o estado de "loading"
        setTimeout(() => {
            const sourceXml = elements.xmlSourceInput.value;
            const changedXml = elements.xmlChangedInput.value;
            elements.diffOutput.innerHTML = '';
            
            if (typeof JsDiff === 'undefined') {
                elements.diffOutput.textContent = 'Erro: A biblioteca de comparação (diff.min.js) não foi carregada.';
            } else {
                const diff = JsDiff.diffLines(sourceXml, changedXml);
                const fragment = document.createDocumentFragment();
                diff.forEach((part) => {
                    const className = part.added ? 'diff-added' : (part.removed ? 'diff-removed' : 'diff-common');
                    const span = document.createElement('span');
                    span.className = className;
                    span.appendChild(document.createTextNode(part.value));
                    fragment.appendChild(span);
                });
                elements.diffOutput.appendChild(fragment);
            }
            
            // Restaura o botão ao estado normal
            elements.runDiffBtn.disabled = false;
            elements.runDiffBtn.classList.remove('btn-loading');
            elements.runDiffBtn.textContent = 'Executar Comparação';

        }, 50);
    });
}
=======
import { formatXml } from './formatter.js'; 

function htmlEscape(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Divide uma string XML (preferencialmente formatada) em um array de linhas.
 * @param {string} xml - A string XML.
 * @returns {string[]} - Um array onde cada item é uma linha do XML.
 */
function tokenizeXmlByLine(xml) {
  if (!xml) return [];
  return xml.split('\n');
}

// A função original tokenizeXml não é mais usada, mas pode ser mantida para referência se desejar.
// LCS DP matrizes e reconstrução de ops (NENHUMA ALTERAÇÃO AQUI)
function buildLCSMatrix(a, b) {
  const n = a.length, m = b.length;
  const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

function backtrackDiff(a, b, dp) {
  let i = a.length, j = b.length;
  const opsReversed = [];
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      opsReversed.push({ type: 'equal', token: a[i - 1] });
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      opsReversed.push({ type: 'delete', token: a[i - 1] });
      i--;
    } else {
      opsReversed.push({ type: 'insert', token: b[j - 1] });
      j--;
    }
  }
  while (i > 0) { opsReversed.push({ type: 'delete', token: a[i - 1] }); i--; }
  while (j > 0) { opsReversed.push({ type: 'insert', token: b[j - 1] }); j--; }
  return opsReversed.reverse();
}

// Agrupa operações e transforma em HTML, preservando as quebras de linha.
function opsToHtml(ops) {
  const out = [];
  let delBuf = [], insBuf = [];

  function flushBuffersAsHtml() {
    if (delBuf.length > 0) {
      // Junta as linhas removidas com \n para preservar a formatação
      const deletedText = delBuf.map(t => htmlEscape(t)).join('\n');
      out.push(`<span class="diff-delete">[${deletedText}]</span>`);
    }
    if (insBuf.length > 0) {
      // Junta as linhas adicionadas com \n
      const insertedText = insBuf.map(t => htmlEscape(t)).join('\n');
      out.push(`<span class="diff-insert">{${insertedText}}</span>`);
    }
    delBuf = []; 
    insBuf = [];
  }

  for (const op of ops) {
    if (op.type === 'equal') {
      flushBuffersAsHtml();
      out.push(`<span class="diff-equal">${htmlEscape(op.token)}</span>`);
    } else if (op.type === 'delete') {
      if (insBuf.length > 0) flushBuffersAsHtml();
      delBuf.push(op.token);
    } else if (op.type === 'insert') {
      if (delBuf.length > 0) flushBuffersAsHtml();
      insBuf.push(op.token);
    }
  }
  
  flushBuffersAsHtml();
  // Junta a saída final com \n para que cada linha (seja igual, add ou rem) fique separada
  return out.join('\n');
}

// Setup the modal listeners and diff run
export function setupDiffModal(config) {
  const {
    diffXmlBtn, diffModal, closeDiffModalBtn, runDiffBtn,
    xmlSourceInput, xmlChangedInput, diffOutput,
    sourceStatusBar, changedStatusBar,
    openFileSourceBtn, openFileSourceInput,
    openFileChangedBtn, openFileChangedInput
  } = config;

  function updateStatusBar(barEl, text) {
    if (!barEl) return;
    const statusInfo = barEl.querySelector('.status-info');
    if (!statusInfo) return;
    const lineCount = text ? text.split('\n').length : 0;
    const sizeKB = text ? (new Blob([text]).size / 1024).toFixed(2) : '0.00';
    statusInfo.innerHTML = `<span>Linhas: ${lineCount}</span><span>Tamanho: ${sizeKB} KB</span>`;
  }

  diffXmlBtn.addEventListener('click', () => {
    xmlSourceInput.value = '';
    xmlChangedInput.value = '';
    diffOutput.innerHTML = '';
    diffModal.style.display = 'flex';
    updateStatusBar(sourceStatusBar, '');
    updateStatusBar(changedStatusBar, '');
  });

  closeDiffModalBtn.addEventListener('click', () => diffModal.style.display = 'none');
  window.addEventListener('click', (ev) => {
    if (ev.target === diffModal) diffModal.style.display = 'none';
  });

  openFileSourceBtn.addEventListener('click', () => openFileSourceInput.click());
  openFileSourceInput.addEventListener('change', (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (e) => {
      xmlSourceInput.value = e.target.result;
      updateStatusBar(sourceStatusBar, xmlSourceInput.value);
    };
    r.readAsText(f);
  });

  openFileChangedBtn.addEventListener('click', () => openFileChangedInput.click());
  openFileChangedInput.addEventListener('change', (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (e) => {
      xmlChangedInput.value = e.target.result;
      updateStatusBar(changedStatusBar, xmlChangedInput.value);
    };
    r.readAsText(f);
  });

  xmlSourceInput.addEventListener('input', () => updateStatusBar(sourceStatusBar, xmlSourceInput.value));
  xmlChangedInput.addEventListener('input', () => updateStatusBar(changedStatusBar, xmlChangedInput.value));

  
  runDiffBtn.addEventListener('click', () => {
    const rawA = xmlSourceInput.value || '';
    const rawB = xmlChangedInput.value || '';

    if (!rawA.trim() && !rawB.trim()) {
      diffOutput.textContent = 'Insira ao menos um dos XMLs para comparar.';
      return;
    }

    // Formata ambos os XMLs primeiro. Usa o raw se a formatação falhar.
    const resultA = formatXml(rawA);
    const resultB = formatXml(rawB);
    const aPretty = resultA.error ? rawA : resultA.formattedXml;
    const bPretty = resultB.error ? rawB : resultB.formattedXml;

    // Tokeniza os XMLs formatados por linha
    const tokensA = tokenizeXmlByLine(aPretty);
    const tokensB = tokenizeXmlByLine(bPretty);

    // Build LCS e backtrack (nenhuma mudança aqui)
    const dp = buildLCSMatrix(tokensA, tokensB);
    const ops = backtrackDiff(tokensA, tokensB, dp);

    // Converte as operações em HTML formatado e exibe
    const html = opsToHtml(ops);
    diffOutput.innerHTML = html;
  });

} // end setupDiffModal
>>>>>>> 53eb5ee (feat: Implementação final das funcionalidades e melhorias de UI)
