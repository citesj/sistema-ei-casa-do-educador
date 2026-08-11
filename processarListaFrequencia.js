const CONFIG_FILTROS = {
  COLUNAS_VALIDAS: [5, 6],
  LINHA_GRUPO: 1,
  LINHA_UNIDADE: 2,
  LINHA_FUNCAO: 3,
  VALOR_PADRAO: 'TODOS',
  INTERVALO_DEPENDENTES: 'E2:E3'
};

const processarListaFrequencia = (e) => {
  const { range } = e;
  const linha = range.getRow();
  const coluna = range.getColumn();

  if (!isCelulaFiltroValida(linha, coluna)) return;

  if (linha === CONFIG_FILTROS.LINHA_GRUPO) {
    resetarFiltrosDependentes(e, range);
    return;
  }

  aplicarFiltroExclusivo(range);
};

const isCelulaFiltroValida = (linha, coluna) => {
  const isColunaValida = CONFIG_FILTROS.COLUNAS_VALIDAS.includes(coluna);
  const isLinhaValida = linha >= CONFIG_FILTROS.LINHA_GRUPO && linha <= CONFIG_FILTROS.LINHA_FUNCAO;
  
  return isColunaValida && isLinhaValida;
};

const resetarFiltrosDependentes = (e, range) => {
  if (e.value === e.oldValue) return;

  const aba = range.getSheet();
  const planilha = aba.getParent();
  
  planilha.toast('Os filtros estão sendo atualizados...', 'Aviso');
  aba.getRange(CONFIG_FILTROS.INTERVALO_DEPENDENTES).setValue(CONFIG_FILTROS.VALOR_PADRAO);
};

const aplicarFiltroExclusivo = (range) => {
  const valorDigitado = String(range.getValue());
  const padrao = CONFIG_FILTROS.VALOR_PADRAO;

  if (valorDigitado.includes(padrao) && valorDigitado !== padrao) {
    range.setValue(padrao);
  }
};