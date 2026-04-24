/**
 * Adiciona menus personalizados na interface do Google Sheets quando a planilha é aberta.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🖨️ Relatórios')
    .addItem('📄 Gerar PDF - Lista de Frequência', 'iniciarDownloadFrequencia')
    .addItem('📄 Gerar PDF - Relatório de Faltas', 'iniciarDownloadRelatorio')
    .addSeparator()
    .addItem('📊 Gerar CSV - Certificados', 'iniciarDownloadCertificados')
    .addToUi();
  // ui.createMenu('Utils')  
  //   .addItem('Buscar e Processar Nome', 'sincronizarArquivosDistintos')
  //   .addItem('Preenchimento Intercalado (P | 4)', 'preencherIntercaladoLote')
  //   .addToUi();
}

function onEdit(e) {
  try {
    const nomeAba = e.range.getSheet().getName();

    if (!['DADOS'].includes(nomeAba)) {
      return;
    }

    processarStatusFrequencia(e);

  } catch (error) {
    console.error(`Erro no controlador onEdit: ${error.message}`);
  }
}