/**
 * Adiciona menus personalizados na interface do Google Sheets quando a planilha é aberta.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Relatórios')
    .addItem('Exportar aba atual como PDF', 'iniciarDownloadPdf')
    .addItem('Exportar aba atual como CSV', 'iniciarDownloadCsv')
    .addToUi();
  // ui.createMenu('Utils')  
  //   .addItem('Buscar e Processar Nome', 'sincronizarArquivosDistintos')
  //   .addItem('Preenchimento Intercalado (P | 3,50)', 'preencherIntercaladoLote')
  //   .addToUi();
}

/**
 * Main.gs - Controlador Principal de Edições
 * @OnlyCurrentDoc
 * 
 * Função centralizada que filtra eventos e delega para processadores específicos
 */

// Cache das configurações para evitar recriação constante
const CONFIG_CACHE = {
  DADOS: {
    COLUNAS_STATUS: new Set([6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49]),
    PRIMEIRA_LINHA_DADOS: 2,
    STATUS_MAP: new Map([
      ['P', 3.5],
      ['X', 0],
      ['F', 0],    
      ['E', 0]
    ]),
    MANUAL_STATUSES: new Set(['SA', 'CT']),
    CLEAR_VALUES: new Set([3.5, 0, ''])
  }
};

function onEdit(e) {
  try {
    const nomeAba = e.range.getSheet().getName();

    if (!['DADOS','LISTA FREQUÊNCIA', 'CERTIFICADO'].includes(nomeAba)) {
      return;
    }

    /* 
    if (nomeAba === 'CERTIFICADO') {
      popularCargaHoraria(e);
      atualizarFrequenciaNaAbaDados(e);
    } 
    */

    if (nomeAba === 'DADOS') {
      processarStatusFrequencia(e);
    // } else if (nomeAba === 'LISTA FREQUÊNCIA') {
    //   gerenciarVisibilidadeEAltura(e);
    } else (verificaEdicaoAbaCertificado(e))

  } catch (error) {
    console.error(`Erro no controlador onEdit: ${error.message}`);
  }
}