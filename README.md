# Sistema EI — Casa do Educador

Visão Geral
----------
Este repositório contém um Google Apps Script bound a uma Google Sheet que gera relatórios (PDFs) e CSVs a partir de dados de frequência e relatórios de faltas. O projeto foi organizado para desenvolvimento local com o CLI `@google/clasp`. Os templates de PDF são arquivos HTML renderizados via HtmlService e convertidos em PDF com Utilities.

Principais funcionalidades
- Menu customizado no Google Sheets para:
  - Gerar PDF — Lista de Frequência
  - Gerar PDF — Relatório de Faltas
  - Gerar CSV — Certificados
- Geração de PDFs com templates HTML: TemplateRelatorioListaFrequencia.html e TemplateRelatorioFaltas.html
- Geração de CSV com conversão para ANSI/Windows-1252 (função generateCsv)
- Processamento reativo via trigger onEdit (roteador por aba)

Arquitetura da Solução
---------------------
- Google Sheets (bound spreadsheet) ↔ Google Apps Script (V8 runtime)
- HtmlService para templates (templates em .html)
- Utilities para conversão e encoding (base64, PDF)
- Desenvolvimento local/controlado via @google/clasp (arquivo .clasp.json)
- Estrutura no repositório: arquivos .js / .gs e .html no root (observação sobre rootDir abaixo)

Observações importantes sobre .clasp.json
- scriptId: 1caDVjjMNkYrOAfL0PYkdsepK0tbuB6Env2fYwlPDQB4gnjVHfpkt5QCq
- rootDir: "dist" — no repositório atual os arquivos .js/.html estão no diretório raíz. Isso indica:
  - Ou existe um passo de build que cria `dist/` (ver build.js e package.json)
  - Ou o .clasp.json precisa ser atualizado para apontar para `.` (ou para o diretório correto)
Ajuste necessário: alinhar o rootDir com a localização real dos arquivos (evita pushes incompletos/ausência de arquivos no Apps Script).

Pré-requisitos
-------------
- Node.js (LTS recomendado)
- npm ou yarn
- Instalar @google/clasp globalmente ou usar localmente
- Conta Google com permissão para o script/planilha destino

Setup do Ambiente Local (passo a passo)
---------------------------------------
1. Instale o Clasp:
   - npm i -g @google/clasp
2. Autentique:
   - clasp login
3. Clonar / Vincular ao projeto existente (usar scriptId acima):
   - clasp clone 1caDVjjMNkYrOAfL0PYkdsepK0tbuB6Env2fYwlPDQB4gnjVHfpkt5QCq
   - (Se você preferir vincular um diretório local já existente, ajuste `.clasp.json` e use `clasp login` e `clasp push`.)
4. Se o projeto usa um build step:
   - Verifique `package.json` / `build.js` e execute `npm run build` (ou o script configurado) para gerar `dist/`.
   - Garanta que os arquivos finais apareçam no `rootDir` configurado no .clasp.json.
5. Boas práticas:
   - Sempre rodar `clasp pull` antes de editar para sincronizar.
   - Depois de alterações locais, rodar `clasp push`.

Fluxo de Desenvolvimento & Comandos úteis
----------------------------------------
- clasp pull                # Baixa alterações da nuvem
- clasp push                # Envia alterações locais para a nuvem
- clasp push --watch        # Observa mudanças e envia automaticamente
- clasp open                # Abre o editor do projeto Apps Script na web
- clasp version             # Cria uma nova versão
- clasp deploy              # Cria/atualiza um deployment
- clasp status              # Verifica status local vs remoto

Mapeamento de arquivos e responsabilidades (resumo)
---------------------------------------------------
- main.js
  - Triggers: onOpen (adiciona menu), onEdit (encaminha chamadas por aba)
  - Roteamento: abas 'DADOS' e 'LISTA FREQUÊNCIA'
- iniciarDownload.js
  - Funções invocadas via menu: iniciarDownloadFrequencia, iniciarDownloadRelatorio, iniciarDownloadCertificados
  - abrirDialogo: renderiza modal (downloadHtmlDialog)
- createAttendanceListPdf.js
  - Gera PDF da aba 'LISTA FREQUÊNCIA'
  - Usa CONFIG_LISTA_FREQUENCIA (células, colunas)
  - Template: TemplateRelatorioListaFrequencia.html
- createAbsenceReportPdf.js
  - Gera PDF da aba 'RELATORIO'
  - Usa CONFIG_RELATORIO (intervalos, índices)
  - Template: TemplateRelatorioFaltas.html
- generateCsv.js
  - Gera CSV para aba 'CERTIFICADO' (valida B1/B2/B3)
  - Conversão para ANSI (convertToAnsiByteArray)
- _utils.js, _constants.js, _base64_constants.js
  - Utilitários comuns (datas, logos em base64, tema do PDF)
- Templates HTML:
  - TemplateRelatorioListaFrequencia.html
  - TemplateRelatorioFaltas.html
  - downloadHtmlDialog.html

Mapeamento de abas e ranges (visão rápida)
-----------------------------------------
- 'LISTA FREQUÊNCIA' — usada por createAttendancePdf / CONFIG_LISTA_FREQUENCIA:
  - CELULAS: E1 (GRUPO), E2 (UNIDADE), E3 (FUNCAO)
  - TABELA: linha inicial 6, col inicial 1, num colunas 7
  - COLUNAS (0-based): NOME=0, LOCAL=1, CPF=2, FUNCAO=3, OBS=6
- 'RELATORIO' — usada por createRelatorioFaltasPdf / CONFIG_RELATORIO:
  - RANGE_PERIODO: B2, RANGE_UNIDADE: B3, RANGE_DATA_ENVIO: B4
  - START_ROW: 7, START_COL:1, NUM_COLS:12
  - INDEX_NOME:0, INDEX_OBSERVACAO:11
- 'CERTIFICADO' — generateCsv exige que a função rode nesta aba; colunas: 1..5 com linha inicial 5

Segurança e Scopes
------------------
/appsscript.json/ define os seguintes scopes:
- https://www.googleapis.com/auth/spreadsheets
- https://www.googleapis.com/auth/script.external_request
- https://www.googleapis.com/auth/script.container.ui

Boas práticas de manutenção
---------------------------
- Mantenha appsscript.json atualizado (scopes, runtimeVersion: V8).
- Centralize constantes (já há _constants.js e _base64_constants.js).
- Evite edição direta na IDE web sem `clasp pull` (risco de sobrescrever).
- Alinhe rootDir no .clasp.json com a localização efetiva dos arquivos (ou documente o build step).

Guia de Uso (para usuários da planilha)
---------------------------------------
1. Abra a planilha vinculada.
2. Menu "🖨️ Relatórios" → escolha ação.
3. O modal irá aparecer e processar; após concluído, um link/base64 para download é retornado (ou o arquivo é preparado para download).
4. Em caso de erro: verifique permissões (acesso à planilha, permissões de execução do Apps Script) e confira se as abas e intervalos estão nos nomes esperados.

Referências rápidas
------------------
- scriptId: 1caDVjjMNkYrOAfL0PYkdsepK0tbuB6Env2fYwlPDQB4gnjVHfpkt5QCq
- runtime: V8
- timeZone: America/Sao_Paulo
