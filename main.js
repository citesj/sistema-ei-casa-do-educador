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

const roteadorAbas = {
  'DADOS': (e) => {
    if (typeof processarStatusFrequencia === 'function') {
      processarStatusFrequencia(e);
    }
  },
  'LISTA FREQUÊNCIA': (e) => processarListaFrequencia(e)
};

function onEdit(e) {
  if (!e || !e.range) return;

  try {
    const nomeAba = e.range.getSheet().getName();
    const acao = roteadorAbas[nomeAba];

    if (acao) {
      acao(e);
    }
  } catch (error) {
    console.error(`Erro: ${error.message}`);
  }
}