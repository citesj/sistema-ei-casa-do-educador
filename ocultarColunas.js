/**
 * Configurações globais para mapeamento da planilha.
 * @type {Object}
 * @property {string} NOME_ABA - Nome da aba alvo.
 * @property {string} CELULA_MES_INICIO - Referência A1 da data inicial.
 * @property {string} CELULA_MES_FIM - Referência A1 da data final.
 * @property {number} LINHA_CABECALHO - Linha onde residem as siglas dos meses.
 * @property {number} COLUNA_INTERVALO_INICIO - Primeira coluna do intervalo monitorado.
 * @property {number} COLUNA_INTERVALO_FIM - Última coluna do intervalo monitorado.
 */
const CONFIG = {
  NOME_ABA: "CERTIFICADO",
  CELULA_MES_INICIO: "B2",
  CELULA_MES_FIM: "B3",
  LINHA_CABECALHO: 5,
  COLUNA_INTERVALO_INICIO: 6,
  COLUNA_INTERVALO_FIM: 53
};

/**
 * Monitora edições na planilha e dispara a atualização de visibilidade se as células de data forem alteradas.
 * * @param {GoogleAppsScript.Events.SheetsOnEdit} e - Objeto de evento do gatilho onEdit.
 * @returns {void}
 */
function verificaEdicaoAbaCertificado(e) {
  const range = e.range;
  const sheet = range.getSheet();
  
  if (sheet.getName() !== CONFIG.NOME_ABA) return;
  
  const celulaEditada = range.getA1Notation();
  
  if (celulaEditada === CONFIG.CELULA_MES_INICIO || celulaEditada === CONFIG.CELULA_MES_FIM) {
    atualizarVisibilidadeColunas(sheet);
  }
}

/**
 * Orquestra a lógica de identificação do intervalo de meses e define quais colunas devem ser exibidas.
 * Captura os valores de início e fim, localiza-os no cabeçalho e calcula a expansão para colunas extras (FREQ/AC).
 * * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - A instância da aba ativa.
 * @returns {void}
 */
function atualizarVisibilidadeColunas(sheet) {
  const [valorInicio, valorFim] = sheet.getRange(`${CONFIG.CELULA_MES_INICIO}:${CONFIG.CELULA_MES_FIM}`).getValues().flat();

  if (!valorInicio || !valorFim) return;

  const DATA_INICIO_ABREVIADO = formatarSiglaMes(valorInicio);
  const DATA_FINAL_ABREVIADO = formatarSiglaMes(valorFim);

  const totalColunas = CONFIG.COLUNA_INTERVALO_FIM - CONFIG.COLUNA_INTERVALO_INICIO + 1;
  const valoresCabecalho = sheet.getRange(
    CONFIG.LINHA_CABECALHO, 
    CONFIG.COLUNA_INTERVALO_INICIO, 
    1, 
    totalColunas
  ).getValues()[0];

  const indexRelativoInicio = valoresCabecalho.indexOf(DATA_INICIO_ABREVIADO);
  const indexBaseFim = valoresCabecalho.lastIndexOf(DATA_FINAL_ABREVIADO);

  if (indexRelativoInicio === -1 || indexBaseFim === -1) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Mês não encontrado no cabeçalho.", "Erro");
    return;
  }

  const temAC = valoresCabecalho[indexBaseFim + 2] === "AC";
  const expansaoFinal = temAC ? 2 : 1;

  const colunaInicialAlvo = CONFIG.COLUNA_INTERVALO_INICIO + indexRelativoInicio;
  const colunaFinalAlvo = CONFIG.COLUNA_INTERVALO_INICIO + indexBaseFim + expansaoFinal;

  if (colunaFinalAlvo < colunaInicialAlvo) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Intervalo de datas inválido.", "Aviso");
    return;
  }

  gerenciarVisibilidadeColunas(sheet, colunaInicialAlvo, colunaFinalAlvo);
}

/**
 * Normaliza e formata um valor para uma sigla de mês com 3 caracteres.
 * Remove acentos e converte para caixa alta.
 * * @param {string|Date|number} valor - O dado bruto (data ou string) a ser convertido.
 * @returns {string} Sigla formatada (ex: "JAN", "ABR", "DEZ").
 */
const formatarSiglaMes = (valor) => {
  if (valor instanceof Date) {
    return valor.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().substring(0, 3);
  }

  return String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .substring(0, 3)
    .toUpperCase();
};

/**
 * Executa as chamadas de API para ocultar ou exibir colunas com base nos índices calculados.
 * Utiliza uma estratégia de "asas" para minimizar operações de escrita na planilha.
 * * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Aba onde a visibilidade será alterada.
 * @param {number} colInicioVisivel - Índice da coluna inicial que deve ficar visível.
 * @param {number} colFimVisivel - Índice da coluna final que deve ficar visível (incluindo expansões).
 * @returns {void}
 */
function gerenciarVisibilidadeColunas(sheet, colInicioVisivel, colFimVisivel) {
  const numColunasVisiveis = colFimVisivel - colInicioVisivel + 1;
  
  sheet.showColumns(colInicioVisivel, numColunasVisiveis);

  if (colInicioVisivel > CONFIG.COLUNA_INTERVALO_INICIO) {
    const numColunasOcultarEsq = colInicioVisivel - CONFIG.COLUNA_INTERVALO_INICIO;
    sheet.hideColumns(CONFIG.COLUNA_INTERVALO_INICIO, numColunasOcultarEsq);
  }

  if (colFimVisivel < CONFIG.COLUNA_INTERVALO_FIM) {
    const inicioOcultarDir = colFimVisivel + 1;
    const numColunasOcultarDir = CONFIG.COLUNA_INTERVALO_FIM - colFimVisivel;
    sheet.hideColumns(inicioOcultarDir, numColunasOcultarDir);
  }
}