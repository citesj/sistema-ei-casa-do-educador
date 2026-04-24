/**
 * CONFIGURAÇÕES GERAIS
 * Ajuste estas variáveis de acordo com a sua planilha.
 */
const CONFIG = {
  NOME_ABA: "CERTIFICADO",               // Nome da aba onde o script vai rodar
  CELULA_MES_INICIO: "B2",          // Célula do menu suspenso (Mês Inicial)
  CELULA_MES_FIM: "B3",             // Célula do menu suspenso (Mês Final)
  LINHA_CABECALHO: 5,               // Linha onde estão os nomes dos meses (JAN, FEV...)
  COLUNA_INTERVALO_INICIO: 6,       // Número da coluna onde começa o calendário (Ex: D = 4)
  COLUNA_INTERVALO_FIM: 51          // Número da coluna onde termina o calendário (Ex: 12 meses * 4 colunas = 48 + offset)
};

/**
 * Função gatilho que roda automaticamente ao editar a planilha.
 */
function verificaEdicaoAbaCertificado(e) {
  const range = e.range;
  const sheet = range.getSheet();
  
  // Verificações de segurança para garantir performance (fail-fast)
  if (sheet.getName() !== CONFIG.NOME_ABA) return;
  
  const celulaEditada = range.getA1Notation();
  
  // Só roda se a edição for em um dos campos de data
  if (celulaEditada === CONFIG.CELULA_MES_INICIO || celulaEditada === CONFIG.CELULA_MES_FIM) {
    atualizarVisibilidadeColunas(sheet);
  }
}

/**
 * Função principal que orquestra a lógica.
 */
function atualizarVisibilidadeColunas(sheet) {
  // 1. Desestruturação e leitura inicial
  const [valorInicio, valorFim] = sheet.getRange(`${CONFIG.CELULA_MES_INICIO}:${CONFIG.CELULA_MES_FIM}`).getValues().flat();

  // Fail-fast com validação moderna
  if (!valorInicio || !valorFim) return;

  const DATA_INICIO_ABREVIADO = formatarMes(valorInicio);
  const DATA_FINAL_ABREVIADO = formatarMes(valorFim);

  // 2. Obtenção do cabeçalho
  const totalColunas = CONFIG.COLUNA_INTERVALO_FIM - CONFIG.COLUNA_INTERVALO_INICIO + 1;
  const valoresCabecalho = sheet.getRange(
    CONFIG.LINHA_CABECALHO, 
    CONFIG.COLUNA_INTERVALO_INICIO, 
    1, 
    totalColunas
  ).getValues()[0];

  // 3. Identificação de índices (Imutabilidade com const)
  const indexRelativoInicio = valoresCabecalho.indexOf(DATA_INICIO_ABREVIADO);
  const indexBaseFim = valoresCabecalho.lastIndexOf(DATA_FINAL_ABREVIADO);

  if (indexRelativoInicio === -1 || indexBaseFim === -1) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Mês não encontrado.", "Erro");
    return;
  }

  // 4. Lógica de Expansão
  // Calculamos se deve haver expansão para incluir FREQ (+1) e possivelmente AC (+2)
  const temAC = valoresCabecalho[indexBaseFim + 2] === "AC";
  const expansaoFinal = temAC ? 2 : 1;

  const colunaInicialAlvo = CONFIG.COLUNA_INTERVALO_INICIO + indexRelativoInicio;
  const colunaFinalAlvo = CONFIG.COLUNA_INTERVALO_INICIO + indexBaseFim + expansaoFinal;

  // 5. Validação e Execução
  if (colunaFinalAlvo < colunaInicialAlvo) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Intervalo inválido.", "Aviso");
    return;
  }

  aplicarOcultamentoInteligente(sheet, colunaInicialAlvo, colunaFinalAlvo);
}

/**
 * Função utilitária para formatar a string do mês.
 */
const formatarMes = (valor) => 
  String(valor ?? "").trim().substring(0, 3).toUpperCase();

/**
 * Lógica para ocultar/mostrar colunas.
 * Estratégia: Resetar (mostrar tudo) é lento se feito coluna por coluna.
 * Melhor estratégia: Mostrar o intervalo desejado e ocultar as "asas" (esquerda e direita).
 */
function aplicarOcultamentoInteligente(sheet, colInicioVisivel, colFimVisivel) {
  // Primeiro, garante que o intervalo desejado está visível
  const numColunasVisiveis = colFimVisivel - colInicioVisivel + 1;
  sheet.showColumns(colInicioVisivel, numColunasVisiveis);

  // Lógica da Esquerda: Ocultar do início do calendário até antes do início visível
  if (colInicioVisivel > CONFIG.COLUNA_INTERVALO_INICIO) {
    const numColunasOcultarEsq = colInicioVisivel - CONFIG.COLUNA_INTERVALO_INICIO;
    sheet.hideColumns(CONFIG.COLUNA_INTERVALO_INICIO, numColunasOcultarEsq);
  }

  // Lógica da Direita: Ocultar de depois do fim visível até o final do calendário
  if (colFimVisivel < CONFIG.COLUNA_INTERVALO_FIM) {
    const inicioOcultarDir = colFimVisivel + 1;
    const numColunasOcultarDir = CONFIG.COLUNA_INTERVALO_FIM - colFimVisivel;
    sheet.hideColumns(inicioOcultarDir, numColunasOcultarDir);
  }
}