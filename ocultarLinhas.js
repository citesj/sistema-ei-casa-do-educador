/**
 * Oculta as linhas que estão completamente vazias em uma determinada planilha (sheet)
 * e armazena os números das linhas ocultadas em um array.
 *
 * @param {Sheet} sheet - O objeto da planilha a ser processada.
 * Normalmente obtido com `SpreadsheetApp.getActiveSpreadsheet().getSheetByName('NomeDaAba')`.
 * @param {Array} arr - Um array para armazenar os números das linhas que foram ocultadas.
 */
function hideRows(sheet, arr) {
  // Obtém a última linha e a última coluna que contêm dados na planilha.
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  // Pega todos os dados da planilha de uma vez para otimizar a leitura.
  // O resultado é um array de arrays, onde cada array interno representa uma linha.
  const data = sheet.getRange(1, 1, lastRow, lastColumn).getValues();

  // Percorre todas as linhas da planilha, começando da última e indo até a primeira.
  // A iteração de baixo para cima é crucial para evitar problemas com a reindexação
  // das linhas que ocorre quando uma linha é ocultada.
  for (let i = lastRow - 1; i >= 0; i--) {
    // Acessa os dados da linha atual.
    const currentRow = data[i];

    // Verifica se todas as células da linha atual estão vazias.
    // O método `every()` testa se todos os elementos do array passam na condição.
    // `celula.trim() === ""` remove espaços em branco antes de verificar se a célula está vazia.
    const isRowEmpty = currentRow.every(cell => cell.toString().trim() === "");

    // Se a linha estiver completamente vazia, executa as ações abaixo.
    if (isRowEmpty) {
      // O índice do array `data` é baseado em zero (começa em 0),
      // enquanto as linhas na planilha são baseadas em um (começam em 1).
      // Por isso, somamos 1 para obter o número correto da linha.
      const rowNumber = i + 1;

      // Adiciona o número da linha ao array fornecido como parâmetro.
      // Isso permite que o chamador da função saiba quais linhas foram ocultadas.
      arr.push(rowNumber);

      // Oculta a linha na planilha.
      sheet.hideRows(rowNumber);
    }
  }
}