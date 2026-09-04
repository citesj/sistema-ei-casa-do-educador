# Contribuindo — Sistema EI (Casa do Educador)

Princípios gerais
-----------------
- Mantenha mudanças pequenas e focadas em uma issue/feature por PR.
- Explique o propósito do PR no título e descrição.
- Atualize a documentação relevante quando modificar comportamento público (APIs, nomes de abas, ranges).

Fluxo recomendado para desenvolvimento
-------------------------------------
1. Atualize localmente:
   - Sempre comece com `clasp pull`.
2. Crie uma branch:
   - git checkout -b feat/nome-curto
3. Faça mudanças e rode o build (se houver):
   - npm install
   - npm run build  (verifique package.json)
4. Teste localmente (no Apps Script só é possível testes manuais ao pushar):
   - clasp push
   - Abra a planilha e execute via menu para validar.
5. Commit e PR:
   - git add .
   - git commit -m "feat: descrição curta"
   - git push origin feat/nome-curto
   - Abra PR descrevendo mudança e como testar.

Requisitos antes do merge
-------------------------
- Código comentado e legível (padrão atual do projeto em PT-BR).
- Se possível, inclua um passo a passo para reproduzir manualmente.
- Confirme que `appsscript.json` e `.clasp.json` continuam corretos.
- Para mudanças que alteram nomes de abas/intervalos, atualize README e AGENTS.md.

Boas práticas específicas (Apps Script / Clasp)
-----------------------------------------------
- Não modificar manualmente via IDE web sem `clasp pull` prévio.
- Evite variáveis globais mutáveis que possam conflitar com execuções concorrentes.
- Use HtmlService.createTemplateFromFile para templates dinâmicos e injete somente dados higienizados.
- Use Utilities/base64 com cuidado para blobs grandes — prefira geração assíncrona e checagens de limites se necessário.
- Sempre declare `runtimeVersion: "V8"` no appsscript.json para compatibilidade com ES6.

Estilo de código
----------------
- Comentários em PT-BR (seguindo o padrão do repositório).
- Funções pequenas e com responsabilidade única.
- Prefira nomes descritivos para constantes de configuração (já há CONFIG_*).
- Evite magic numbers — extraia para constantes.

Processo de build e deploy
--------------------------
- Se existir um build step (ver `build.js`/`package.json`), execute-o antes de `clasp push`.
- Para deploy de produção:
  - clasp version --description "mensagem"
  - clasp deploy --description "deploy X"
- Documente no PR qualquer necessidade de alteração de versões/access scopes.

Contato
-------
- Mantenha comentários e issues claros e reproduzíveis.
