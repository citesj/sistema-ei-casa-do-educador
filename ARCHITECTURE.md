# Arquitetura — Sistema EI (Casa do Educador)

Visão geral arquitetural
------------------------
- Projeto: Google Apps Script bound (Sheet) + HtmlService templates.
- Runtime: V8 (appsscript.json: runtimeVersion: "V8").
- Interface de desenvolvimento: @google/clasp (CLI).
- Build: Possível build step (presença de build.js e rootDir = "dist").

Estrutura de diretórios (observada no repositório)
- /.clasp.json
- /appsscript.json
- /main.js
- /iniciarDownload.js
- /createAttendanceListPdf.js
- /createAbsenceReportPdf.js
- /generateCsv.js
- /_utils.js
- /_constants.js
- /_base64_constants.js
- /TemplateRelatorioListaFrequencia.html
- /TemplateRelatorioFaltas.html
- /downloadHtmlDialog.html
- /build.js
- /package.json

Nota sobre rootDir
- .clasp.json contém "rootDir": "dist" — porém os arquivos fonte estão no root. É necessário:
  - Executar build que produz `dist/` com os arquivos finais (se for intencional), OU
  - Atualizar `.clasp.json` para apontar para `.` ou para o diretório correto.

Mapeamento de dependências e APIs do Google
------------------------------------------
- SpreadsheetApp — leitura/escrita de dados na planilha.
- HtmlService — templates e modais.
- Utilities — manipulação de Blob, PDF, base64.
- Session — timezone e informações da sessão.
- Scopes necessários (appsscript.json):
  - spreadsheets
  - script.external_request
  - script.container.ui

Componentes e responsabilidades
-------------------------------
- UI / Triggers
  - onOpen (main.js) — cria menus
  - onEdit (main.js) — roteador por aba (DADOS, LISTA FREQUÊNCIA)
- Geradores
  - createAttendancePdf: extrai 'LISTA FREQUÊNCIA', monta HTML com TemplateRelatorioListaFrequencia, converte para PDF
  - createRelatorioFaltasPdf: extrai 'RELATORIO', processa observações longas (anexos), usa TemplateRelatorioFaltas
  - generateCsv: valida aba 'CERTIFICADO', gera CSV com encoding ANSI
- UI modals
  - downloadHtmlDialog.html — modal que chama server-side via google.script.run
- Assets
  - _base64_constants.js — provê imagens (LOGO_BRASAO, ASSINATURA_CASA_EDUCADOR) em base64
  - _constants.js — PDF_THEME e outras constantes visuais

Boas práticas para HTML & HtmlService
------------------------------------
- Sanitizar strings antes de injetar no template (o projeto já aplica escape em createAbsenceReportPdf.js).
- Evitar lógica pesada no template — template deve apenas listar/formatar dados, não executar ETL pesado.
- Templates devem receber apenas dados já higienizados e formatados.

Observações sobre runtime V8
---------------------------
- O V8 permite sintaxe ES6+ (let/const, arrow functions). Certifique-se de não usar módulos Node (`require`/`import`) sem bundler.
- Se houver uso de bundler (webpack/rollup), garanta que o output seja um conjunto de arquivos compatíveis com Apps Script (global-scope functions).

Checklist técnico antes do deploy
--------------------------------
- Alinhar `.clasp.json` rootDir com a realidade do repo.
- Verificar appsscript.json scopes e remover scopes desnecessários.
- Validar templates HTML para caracteres especiais e encoding.
- Testar manualmente: push → abrir planilha → usar menu → verificar arquivos gerados.
