/**
 * Retorna a data e hora atuais formatadas de acordo com o fuso horário configurado no script.
 * * Esta função é específica para o ambiente do Google Apps Script, pois utiliza as 
 * classes nativas `Session` e `Utilities` para obter o fuso horário e formatar a data.
 *
 * @param {string} format - O padrão de formatação desejado para a data/hora. 
 * Exemplos: "dd/MM/yyyy", "yyyy-MM-dd HH:mm:ss", "MMMM dd, yyyy".
 * @returns {string} A string contendo a data e hora atuais no formato especificado.
 */
function getCurrentDate(format) {
  const now = new Date();
  const timeZone = Session.getScriptTimeZone();
  const timestamp = Utilities.formatDate(now, timeZone, format);

  return timestamp;
}

/**
 * Preenche um intervalo de forma intercalada entre dois valores alvo.
 * Colunas ímpares (dentro do intervalo) recebem o Valor A, 
 * colunas pares recebem o Valor B.
 */
const preencherIntercaladoLote = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  
  // --- CONFIGURAÇÕES ---
  const RANGE_ALVO = "F2:AS2929"; 
  const VALOR_A = "P";
  const VALOR_B = 3.50;
  // ---------------------

  const range = sheet.getRange(RANGE_ALVO);
  const matrizDados = range.getValues();

  const resultado = matrizDados.map((linha) => {
    return linha.map((_, colIdx) => {
      const isEvenColIdx = colIdx % 2 === 0
      return (isEvenColIdx) ? VALOR_A : VALOR_B;
    });
  });

  range.setValues(resultado);
  
  ss.toast("Preenchimento intercalado concluído!", "Status");
};

/**
 * Sincroniza dados entre dois arquivos diferentes.
 * Busca nomes com "E" no Arquivo de Origem e aplica o padrão E|0 no Arquivo de Destino.
 */
const sincronizarArquivosDistintos = () => {
  const ssDestino = SpreadsheetApp.getActiveSpreadsheet();
  const abaDestino = ssDestino.getActiveSheet();
  
  const ID_ARQUIVO_ORIGEM = "1o-z5d6eV_Er3TcfnO20bdHi_IUYnspD-iDGeGYrFLNw"; 
  const NOME_ABA_ORIGEM = "DADOS"; 
  
  const COLUNA_INICIO_DADOS = 6;
  const COLUNA_FIM_DADOS = 45;
  // ---------------------

  try {
    const ssOrigem = SpreadsheetApp.openById(ID_ARQUIVO_ORIGEM);
    const abaOrigem = ssOrigem.getSheetByName(NOME_ABA_ORIGEM);
    const dadosOrigem = abaOrigem.getRange("A2:AS2929").getValues();

    const nomesComE = new Set(
      dadosOrigem
        .filter(linha => {
          const intervaloDados = linha.slice(COLUNA_INICIO_DADOS - 1, COLUNA_FIM_DADOS);
          return intervaloDados.includes("E");
        })
        .map(linha => linha[0].toString().trim().toLowerCase())
    );

    if (nomesComE.size === 0) {
      ssDestino.toast("Nenhum 'E' encontrado no arquivo de origem.");
      return;
    }

    const rangeDestino = abaDestino.getRange(2, 1, abaDestino.getLastRow() - 1, COLUNA_FIM_DADOS);
    const matrizDestino = rangeDestino.getValues();

    const resultadoFinal = matrizDestino.map(linha => {
      const nomeAtual = linha[0].toString().trim().toLowerCase();
      
      if (nomesComE.has(nomeAtual)) {
        for (let j = COLUNA_INICIO_DADOS - 1; j < linha.length; j++) {
          const celula = linha[j];
          const estaVazia = celula === "";
          const ehNumero = typeof celula === 'number' && !isNaN(celula);

          if (!estaVazia && !ehNumero) {
            linha[j] = "E";
            if (j + 1 < linha.length) {
              linha[j + 1] = 0;
              j++;
            }
          }
        }
      }
      return linha;
    });

    rangeDestino.setValues(resultadoFinal);
    ssDestino.toast(`Sincronização concluída! ${nomesComE.size} nomes processados.`);

  } catch (e) {
    Browser.msgBox("Erro de Acesso", "Verifique se o ID do arquivo está correto e se você tem permissão de acesso.", Browser.Buttons.OK);
  }
};