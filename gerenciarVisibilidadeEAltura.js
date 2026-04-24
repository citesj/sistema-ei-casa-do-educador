/**
 * @OnlyCurrentDoc
 *
 * VERSÃO SUPER OTIMIZADA (AGO/2025)
 * Este script gerencia a visibilidade e a altura das linhas em uma planilha
 * onde os dados são contínuos (sem linhas vazias no meio).
 */

// --- CONFIGURAÇÕES GLOBAIS ---
const NOME_DA_ABA = 'LISTA FREQUÊNCIA'; // Verifique se corresponde exatamente ao nome da sua aba.
const LINHA_INICIO_DADOS = 6;     // Linha onde os dados começam a ser gerenciados.
const ALTURA_PADRAO = 40;         // Altura padrão e mínima para as linhas.
// -----------------------------

/**
 * Orquestra todo o processo com base na premissa de que não há linhas vazias entre os dados.
 * @param {Object} e O objeto de evento passado pelo gatilho onEdit.
 */
function gerenciarVisibilidadeEAltura(e) {
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  const targetCell = e.range.getA1Notation();

  try {
    if (sheetName !== 'LISTA FREQUÊNCIA' && targetCell !== CELULA_GRUPO_FORMACAO) return
    SpreadsheetApp.getActiveSpreadsheet().toast('Redimensionando linhas...', 'Aguarde', 2);
    // 1. MOSTRAR TUDO E ATUALIZAR
    // Mostra todas as linhas para permitir que a fórmula de filtro recalcule corretamente.
    const maxRows = sheet.getMaxRows();
    if (maxRows > LINHA_INICIO_DADOS) {
      sheet.showRows(LINHA_INICIO_DADOS, maxRows - LINHA_INICIO_DADOS + 1);
    }
    // Comando CRÍTICO: Força a planilha a aplicar as mudanças e recalcular as fórmulas.
    SpreadsheetApp.flush();

    // 2. ENCONTRAR NOVO ESTADO
    // Agora, pega a última linha real APÓS a fórmula ter sido recalculada.
    const newLastRow = sheet.getLastRow();

    // Garante que não tentaremos ocultar linhas acima do nosso ponto de partida.
    const lastRowWithData = Math.max(newLastRow, LINHA_INICIO_DADOS - 1);
    const addtionalEmptyRows = 10
    const lastDesiredVisibleRow = lastRowWithData + addtionalEmptyRows

    // 3. OCULTAR O EXCESSO DE UMA SÓ VEZ
    // Calcula o bloco de linhas a serem ocultadas (da última linha [com dados + algumas para preenchimento] até o fim).
    const rowToStartHiding = lastDesiredVisibleRow + 1;
    if (rowToStartHiding <= maxRows) {
        const numRowsToHide = maxRows - rowToStartHiding + 1;
        sheet.hideRows(rowToStartHiding, numRowsToHide);
    }

    // 4. REDIMENSIONAR O CONTEÚDO VISÍVEL
    // A função de redimensionamento agora só opera no conjunto de dados visível.
    if (lastDesiredVisibleRow >= LINHA_INICIO_DADOS) {
        ajustarAlturaLinhas(sheet, lastDesiredVisibleRow);
    }

    SpreadsheetApp.getActiveSpreadsheet().toast('✅ Sucesso... Redimensionamento concluído!', 'Lista de Frequência', 5);

  } catch (error) {
    console.error(`Falha ao gerenciar planilha: ${error.toString()}`);
    console.error(error.stack);
    SpreadsheetApp.getActiveSpreadsheet().toast(`❌ Erro: ${error.message}`, 'Falha na Execução', 10);
  }
}

/**
 * Ajusta a altura das linhas com base em uma estimativa  * do conteúdo (contando quebras de linha).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet O objeto da planilha a ser processado.
 * @param {number} ultimaLinha A última linha com dados a ser considerada.
 */
function ajustarAlturaLinhas(sheet, ultimaLinha) {
  try {
    const numLinhas = ultimaLinha - LINHA_INICIO_DADOS + 1;
    if (numLinhas <= 0) return;

    // Define uma altura base para todas as linhas de uma vez.
    sheet.setRowHeights(LINHA_INICIO_DADOS, numLinhas, ALTURA_PADRAO);

    // Pega os valores para análise local, sem mais leituras da planilha.
    const valores = sheet
      .getRange(LINHA_INICIO_DADOS, 1, numLinhas, sheet.getLastColumn())
      .getValues();

    const ALTURA_POR_LINHA_TEXTO = 18; // Fator de ajuste: pixels por linha de texto. Ajuste se necessário.

    // Itera sobre os dados (em memória, muito rápido) para calcular e aplicar novas alturas.
    for (let i = 0; i < valores.length; i++) {
      let maxLinhasDeTexto = 1;
      
      // Encontra a célula com mais quebras de linha na linha atual.
      for (const celula of valores[i]) {
        const linhasDeTexto = (String(celula).match(/\n/g) || []).length + 1;
        if (linhasDeTexto > maxLinhasDeTexto) {
          maxLinhasDeTexto = linhasDeTexto;
        }
      }
      
      // Se a célula precisa de mais espaço do que a altura padrão, calcula a altura estimada.
      if (maxLinhasDeTexto > 2) { // 2 linhas de texto geralmente cabem em 40px
        const alturaEstimada = ALTURA_PADRAO + (maxLinhasDeTexto - 2) * ALTURA_POR_LINHA_TEXTO;
        sheet.setRowHeight(LINHA_INICIO_DADOS + i, alturaEstimada);
      }
    }

  } catch (error) {
    console.error(`Falha ao redimensionar (estimado): ${error.toString()}`);
    throw new Error('Não foi possível redimensionar as linhas com o método estimado.');
  }
}