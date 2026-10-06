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
const QUANTIDADE_COLUNAS_STATUS = 44;
const PRIMEIRA_COLUNA_STATUS = 6;
const INTERVALO_COLUNAS_STATUS = 2;
const COLUNAS_COM_AJUSTE_STATUS = new Set([46]);
const PRIMEIRA_LINHA_DADOS = 2;
const COLUNA_FREQUENCIA_RELATIVA = 1;
const FREQUENCIA_PRESENCA = 3.5;
const FREQUENCIA_ZERO = 0;

const gerarColunasStatus = () => {
  const colunas = [];
  let coluna = PRIMEIRA_COLUNA_STATUS;

  while (colunas.length < QUANTIDADE_COLUNAS_STATUS) {
    if (COLUNAS_COM_AJUSTE_STATUS.has(coluna)) {
      coluna += 1;
      continue;
    }

    colunas.push(coluna);
    coluna += INTERVALO_COLUNAS_STATUS;
  }

  return colunas;
};

const CONFIG_CACHE = {
  DADOS: {
    COLUNAS_STATUS: new Set(gerarColunasStatus()),
    PRIMEIRA_LINHA_DADOS,
    STATUS_MAP: new Map([
      ['P', FREQUENCIA_PRESENCA],
      ['X', FREQUENCIA_ZERO],
      ['F', FREQUENCIA_ZERO],
      ['E', FREQUENCIA_ZERO]
    ]),
    MANUAL_STATUSES: new Set(['SA', 'CT']),
    CLEAR_VALUES: new Set([FREQUENCIA_PRESENCA, FREQUENCIA_ZERO, ''])
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
  const targetCell = e.source.getActiveSheet().getRange(row, col + COLUNA_FREQUENCIA_RELATIVA);

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