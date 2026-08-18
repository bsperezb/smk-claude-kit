# smk-claude-kit

Plugin de **Claude Code** con los estándares del equipo SMK: agentes, MCPs y skills compartidos. Se instala una vez, se actualiza con un comando. Funciona en Linux, macOS y Windows.

## 1. Antes de instalar

Necesitas tener:

- **Claude Code** con sesión iniciada, y **Node.js ≥ 18**.
- **`uv`** — Linux/macOS: `curl -LsSf https://astral.sh/uv/install.sh | sh` · Windows: `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"`
- **`CONTEXT7_API_KEY`** — crea tu key gratuita en [context7.com](https://context7.com) y déjala como variable de entorno (Linux/macOS: `export CONTEXT7_API_KEY="..."` en tu `~/.bashrc`/`~/.zshrc` · Windows: `setx CONTEXT7_API_KEY "..."`). Abre una terminal nueva después.
- **OpenSpec CLI** (para los comandos `/smk-tcc:opsx:*`): `npm install -g @fission-ai/openspec@latest`

## 2. Instalar

Repo: <https://github.com/bsperezb/smk-claude-kit>

```bash
claude plugin marketplace add https://github.com/bsperezb/smk-claude-kit
claude plugin install smk-tcc@smk-claude-kit
```

> `claude plugin marketplace add bsperezb/smk-claude-kit` (forma corta owner/repo) también funciona.

**Verifica:** abre Claude Code → `/plugin` debe mostrar `smk-tcc` *enabled*, y en `/mcp` deben aparecer `context7`, `sentry`, `markitdown`, `playwright` y `codegraph`. Sentry pide login OAuth la primera vez; codegraph tarda un poco la primera vez (descarga el paquete).

## 3. Actualizar

```bash
claude plugin update smk-tcc
```

## Qué incluye

| Tipo | Nombre | Para qué |
|---|---|---|
| Agente | `git-workflow` | Convenciones de commits del equipo (inglés, Conventional Commits, sin co-authored-by) |
| Skill | `pdf-from-markdown` | Generar PDFs desde Markdown (multiplataforma) |
| Comandos | `/smk-tcc:opsx:*` | [OpenSpec](https://openspec.dev/) — desarrollo spec-driven: `propose`, `apply`, `archive`, `explore`, `sync`, `update` |
| Statusline | `statusline` | Barra de estado del equipo: modelo + effort, contexto, tokens, duración y rate limits. Se instala sola al iniciar sesión |
| Skills | `openspec-*` | Skills de apoyo de OpenSpec (propose/apply/archive/explore/sync/update) |
| MCP | `context7` | Docs actualizadas de librerías/frameworks |
| MCP | `sentry` | Consultar issues y eventos de Sentry |
| MCP | `markitdown` | Convertir PDF/DOCX/etc. a Markdown |
| MCP | `playwright` | Automatización de navegador |
| MCP | `codegraph` | Exploración de código como grafo (símbolos, llamadas, dependencias) |

> **codegraph** solo responde en repos indexados: la primera vez en cada repo corre `npx -y @colbymchenry/codegraph init` (crea `.codegraph/`; agrégalo al `.gitignore`).

> **Statusline**: un hook `SessionStart` la configura en tu `~/.claude/settings.json` la primera vez que abres Claude Code con el plugin activo (reinicia la sesión para verla). Si ya tienes una statusline propia configurada, el plugin **no la toca**. Para desactivarla, borra la clave `statusLine` de `~/.claude/settings.json`.

> **OpenSpec** no es un MCP — es un CLI (`openspec`). El plugin trae los slash commands y skills, pero cada repo necesita la estructura `openspec/` la primera vez: corre `openspec init --tools none` en la raíz del repo (`--tools none` para no duplicar los comandos que ya trae el plugin). Los cambios/especificaciones viven en `openspec/` dentro del repo.

## Contribuir

Rama + PR. Cada artefacto es autocontenido y **debe ser multiplataforma** (sin rutas absolutas ni comandos de un solo SO):

- **Agente** → `plugins/smk-tcc/agents/<nombre>.md` (frontmatter `name`, `description`, `tools`)
- **Skill** → `plugins/smk-tcc/skills/<nombre>/SKILL.md`
- **Comando** → `plugins/smk-tcc/commands/<nombre>.md` (el nombre del archivo es el comando; ojo: todo `.md` ahí se vuelve slash command, no poner docs)

En cada PR sube la `version` de `plugins/smk-tcc/.claude-plugin/plugin.json` (patch = fix, minor = artefacto nuevo) y prueba antes en local:

```bash
claude plugin marketplace add /ruta/local/smk-claude-kit
claude plugin install smk-tcc@smk-claude-kit
```
