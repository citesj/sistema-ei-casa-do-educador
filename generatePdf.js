/**
 * Gera um arquivo pdf da aba ativa, ocultando as linhas vazias durante a emissão.
 */
function generatePdf() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();
  const sheetId = sheet.getSheetId();

  const unidadeDeEnsinoSelecionada = sheet.getRange("B3").getValue();

  const linhasOcultas = [];

  try {
    hideRows(sheet, linhasOcultas)

    SpreadsheetApp.flush();

    const opcoesPdf = {
      exportFormat: 'pdf',
      format: 'pdf',
      size: 'A4',
      portrait: 'false',
      fitw: 'true',
      gridlines: 'false',
      printtitle: 'true',
      sheetnames: 'true',
      fzr: 'true',
      gid: sheetId
    };

    const urlBase = spreadsheet.getUrl().replace(/edit$/, '');
    const urlParams = Object.keys(opcoesPdf).map(key => `${key}=${opcoesPdf[key]}`);
    const urlCompleta = urlBase + 'export?' + urlParams.join('&');

    const token = ScriptApp.getOAuthToken();
    const response = UrlFetchApp.fetch(urlCompleta, {
      headers: {
        'Authorization': 'Bearer ' + token
      },
      muteHttpExceptions: true
    });

     if (response.getResponseCode() !== 200) {
        throw new Error(`Falha na requisição ao gerar PDF. Código: ${response.getResponseCode()}. Resposta: ${response.getContentText()}`);
    }

    const currentDate = getCurrentDate()
    const currentSheetNameFormatted = sheet.getName().toLowerCase().split(' ').join("-")
    const nomeUnidadeDeEnsinoFormatado = unidadeDeEnsinoSelecionada.toLowerCase().split(' ').join("-")
    const fileName = `${currentDate}-${currentSheetNameFormatted}-${nomeUnidadeDeEnsinoFormatado}.pdf`;
    
    const blob = response.getBlob()
        
    return {
      fileData: Utilities.base64Encode(blob.getBytes()),
      fileName: fileName,
      fileExt: 'pdf'
    };

  } catch(error) {
    console.error(`Falha ao gerar PDF: ${error.toString()}`);
    console.error(error.stack)
    throw new Error('Não foi possível gerar o PDF. Verifique os logs para mais detalhes.');
  } finally {
    if (linhasOcultas.length > 0) {
      linhasOcultas.forEach(numeroDaLinha => sheet.showRows(numeroDaLinha));
    }
  }
}