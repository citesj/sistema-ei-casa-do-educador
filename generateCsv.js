/**
 * Função principal que é chamada pelo item de menu.
 * Ela define o intervalo, obtém os dados, converte para CSV e mostra o link para download.
 */

function generateCsv() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const sheetName = sheet.getName();
  const ui = SpreadsheetApp.getUi();

  if (sheetName !== 'CERTIFICADO') {
    ui.alert('Erro: Esta função só pode ser executada na aba "CERTIFICADO".');
    return;
  }

  // --- CONFIGURAÇÕES ---
  const linhaInicial = 5;      
  const colunaInicial = 1;     
  const colunaFinal = 5;       
  const grupoDeFormacaoSelecionado = sheet.getRange("B1").getValue();
  const periodoInicial = sheet.getRange("B2").getValue();
  const periodoFinal = sheet.getRange("B3").getValue();
  // ---------------------
  
  const ultimaLinha = sheet.getLastRow();
  
  if (ultimaLinha < linhaInicial) {
    ui.alert('Não há dados para exportar no intervalo especificado.');
    return; 
  }
  
  const numLinhas = ultimaLinha - linhaInicial + 1;
  const numColunas = colunaFinal - colunaInicial + 1;
  
  const range = sheet.getRange(linhaInicial, colunaInicial, numLinhas, numColunas);
  const data = range.getValues();
  
  const csvContentString = convertToCsvString(data);
  const ansiByteArray = convertToAnsiByteArray(csvContentString);

  const dataAtual = getCurrentDate('dd-MM-yyyy');
  
  const nomeAbaAtualFormatado = formatarParaSlug(sheetName);
  
  const grupoDeFormacaoSelecionadoFormatado = formatarParaSlug(grupoDeFormacaoSelecionado);
  const periodoInicialFormatado = formatarMesParaAbreviatura(periodoInicial);
  const periodoFinalFormatado = formatarMesParaAbreviatura(periodoFinal);
  
  const fileName = `${dataAtual}_${nomeAbaAtualFormatado}_${periodoInicialFormatado}-${periodoFinalFormatado}_${grupoDeFormacaoSelecionadoFormatado}.csv`;
  
  const blob = Utilities.newBlob(ansiByteArray, 'text/csv', fileName);
  
  return {
    fileData: Utilities.base64Encode(blob.getBytes()),
    fileName: fileName,
    fileExtension: 'csv'
  };
}

// ... (restante das funções auxiliares permanecem iguais)

/**
 * Função auxiliar para converter um array 2D (de getValues()) em uma string CSV.
 * Lida corretamente com vírgulas e aspas duplas dentro das células.
 * @param {Array<Array<any>>} data O array 2D com os dados.
 * @return {string} Os dados formatados como uma string CSV.
 */
function convertToCsvString(data) {
  return data.map(row => {
    return row.map(cell => {
      let cellString = cell.toString();
      if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')) {
        cellString = '"' + cellString.replace(/"/g, '""') + '"';
      }
      return cellString;
    }).join(';');
  }).join('\n');
}

// =================================================================
// FUNÇÃO DE CONVERSÃO DE STRING (UTF-8) PARA BYTE ARRAY (ANSI/Windows-1252)
// =================================================================
function convertToAnsiByteArray(str) {
  const ansiBytes = [];
  // Mapeamento de caracteres especiais do Unicode para seus códigos em Windows-1252
  // Somente os caracteres que diferem do ASCII padrão precisam ser mapeados.
  const unicodeToAnsiMap = {
    '€': 128, '‚': 130, 'ƒ': 131, '„': 132, '…': 133, '†': 134, '‡': 135,
    'ˆ': 136, '‰': 137, 'Š': 138, '‹': 139, 'Œ': 140, 'Ž': 142, '‘': 145,
    '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151, '˜': 152,
    '™': 153, 'š': 154, '›': 155, 'œ': 156, 'ž': 158, 'Ÿ': 159, '¡': 161,
    '¢': 162, '£': 163, '¤': 164, '¥': 165, '¦': 166, '§': 167, '¨': 168,
    '©': 169, 'ª': 170, '«': 171, '¬': 172, '®': 174, '¯': 175, '°': 176,
    '±': 177, '²': 178, '³': 179, '´': 180, 'µ': 181, '¶': 182, '·': 183,
    '¸': 184, '¹': 185, 'º': 186, '»': 187, '¼': 188, '½': 189, '¾': 190,
    '¿': 191, 'À': 192, 'Á': 193, 'Â': 194, 'Ã': 195, 'Ä': 196, 'Å': 197,
    'Æ': 198, 'Ç': 199, 'È': 200, 'É': 201, 'Ê': 202, 'Ë': 203, 'Ì': 204,
    'Í': 205, 'Î': 206, 'Ï': 207, 'Ð': 208, 'Ñ': 209, 'Ò': 210, 'Ó': 211,
    'Ô': 212, 'Õ': 213, 'Ö': 214, '×': 215, 'Ø': 216, 'Ù': 217, 'Ú': 218,
    'Û': 219, 'Ü': 220, 'Ý': 221, 'Þ': 222, 'ß': 223, 'à': 224, 'á': 225,
    'â': 226, 'ã': 227, 'ä': 228, 'å': 229, 'æ': 230, 'ç': 231, 'è': 232,
    'é': 233, 'ê': 234, 'ë': 235, 'ì': 236, 'í': 237, 'î': 238, 'ï': 239,
    'ð': 240, 'ñ': 241, 'ò': 242, 'ó': 243, 'ô': 244, 'õ': 245, 'ö': 246,
    '÷': 247, 'ø': 248, 'ù': 249, 'ú': 250, 'û': 251, 'ü': 252, 'ý': 253,
    'þ': 254, 'ÿ': 255
  };

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = char.charCodeAt(0);

    if (code < 128) {
      // Caracteres ASCII padrão (0-127) são os mesmos em ambas as codificações.
      ansiBytes.push(code);
    } else {
      // Para caracteres especiais, usamos o mapa de conversão.
      const ansiCode = unicodeToAnsiMap[char];
      if (ansiCode !== undefined) {
        ansiBytes.push(ansiCode);
      } else {
        // Se o caractere não existir em ANSI (ex: emoji), substitui por '?'
        ansiBytes.push(63);
      }
    }
  }
  return ansiBytes;
}

/**
 * Formata uma string para ser usada como "slug" (em URLs, etc.).
 * Converte para minúsculas, substitui pontos e espaços por hifens,
 * e remove hifens no início ou no fim da string.
 *
 * @param {string} texto O texto a ser formatado.
 * @returns {string} O texto formatado.
 */
const formatarParaSlug = (texto) => {
  const textoVerificado = verificaStringVazia(texto)

  const textoFormatado = textoVerificado
    .toLowerCase()
    .replace(/[\. ]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return textoFormatado;
};

function verificaStringVazia(texto) {
  if (typeof texto !== 'string' || !texto.trim()) {
    return "";
  }

  return texto
}

function formatarMesParaAbreviatura(mes) {
  verificaStringVazia(mes)

  return mes.slice(0,3).toLowerCase()
}