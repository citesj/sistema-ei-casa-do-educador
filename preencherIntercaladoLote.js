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
  const VALOR_A = "P"; // Valor para a 1ª, 3ª, 5ª coluna...
  const VALOR_B = 3.50;   // Valor para a 2ª, 4ª, 6ª coluna...
  // ---------------------

  const range = sheet.getRange(RANGE_ALVO);
  const matrizDados = range.getValues();

  // Processamento em memória com sintaxe moderna
  const resultado = matrizDados.map((linha) => {
    return linha.map((_, colIdx) => {
      // colIdx é o índice relativo ao início do intervalo (0, 1, 2...)
      // Se o índice for par (0, 2, 4...), coloca VALOR_A
      // Se o índice for ímpar (1, 3, 5...), coloca VALOR_B
      return (colIdx % 2 === 0) ? VALOR_A : VALOR_B;
    });
  });

  // Grava o padrão intercalado em todo o intervalo de uma só vez
  range.setValues(resultado);
  
  ss.toast("Preenchimento intercalado concluído!", "Status");
};