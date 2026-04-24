/**
 * Inicia o processo de exportação da frequência, abrindo o diálogo modal configurado para PDF.
 * @returns {void}
 */
function iniciarDownloadFrequencia() {
  abrirDialogo('pdf', 'createAttendancePdf', 'Gerando PDF da Frequência...');
}

/**
 * Inicia o processo de exportação do relatório de faltas, abrindo o diálogo modal configurado para PDF.
 * @returns {void}
 */
function iniciarDownloadRelatorio() {
  abrirDialogo('pdf', 'createRelatorioFaltasPdf', 'Gerando PDF do Relatório...');
}

/**
 * Inicia o processo de geração de CSV referente à aba de certificado, abrindo o diálogo modal configurado para CSV.
 * @returns {void}
 */
function iniciarDownloadCertificados() {
  abrirDialogo('csv', 'generateCsv', 'Gerando CSV dos Certificados...');
}

/**
 * Renderiza e exibe um diálogo modal customizado para processamento de downloads.
 * O modal utiliza um template HTML que se comunica com o lado do servidor via google.script.run.
 * * @param {'pdf'|'csv'} tipoArquivo - A extensão ou tipo de arquivo que será gerado.
 * @param {string} acaoServidor - O nome da função no lado do servidor (.gs) que deve ser executada.
 * @param {string} tituloDialogo - O título que será exibido na barra superior do modal.
 * @returns {void}
 */
function abrirDialogo(tipoArquivo, acaoServidor, tituloDialogo) {
  const template = HtmlService.createTemplateFromFile('downloadHtmlDialog');
  template.tipoArquivo = tipoArquivo; 
  template.acaoServidor = acaoServidor;

  const htmlOutput = template.evaluate()
    .setWidth(350)
    .setHeight(150);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, tituloDialogo);
}