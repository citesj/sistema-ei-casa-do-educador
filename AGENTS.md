# AGENTS.md — Contexto para Agentes/LLMs (Google Apps Script + Clasp)

Resumo rápido
-------------
- Tipo de projeto: Google Apps Script bound a Google Sheets (scripts e templates no repo).
- Runtime: V8 (Javascript moderno).
- Ferramenta de gerenciamento: @google/clasp (CLI).
- scriptId: 1caDVjjMNkYrOAfL0PYkdsepK0tbuB6Env2fYwlPDQB4gnjVHfpkt5QCq

Regras estritas para agentes
----------------------------
1. Arquivos válidos locais:
   - Scripts: .js, .gs
   - Templates/UI: .html
   - Config: .json (appsscript.json, .clasp.json)
2. Não gerar/usar módulos Node (`require`/`import`) em runtime Apps Script sem bundling.
3. Nunca editar a versão remota via IDE web sem primeiro executar `clasp pull`.
4. Mantenha appsscript.json atualizado (scopes e runtimeVersion).
5. Valide encoding ao manipular blobs/base64 (UTF-8 vs ANSI/Windows-1252 no CSV).

Mapeamento de arquivos → responsabilidades (para parsing automático)
-------------------------------------------------------------------
- main.js
  - Funções exportadas: onOpen, onEdit
  - Roteador por aba:
    - 'DADOS' → processarStatusFrequencia(e) (ver processarStatusFrequencia.js)
    - 'LISTA FREQUÊNCIA' → processarListaFrequencia(e) (ver processarListaFrequencia.js)
- iniciarDownload.js
  - iniciarDownloadFrequencia → abrirDialogo('pdf', 'createAttendancePdf', ...)
  - iniciarDownloadRelatorio → abrirDialogo('pdf', 'createRelatorioFaltasPdf', ...)
  - iniciarDownloadCertificados → abrirDialogo('csv', 'generateCsv', ...)
  - abrirDialogo: injeta `tipoArquivo` e `acaoServidor` no template downloadHtmlDialog
- createAttendanceListPdf.js
  - Entry: createAttendancePdf()
  - Template: TemplateRelatorioListaFrequencia (HtmlService.createTemplateFromFile)
  - CONFIG_LISTA_FREQUENCIA: CELULAS (E1/E2/E3), TABELA (linha 6), COLUNAS (NOME=0, LOCAL=1, CPF=2, FUNCAO=3, OBS=6)
- createAbsenceReportPdf.js
  - Entry: createRelatorioFaltasPdf()
  - Template: TemplateRelatorioFaltas
  - CONFIG_RELATORIO: SHEET_NAME 'RELATORIO', RANGE_PERIODO B2, etc.
- generateCsv.js
  - Entry: generateCsv()
  - Aba esperada: 'CERTIFICADO'
  - Linha inicial: 5, col 1..5, usa B1/B2/B3 para meta-infos
- Templates HTML
  - TemplateRelatorioListaFrequencia.html — espera variáveis: m (metadados), dados (registros), theme, logo
  - TemplateRelatorioFaltas.html — espera m, dados, notas, theme, logo, assinaturaCasaEducador
  - downloadHtmlDialog.html — modal que chama google.script.run[acaoServidor]

Entidades do Google Sheets (nomes exatos)
-----------------------------------------
- LISTA FREQUÊNCIA
- RELATORIO
- CERTIFICADO
- DADOS
- (Não há Named Ranges explícitos referenciados no código; se existirem no spreadsheet, não foram encontrados no repo.)

Pontos de atenção semânticos para agentes
----------------------------------------
- HTML templates usam `<? ... ?>` e `<?= ... ?>` (Apps Script template syntax) — ao gerar ou editar, mantenha essa sintaxe.
- Variáveis injetadas nos templates:
  - template.m (metadados) — ex.: m.unidade, m.grupo, m.funcao
  - template.dados — array de objetos ou matriz conforme cada gerador
  - template.theme — PDF_THEME (fonte, cores)
  - template.logo — LOGO_BRASAO (base64)
- Funções que retornam arquivos usam padrão:
  - { fileData: base64, fileName: string, fileExtension: 'pdf'|'csv' }

Comandos que o agente deve executar/validar (sequência)
------------------------------------------------------
1. Validar configuração local:
   - Ler .clasp.json → confirmar scriptId e rootDir
   - Ler appsscript.json → confirmar runtime/scopes
2. Sincronizar:
   - `clasp pull` (sempre antes de editar)
3. Build (se aplicável):
   - Verificar package.json.scripts e executar o build indicado (ex.: npm run build)
   - Conferir que os arquivos gerados estejam no rootDir configurado
4. Lint / checagem estática:
   - Verificar referências a SpreadsheetApp, HtmlService, Utilities
   - Detectar chamadas a openById (sincronizarArquivosDistintos usa ID externo: 1o-z5d6eV_Er3TcfnO20bdHi_IUYnspD-iDGeGYrFLNw)
5. Push:
   - `clasp push` (após validações)
6. Deploy:
   - `clasp version` → `clasp deploy`

Checks automáticos recomendados para agentes
-------------------------------------------
- As funções chamadas pelos menus existem e estão exportadas globalmente:
  - iniciarDownloadFrequencia → createAttendancePdf
  - iniciarDownloadRelatorio → createRelatorioFaltasPdf
  - iniciarDownloadCertificados → generateCsv
- Templates referenciados existem: TemplateRelatorioListaFrequencia, TemplateRelatorioFaltas, downloadHtmlDialog
- Verificar uso de imagens base64 (LOGO_BRASAO, ASSINATURA_CASA_EDUCADOR) em _base64_constants.js
- Confirmar que appsscript.json inclui scopes para todas as APIs utilizadas
- Detectar functions que usam UrlFetch/Externals (nenhuma explícita, mas appsscript.json inclui script.external_request)
- Revisar qualquer ID hard-coded (ex.: planilha em sincronizarArquivosDistintos) e anotar implicações de permissão

Parsing e instrução de código (para agentes)
-------------------------------------------
- Para extrair a lista de funções globais: parsear arquivos .js/.gs e localizar declarações `function <name>(...)` e atribuições globais (`const Foo = () => {}`).
- Para mapear triggers:
  - Busque `function onOpen` e `function onEdit`
  - Busque chamadas a ScriptApp.newTrigger para triggers instaláveis (não encontrado neste repo)
- Para mapear rotas por aba:
  - Localizar objeto `roteadorAbas` em main.js e extrair chaves (nomes das abas) e valores (funções)
- Para mapear templates:
  - Encontrar `HtmlService.createTemplateFromFile('<filename>')` e extrair quais variáveis são definidas em `template.X = ...`
- Para mapear colunas/intervalos:
  - Extrair constantes `CONFIG_*` (CONFIG_LISTA_FREQUENCIA, CONFIG_RELATORIO) e usar para gerar instruções precisas de leitura/escrita de células.

Condições de não edição
-----------------------
- NUNCA executar `clasp push` com rootDir desalinhado (pode omitir arquivos).
- NUNCA editar diretamente na IDE web sem `clasp pull` antes.

Metadados úteis (extraídos)
---------------------------
- .clasp.json:
  - scriptId: 1caDVjjMNkYrOAfL0PYkdsepK0tbuB6Env2fYwlPDQB4gnjVHfpkt5QCq
  - rootDir: "dist" (atenção: arquivos estão no root)
  - scriptExtensions: [".js", ".gs"]
  - htmlExtensions: [".html"]
- appsscript.json:
  - timeZone: "America/Sao_Paulo"
  - oauthScopes: spreadsheets, script.external_request, script.container.ui
  - runtimeVersion: "V8"

Notas finais para agentes
-------------------------
- Priorize a leitura das constantes CONFIG_* e dos templates HTML para entender o layout do PDF/CSV.
- Se for modificar geração de PDF/HTML, preserve a compatibilidade com os dados injetados (m, dados, theme, logo).
- Informe explicitamente em qualquer PR alterações em abas/nomes de colunas, pois isso exige atualização dos usuários da planilha.
