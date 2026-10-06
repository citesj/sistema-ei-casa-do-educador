/**
 * Configurações globais e constantes do sistema de filtros.
 */
const CONFIGURACAO_FILTROS = {
  ABA_ALVO: 'LISTA FREQUÊNCIA',
  COLUNAS_VALIDAS: [5, 6],
  LINHAS: {
    GRUPO: 1,
    UNIDADE: 2,
    FUNCAO: 3
  },
  INTERVALOS_DEPENDENTES: {
    GRUPO: 'E2:E3',
    UNIDADE: 'E3'
  },
  VALORES: {
    PADRAO: 'TODOS',
    SEPARADOR_ENTRADA: ',',
    SEPARADOR_SAIDA: ', '
  },
  MENSAGENS: {
    TITULO_TOAST: 'Aviso',
    AVISO_RESET: 'Os filtros dependentes foram redefinidos...'
  }
};

/**
 * Ponto de entrada (Handler) para a edição. Orquestra o fluxo.
 */
const processarListaFrequencia = (e) => {
  const eventoDeEdicaoEhInvalido = !eventoEdicaoEhValido(e);
  if (eventoDeEdicaoEhInvalido) return;

  const { range, value: valorNovoRaw, oldValue: valorAntigoRaw } = e;
  const aba = range.getSheet();
  const linhaEditada = range.getRow();

  const processador = new ProcessadorSelecao(CONFIGURACAO_FILTROS.VALORES.PADRAO);
  const valorFinal = processador.calcularSelecaoFinal(valorAntigoRaw, valorNovoRaw);

  const valorProcessadoDivergeDoValorInserido = valorFinal !== (valorNovoRaw || '');
  if (valorProcessadoDivergeDoValorInserido) {
    range.setValue(valorFinal);
  }

  const selecaoPermaneceInalterada = !processador.selecaoMudou(valorAntigoRaw, valorFinal);
  if (selecaoPermaneceInalterada) return;

  gerenciarFiltrosDependentes(aba, linhaEditada);
};

/**
 * Valida se a edição atual deve ser processada por este script.
 */
const eventoEdicaoEhValido = (e) => {
  const eventoNaoPossuiRange = !e || !e.range;
  if (eventoNaoPossuiRange) return false;
  
  const aba = e.range.getSheet();
  const edicaoOcorreuEmAbaDiferente = aba.getName() !== CONFIGURACAO_FILTROS.ABA_ALVO;
  if (edicaoOcorreuEmAbaDiferente) return false;

  const linha = e.range.getRow();
  const coluna = e.range.getColumn();
  
  const isColunaValida = CONFIGURACAO_FILTROS.COLUNAS_VALIDAS.includes(coluna);
  const isLinhaValida = linha >= CONFIGURACAO_FILTROS.LINHAS.GRUPO && 
                        linha <= CONFIGURACAO_FILTROS.LINHAS.FUNCAO;
  const edicaoOcorreuEmCelulaDeFiltroValida = isColunaValida && isLinhaValida;
  
  return edicaoOcorreuEmCelulaDeFiltroValida;
};

/**
 * Mapeia e aciona o reset das dependências com base na linha que foi editada.
 */
const gerenciarFiltrosDependentes = (aba, linhaEditada) => {
  const { LINHAS, INTERVALOS_DEPENDENTES } = CONFIGURACAO_FILTROS;
  let intervaloAlvo = null;
  const filtroDeGrupoFoiEditado = linhaEditada === LINHAS.GRUPO;
  const filtroDeUnidadeFoiEditado = linhaEditada === LINHAS.UNIDADE;

  if (filtroDeGrupoFoiEditado) {
    intervaloAlvo = INTERVALOS_DEPENDENTES.GRUPO;
  } else if (filtroDeUnidadeFoiEditado) {
    intervaloAlvo = INTERVALOS_DEPENDENTES.UNIDADE;
  }

  const intervaloPossuiDependentesQuePrecisamDeReset =
    intervaloAlvo && dependentesPrecisamDeReset(aba, intervaloAlvo);
  if (intervaloPossuiDependentesQuePrecisamDeReset) {
    executarResetCascata(aba, intervaloAlvo);
  }
};

/**
 * Checa se as células dependentes já estão resetadas. 
 * Otimiza performance evitando gravar "TODOS" onde já está "TODOS".
 */
const dependentesPrecisamDeReset = (aba, intervaloAlvo) => {
  const valoresAtuais = aba.getRange(intervaloAlvo).getValues();
  const valorPadrao = CONFIGURACAO_FILTROS.VALORES.PADRAO;
  
  return valoresAtuais.some(linha => 
    linha.some(celula => String(celula).trim() !== valorPadrao)
  );
};

/**
 * Aplica o valor padrão e exibe a notificação visual ao usuário.
 */
const executarResetCascata = (aba, intervaloAlvo) => {
  const planilha = aba.getParent();
  const { PADRAO } = CONFIGURACAO_FILTROS.VALORES;
  const { TITULO_TOAST, AVISO_RESET } = CONFIGURACAO_FILTROS.MENSAGENS;

  planilha.toast(AVISO_RESET, TITULO_TOAST);
  aba.getRange(intervaloAlvo).setValue(PADRAO);
};

/**
 * Classe utilitária focada estritamente nas regras de formatação e 
 * exclusão mútua dos chips de seleção. (Princípio de Responsabilidade Única)
 */
class ProcessadorSelecao {
  constructor(valorPadrao) {
    this.padrao = valorPadrao;
    this.separadorEntrada = CONFIGURACAO_FILTROS.VALORES.SEPARADOR_ENTRADA;
    this.separadorSaida = CONFIGURACAO_FILTROS.VALORES.SEPARADOR_SAIDA;
  }

  _transformarEmArray(textoRaw) {
    const textoEstaVazio = !textoRaw;
    if (textoEstaVazio) return [];
    return String(textoRaw)
      .split(this.separadorEntrada)
      .map(item => item.trim())
      .filter(Boolean);
  }

  calcularSelecaoFinal(valorAntigoRaw, valorNovoRaw) {
    const itensAntigos = this._transformarEmArray(valorAntigoRaw);
    const itensNovos = this._transformarEmArray(valorNovoRaw);

    const nenhumaOpcaoFoiSelecionada = itensNovos.length === 0;
    if (nenhumaOpcaoFoiSelecionada) {
      return this.padrao;
    }

    const tinhaPadraoAntes = itensAntigos.includes(this.padrao);
    const temPadraoAgora = itensNovos.includes(this.padrao);

    let resultadoTemporario = [];

    const padraoFoiSelecionadoAgora = !tinhaPadraoAntes && temPadraoAgora;
    if (padraoFoiSelecionadoAgora) {
      return this.padrao;
    }

    const opcaoEspecificaFoiSelecionadaComPadraoAtivo = tinhaPadraoAntes && itensNovos.length > 1;
    if (opcaoEspecificaFoiSelecionadaComPadraoAtivo) {
      resultadoTemporario = itensNovos.filter(item => item !== this.padrao);
    } else {
      const itensSemPadrao = itensNovos.filter(item => item !== this.padrao);
      const existeOpcaoEspecificaSelecionada = itensSemPadrao.length > 0;
      resultadoTemporario = existeOpcaoEspecificaSelecionada ? itensSemPadrao : [this.padrao];
    }

    const arraySemDuplicatas = Array.from(new Set(resultadoTemporario));
    return arraySemDuplicatas.join(this.separadorSaida);
  }

  selecaoMudou(valorAntigoRaw, valorFinalCalculado) {
    const listaAntiga = this._transformarEmArray(valorAntigoRaw).sort().join(this.separadorEntrada);
    const listaNova = this._transformarEmArray(valorFinalCalculado).sort().join(this.separadorEntrada);
    
    return listaAntiga !== listaNova;
  }
}