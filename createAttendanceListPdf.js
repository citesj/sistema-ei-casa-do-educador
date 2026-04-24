/**
 * CONFIGURAÇÕES GLOBAIS DE MAPEAMENTO
 * Centraliza as coordenadas para evitar Magic Numbers e facilitar manutenção.
 */
const CONFIG_LISTA = {
  // Coordenadas das células (Índices 1-based para Range)
  CELULAS: {
    GRUPO: "E1",
    UNIDADE: "E2"
  },
  // Estrutura da Tabela de Dados
  TABELA: {
    LINHA_INICIAL: 7,
    COLUNA_INICIAL: 1,
    NUM_COLUNAS: 7
  },
  // Índices das colunas no Array (0-based)
  COLUNAS: {
    NOME: 0,        // Col A
    LOCAL: 1,       // Col B
    CPF: 2,         // Col C
    FUNCAO: 3,      // Col D
    OBSERVACAO: 6   // Col G
  },
  STRINGS: {
    PLACEHOLDER_VAZIO: "Nenhum professor",
    PREFIXO_ARQUIVO: "lista-frequencia"
  }
};

/**
 * Função Principal: createAttendancePdf
 * Orquestra a geração do PDF para a Lista de Presença.
 * @returns {Object} Dados do arquivo para download (Base64).
 */
function createAttendancePdf() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('LISTA FREQUÊNCIA') || ss.getActiveSheet();

  try {
    // 1. Extração desacoplada
    const metadados = extrairMetadadosEssenciais(sheet);
    const registros = extrairDadosFrequencia(sheet);

    // 2. Renderização
    const htmlOutput = montarHtmlLista(metadados, registros);
    const pdfBlob = converterParaPdf(htmlOutput, metadados.unidade);

    return {
      fileData: Utilities.base64Encode(pdfBlob.getBytes()),
      fileName: pdfBlob.getName(),
      fileExt: 'pdf'
    };
  } catch (error) {
    console.error(`Erro crítico: ${error.message}`);
    throw new Error('Falha ao processar os dados da planilha.');
  }
}

/**
 * Captura apenas Grupo e Unidade (conforme solicitado).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @returns {Object} Objeto com nomes limpos.
 */
function extrairMetadadosEssenciais(sheet) {
  const rangeGrupo = sheet.getRange(CONFIG_LISTA.CELULAS.GRUPO).getDisplayValue();
  const rangeUnidade = sheet.getRange(CONFIG_LISTA.CELULAS.UNIDADE).getDisplayValue();

  const limpar = (txt) => txt.split(':').pop().trim();

  return {
    grupo: limpar(rangeGrupo),
    unidade: limpar(rangeUnidade)
  };
}

/**
 * Extrai os dados da tabela filtrando linhas inválidas.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @returns {Array<Object>} Lista de servidores formatada.
 */
function extrairDadosFrequencia(sheet) {
  const ultimaLinha = sheet.getLastRow();
  const { LINHA_INICIAL, COLUNA_INICIAL, NUM_COLUNAS } = CONFIG_LISTA.TABELA;

  if (ultimaLinha < LINHA_INICIAL) return [];

  const numLinhas = (ultimaLinha - LINHA_INICIAL) + 1;
  const rawData = sheet.getRange(LINHA_INICIAL, COLUNA_INICIAL, numLinhas, NUM_COLUNAS).getDisplayValues();

  return rawData
    .filter(linha => {
      const nome = linha[CONFIG_LISTA.COLUNAS.NOME].trim();
      return nome !== "" && !nome.includes(CONFIG_LISTA.STRINGS.PLACEHOLDER_VAZIO);
    })
    .map(linha => ({
      nome: linha[CONFIG_LISTA.COLUNAS.NOME],
      local: linha[CONFIG_LISTA.COLUNAS.LOCAL],
      cpf: linha[CONFIG_LISTA.COLUNAS.CPF],
      funcao: linha[CONFIG_LISTA.COLUNAS.FUNCAO],
      obs: linha[CONFIG_LISTA.COLUNAS.OBSERVACAO]
    }));
}

/**
 * Faz a ponte entre os dados e o Template HTML.
 */
function montarHtmlLista(metadados, registros) {
  const template = HtmlService.createTemplateFromFile('TemplateRelatorioListaFrequencia');
  template.m = metadados;
  template.dados = registros;
  template.theme = PDF_THEME;
  template.logo = LOGO_BRASAO;
  return template.evaluate().getContent();
}

/**
 * Converte string HTML em Blob PDF.
 */
function converterParaPdf(html, unidade) {
  const blob = Utilities.newBlob(html, MimeType.HTML).getAs(MimeType.PDF);
  const data = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MM-yyyy_HH-mm");
  return blob.setName(`${data}_${CONFIG_LISTA.STRINGS.PREFIXO_ARQUIVO}.pdf`);
}