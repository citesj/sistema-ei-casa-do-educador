/**
 * Configurações e constantes para a geração do relatório de faltas.
 */
const CONFIG_RELATORIO = {
  SHEET_NAME: 'RELATORIO',
  RANGE_PERIODO: 'B2',
  RANGE_UNIDADE: 'B3',
  RANGE_DATA_ENVIO: 'B4',
  START_ROW: 7,
  START_COL: 1,
  NUM_COLS: 12,
  INDEX_OBSERVACAO: 11,
  INDEX_NOME: 0,
  MAX_OBS_LENGTH: 45,
  TRUNCATE_LENGTH: 40,
  HTML_TEMPLATE: 'TemplateRelatorioFaltas'
};

/**
 * Gera o PDF do Relatório de Faltas com criação automática de anexos para observações extensas.
 * * O processo consiste em:
 * 1. Extrair metadados e dados da planilha 'RELATORIO'.
 * 2. Higienizar strings para evitar quebra de HTML.
 * 3. Identificar observações longas e movê-las para uma lista de notas (anexo).
 * 4. Renderizar o template HTML com os dados processados e converter para PDF.
 * * @returns {Object} Objeto contendo o arquivo em base64, nome do arquivo e extensão.
 * @property {string} fileData - O conteúdo do PDF codificado em Base64.
 * @property {string} fileName - O nome do arquivo gerado (Data_Unidade_Relatorio).
 * @property {string} fileExtension - Sempre 'pdf'.
 */
function createRelatorioFaltasPdf() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG_RELATORIO.SHEET_NAME);

  if (!sheet) {
    throw new Error(`A aba "${CONFIG_RELATORIO.SHEET_NAME}" não foi encontrada.`);
  }

  const metadados = {
    periodo: sheet.getRange(CONFIG_RELATORIO.RANGE_PERIODO).getDisplayValue(),
    unidade: sheet.getRange(CONFIG_RELATORIO.RANGE_UNIDADE).getDisplayValue(),
    dataEnvio: sheet.getRange(CONFIG_RELATORIO.RANGE_DATA_ENVIO).getDisplayValue()
  };

  const lastRow = sheet.getLastRow();
  let dadosLimpos = [];
  let notasAnexo = [];
  let contadorNotas = 1;

  /**
   * Escapa caracteres especiais de HTML para segurança e integridade do layout.
   */
  const limparTexto = (str) => {
    if (!str) return "";
    return str.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };

  // Verifica se há dados além do cabeçalho
  if (lastRow >= CONFIG_RELATORIO.START_ROW) {
    const numRows = lastRow - (CONFIG_RELATORIO.START_ROW - 1);
    const dadosBrutos = sheet.getRange(
      CONFIG_RELATORIO.START_ROW, 
      CONFIG_RELATORIO.START_COL, 
      numRows, 
      CONFIG_RELATORIO.NUM_COLS
    ).getDisplayValues();

    dadosBrutos.forEach(row => {
      // Pula linhas vazias
      if (row.join("").trim() === "") return;

      let linhaHigienizada = row.map(celula => limparTexto(celula));
      let observacao = linhaHigienizada[CONFIG_RELATORIO.INDEX_OBSERVACAO];

      // Lógica de truncamento e criação de anexo
      if (observacao.length > CONFIG_RELATORIO.MAX_OBS_LENGTH) {
        notasAnexo.push({
          numero: contadorNotas,
          nome: linhaHigienizada[CONFIG_RELATORIO.INDEX_NOME],
          texto: observacao
        });

        linhaHigienizada[CONFIG_RELATORIO.INDEX_OBSERVACAO] = 
          `${observacao.substring(0, CONFIG_RELATORIO.TRUNCATE_LENGTH)}... (Ver Nota ${contadorNotas})`;
        
        contadorNotas++;
      }

      dadosLimpos.push(linhaHigienizada);
    });
  }

  // Preparação do Template HTML
  const template = HtmlService.createTemplateFromFile(CONFIG_RELATORIO.HTML_TEMPLATE);
  template.m = metadados;
  template.dados = dadosLimpos;
  template.notas = notasAnexo;
  
  // Constantes globais (assumindo que existam no escopo do projeto)
  template.theme = PDF_THEME;
  template.logo = LOGO_BRASAO;
  template.assinaturaCasaEducador = ASSINATURA_CASA_EDUCADOR;

  const htmlContent = template.evaluate().getContent();
  const blob = Utilities.newBlob(htmlContent, MimeType.HTML).getAs(MimeType.PDF);

  // Nomeação do arquivo
  const dataFormatada = getCurrentDate("dd-MM-yyyy_HH-mm");
  const unidadeDeEnsinoFormatada = metadados.unidade.toLowerCase().replace(/\s+/g, "-");
  const fileName = `${dataFormatada}_${unidadeDeEnsinoFormatada}_relatorio_faltas.pdf`;

  blob.setName(fileName);

  return {
    fileData: Utilities.base64Encode(blob.getBytes()),
    fileName: fileName,
    fileExtension: 'pdf'
  };
}