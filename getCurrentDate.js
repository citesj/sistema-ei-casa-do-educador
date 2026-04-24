/**
 * Retorna a data atual em formato dd-mm-yyyy
 */
function getCurrentDate() {
    return new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
}