/**
 * Função "roteadora" chamada pelo cliente para obter os dados do arquivo.
 * @param {string} tipo O tipo de arquivo solicitado pelo cliente.
 * @returns {Object} Um objeto contendo {fileData, fileName, fileExtension}.
 */
function obterDadosDoArquivo(tipo) {
  if (tipo === 'pdf') {
    return generatePdf();
  } else if (tipo === 'csv') {
    return generateCsv();
  } else {
    throw new Error('Tipo de arquivo desconhecido: ' + tipo);
  }
}