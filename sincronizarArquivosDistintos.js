/**
 * Sincroniza dados entre dois arquivos diferentes.
 * Busca nomes com "E" no Arquivo de Origem e aplica o padrão E|0 no Arquivo de Destino.
 */
const sincronizarArquivosDistintos = () => {
  const ssDestino = SpreadsheetApp.getActiveSpreadsheet();
  const abaDestino = ssDestino.getActiveSheet();
  
  // --- CONFIGURAÇÕES ---
  // Substitua pelo ID do arquivo onde você busca os nomes (está na URL do navegador)
  const ID_ARQUIVO_ORIGEM = "1o-z5d6eV_Er3TcfnO20bdHi_IUYnspD-iDGeGYrFLNw"; 
  const NOME_ABA_ORIGEM = "DADOS"; 
  
  const COLUNA_INICIO_DADOS = 6; // Coluna F
  const COLUNA_FIM_DADOS = 45;   // Coluna AS
  // ---------------------

  try {
    // 1. Acessa o arquivo externo e extrai os dados
    const ssOrigem = SpreadsheetApp.openById(ID_ARQUIVO_ORIGEM);
    const abaOrigem = ssOrigem.getSheetByName(NOME_ABA_ORIGEM);
    const dadosOrigem = abaOrigem.getRange("A2:AS2929").getValues();

    // 2. Identifica em memória quais nomes possuem "E" no intervalo de dados da origem
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

    // 3. Lê os dados da planilha atual (Destino)
    const rangeDestino = abaDestino.getRange(2, 1, abaDestino.getLastRow() - 1, COLUNA_FIM_DADOS);
    const matrizDestino = rangeDestino.getValues();

    // 4. Processa a matriz de destino comparando com o Set de nomes (Alta Performance)
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
              j++; // Pula para a próxima já preenchida
            }
          }
        }
      }
      return linha;
    });

    // 5. Grava as alterações de volta no destino
    rangeDestino.setValues(resultadoFinal);
    ssDestino.toast(`Sincronização concluída! ${nomesComE.size} nomes processados.`);

  } catch (e) {
    Browser.msgBox("Erro de Acesso", "Verifique se o ID do arquivo está correto e se você tem permissão de acesso.", Browser.Buttons.OK);
  }
};