function popularCargaHoraria(e) {
  const NOME_ABA_PRINCIPAL = "CERTIFICADO";
  const CELULA_DE_CONTROLE = "B1";
  const CELULA_INICIAL_DADOS = "A6";
  const CELULA_INICIAL_SAIDA = "F6";
  const NOME_ABA_DADOS = "DADOS";

  const abaAtiva = e.range.getSheet();
  if (abaAtiva.getName() !== NOME_ABA_PRINCIPAL || e.range.getA1Notation() !== CELULA_DE_CONTROLE) return;

  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaPrincipal = planilha.getSheetByName(NOME_ABA_PRINCIPAL);
  const abaDados = planilha.getSheetByName(NOME_ABA_DADOS);
  if (!abaDados) return;

  SpreadsheetApp.getActiveSpreadsheet().toast('Processando...', 'Carga Horária', 2);

  const scriptProperties = PropertiesService.getScriptProperties();
  const {
    ULTIMA_QTD_LINHAS = "0", ULTIMA_QTD_COLUNAS = "0"
  } = scriptProperties.getProperties();
  const ultimaQtdLinhas = parseInt(ULTIMA_QTD_LINHAS);
  const ultimaQtdColunas = parseInt(ULTIMA_QTD_COLUNAS);

  if (ultimaQtdLinhas > 0 && ultimaQtdColunas > 0) {
    abaPrincipal.getRange(CELULA_INICIAL_SAIDA).offset(0, 0, ultimaQtdLinhas, ultimaQtdColunas).clearContent();
  }

  // MODIFICADO: Normaliza o grupo alvo
  const grupoDeFormacaoAlvo = normalizarTexto(abaPrincipal.getRange(CELULA_DE_CONTROLE).getValue());

  // MODIFICADO: Normaliza os nomes ao adicioná-los à lista
  const regiaoDados = abaPrincipal.getRange(CELULA_INICIAL_DADOS).getDataRegion(SpreadsheetApp.Dimension.ROWS).getValues();
  const nomesSet = new Set();
  for (let i = 0; i < regiaoDados.length; i++) {
    const nome = regiaoDados[i][0];
    if (nome) {
      nomesSet.add(normalizarTexto(nome));
    }
  }
  if (nomesSet.size === 0) return;

  const dados = abaDados.getDataRange().getValues();
  const lookup = criarLookupFrequencia();

  const dadosFiltrados = [];
  let maxColunas = 0;

  for (let i = 1; i < dados.length; i++) {
    // MODIFICADO: Normaliza os dados da aba "DADOS" antes de comparar
    const nomeNormalizado = normalizarTexto(dados[i][0]);
    const grupoNormalizado = normalizarTexto(dados[i][3]);
    const nivelEnsino = normalizarTexto(dados[i][4]); // Bônus: normaliza o nível também

    // MODIFICADO: Usa as variáveis normalizadas na comparação
    if (!nomeNormalizado || !nomesSet.has(nomeNormalizado) || grupoNormalizado !== grupoDeFormacaoAlvo) continue;

    const linha = [];
    const frequencias = dados[i].slice(5, 23);
    for (let j = 0; j < frequencias.length; j++) {
      const freq = dados[i].slice(5, 23)[j]; // Pega a frequência original da linha
      if (freq !== "" && freq != null) {
        linha.push(freq, lookup.calcularValor(freq, nivelEnsino));
      }
    }

    if (linha.length > 0) {
      if (linha.length > maxColunas) maxColunas = linha.length;
      dadosFiltrados.push(linha);
    }
  }

  if (dadosFiltrados.length === 0) {
    scriptProperties.setProperties({
      'ULTIMA_QTD_LINHAS': '0',
      'ULTIMA_QTD_COLUNAS': '0'
    });
    return;
  }

  // Normalização direta
  for (let i = 0; i < dadosFiltrados.length; i++) {
    while (dadosFiltrados[i].length < maxColunas) {
      dadosFiltrados[i].push("");
    }
  }

  abaPrincipal.getRange(CELULA_INICIAL_SAIDA).offset(0, 0, dadosFiltrados.length, maxColunas).setValues(dadosFiltrados);

  scriptProperties.setProperties({
    'ULTIMA_QTD_LINHAS': dadosFiltrados.length.toString(),
    'ULTIMA_QTD_COLUNAS': maxColunas.toString()
  });

  SpreadsheetApp.getActiveSpreadsheet().toast(`✅ Sucesso! Registros: ${dadosFiltrados.length}`, 'Carga Horária', 4);
}

function criarLookupFrequencia() {
  const valoresFundamental = new Map([
    ["P", 4], ["X", 0], ["F", 0], ["SA", ""], ["CT", ""]
  ]);
  
  const valoresOutros = new Map([
    ["P", 3.5], ["X", 0], ["F", 0], ["SA", ""], ["CT", ""]
  ]);
  
  return {
    calcularValor: function(frequencia, nivelEnsino) {
      // MODIFICADO: Normaliza a frequência e o nível de ensino antes de usar
      const freqNormalizada = normalizarTexto(frequencia);
      const nivelNormalizado = normalizarTexto(nivelEnsino);

      const lookup = nivelNormalizado === "FUNDAMENTAL" ? valoresFundamental : valoresOutros;
      return lookup.has(freqNormalizada) ? lookup.get(freqNormalizada) : "";
    }
  };
}

/**
 * Normaliza um texto para comparação segura.
 * 1. Converte para maiúsculas.
 * 2. Remove espaços no início e no fim.
 * 3. Substitui múltiplos espaços no meio por um único espaço.
 * @param {string} texto O texto a ser normalizado.
 * @returns {string} O texto normalizado.
 */
function normalizarTexto(texto) {
  if (typeof texto !== 'string' || !texto) {
    return ""; // Retorna vazio se não for um texto válido
  }
  return texto.trim().toUpperCase().replace(/\s+/g, ' ');
}