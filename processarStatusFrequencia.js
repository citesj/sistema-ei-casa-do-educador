/**
 * Atualiza o valor de frequência correspondente ao alterar o valor de status na aba de dados.
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