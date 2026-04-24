/**
 * Objeto de configuração global contendo as regras, mapeamentos e constantes 
 * utilizadas no processamento de dados da planilha.
 * * @constant {Object}
 * @property {Object} DADOS - Configurações específicas para a validação e preenchimento de status/frequência.
 * @property {Set<number>} DADOS.COLUNAS_STATUS - Conjunto de índices das colunas que recebem o status (ex: 6, 8, 10...).
 * @property {number} DADOS.PRIMEIRA_LINHA_DADOS - Índice da primeira linha que contém dados válidos (ignorando o cabeçalho).
 * @property {Map<string, number>} DADOS.STATUS_MAP - Dicionário que mapeia a sigla do status ('P', 'X', 'F', 'E') para o seu valor numérico de frequência.
 * @property {Set<string>} DADOS.MANUAL_STATUSES - Conjunto de status ('SA', 'CT') que exigem digitação manual da frequência.
 * @property {Set<number|string>} DADOS.CLEAR_VALUES - Valores que devem ser limpos da célula de frequência caso um status manual seja selecionado.
 */
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

/**
 * Processa a alteração de uma célula de status e atualiza automaticamente 
 * a célula imediatamente à direita (frequência) com base nas regras de configuração.
 * Deve ser acionada por um gatilho de edição (ex: onEdit).
 *
 * @param {Object} e - O objeto de evento de edição nativo do Google Apps Script.
 * @param {GoogleAppsScript.Spreadsheet.Range} e.range - O intervalo (célula) que foi modificado pelo usuário.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} e.source - A planilha onde a edição ocorreu.
 * @returns {void} Esta função não possui retorno.
 */
function processarStatusFrequencia(e) {
  const { range } = e;
  const col = range.getColumn();
  const row = range.getRow();
  const config = CONFIG_CACHE.DADOS;

  if (row < config.PRIMEIRA_LINHA_DADOS || !config.COLUNAS_STATUS.has(col)) {
    return;
  }

  const statusValue = range.getValue();
  const targetCell = e.source.getActiveSheet().getRange(row, col + 1);

  if (config.STATUS_MAP.has(statusValue)) {
    targetCell.setValue(config.STATUS_MAP.get(statusValue));
  } else if (config.MANUAL_STATUSES.has(statusValue)) {
    const currentValue = targetCell.getValue();
    if (config.CLEAR_VALUES.has(currentValue)) {
      targetCell.setValue('');
    }
  } else if (statusValue !== '') {
    targetCell.setValue('');
  }
}