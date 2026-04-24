/**
 * Funções de atalho para os menus.
 */
function iniciarDownloadPdf() {
  iniciarProcessoDeDownload('pdf');
}

function iniciarDownloadCsv() {
  iniciarProcessoDeDownload('csv');
}

/**
 * Abre um diálogo para iniciar o processo de download local, adaptável ao tipo de arquivo.
 * @param {string} tipoArquivo O tipo de arquivo a ser gerado ('pdf' ou 'csv').
 */
function iniciarProcessoDeDownload(tipoArquivo) {
  // Usa um template HTML para poder passar variáveis do servidor para o cliente.
  const template = HtmlService.createTemplateFromFile('downloadHtmlDialog');
  template.tipoArquivo = tipoArquivo; // Passa o tipo do arquivo para o HTML.

  // Avalia o template para gerar o HTML final com a variável injetada.
  const htmlOutput = template.evaluate()
    .setWidth(350)
    .setHeight(150);

  // Define o título do diálogo dinamicamente.
  const tituloDialogo = tipoArquivo.toUpperCase() === 'PDF' ? 'Gerando PDF...' : 'Gerando CSV...';
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, tituloDialogo);
}