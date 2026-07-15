# smk-claude-kit

Kit de estándares de **Claude Code** del equipo SMK: agentes, MCPs y skills compartidos, distribuidos como plugin. Se instala una vez y se actualiza con un comando.

Funciona en **Linux, macOS y Windows**.

## Requisitos previos

| Requisito | Linux / macOS | Windows |
|---|---|---|
| [Claude Code](https://code.claude.com) | instalado y con sesión iniciada | igual |
| Node.js ≥ 18 | NVM o instalador | [nodejs.org](https://nodejs.org) o `winget install OpenJS.NodeJS.LTS` |
| `uv` (para el MCP markitdown) | `curl -LsSf https://astral.sh/uv/install.sh \| sh` | `powershell -c "irm https://astral.sh/uv/install.ps1 \| iex"` |
| `CONTEXT7_API_KEY` (key gratuita en [context7.com](https://context7.com)) | `export CONTEXT7_API_KEY="..."` en `~/.bashrc` o `~/.zshrc` | `setx CONTEXT7_API_KEY "..."` (o Variables de entorno del sistema) |
| Acceso a este repo privado | SSH configurado o `gh auth login` | igual |

> Tras configurar la variable de entorno, abre una terminal nueva para que tome efecto.

## Instalación

```bash
claude plugin marketplace add <owner>/smk-claude-kit   # o la URL git SSH del repo
claude plugin install smk-tcc@smk-claude-kit
```

**Verificación:** abre Claude Code y comprueba con `/plugin` que `smk-tcc` está *enabled*. En `/mcp` deben aparecer `context7`, `sentry`, `markitdown` y `playwright`. Sentry pide autenticación OAuth la primera vez.

## Actualización

```bash
claude plugin update smk-tcc
```

(o desde el menú `/plugin` dentro de Claude Code)

## Qué incluye

| Tipo | Nombre | Descripción |
|---|---|---|
| Agente | `git-workflow` | Convenciones de git del equipo: commits en inglés (Conventional Commits), sin co-authored-by, reglas de seguridad |
| Skill | `pdf-from-markdown` | Generación de PDFs desde Markdown con puppeteer + marked (multiplataforma) |
| MCP | `context7` | Documentación actualizada de librerías y frameworks (requiere `CONTEXT7_API_KEY`) |
| MCP | `sentry` | Consulta de issues y eventos de Sentry (OAuth la primera vez) |
| MCP | `markitdown` | Conversión de documentos (PDF, DOCX, etc.) a Markdown (requiere `uv`) |
| MCP | `playwright` | Automatización de navegador para pruebas y scraping |

## Opcionales recomendados (no incluidos en el plugin)

Dependen de binarios instalados localmente, por eso no van en el plugin:

- **[CodeGraph](https://codegraph.dev)** — indexado y exploración de código como grafo.
- **[Pencil](https://pencil.dev)** — diseño de interfaces en archivos `.pen`.

## Cómo contribuir / extender

El repo está pensado para crecer vía PR sin tocar lo existente:

| Artefacto | Dónde va | Formato |
|---|---|---|
| Agente | `plugins/smk-tcc/agents/<nombre>.md` | Un `.md` autocontenido con frontmatter (`name`, `description`, `tools`) |
| Skill | `plugins/smk-tcc/skills/<nombre>/SKILL.md` | Carpeta autocontenida con `SKILL.md` |
| Comando | `plugins/smk-tcc/commands/<nombre>.md` | El nombre del archivo es el comando (`revisar-pr.md` → `/revisar-pr`); el contenido es el prompt, con frontmatter `description` y `$ARGUMENTS` para argumentos. **Ojo:** todo `.md` en `commands/` se convierte en comando — no poner documentación ahí |
| Hook | `plugins/smk-tcc/hooks/` | Aún no activos — ver `hooks/README.md` |

Reglas:

1. Crea una rama y abre un PR.
2. **Todo artefacto debe ser multiplataforma** (Linux, macOS y Windows): sin rutas absolutas ni comandos exclusivos de un SO; usar `npx`/`uvx`/node.
3. Sube la `version` en `plugins/smk-tcc/.claude-plugin/plugin.json` en cada cambio: **patch** = fix o edición, **minor** = artefacto nuevo.
4. Prueba localmente antes del PR:

```bash
claude plugin marketplace add /ruta/local/smk-claude-kit
claude plugin install smk-tcc@smk-claude-kit
```

El marketplace puede alojar más plugins en el futuro (p.ej. `smk-frontend`, `smk-devops`) agregándolos bajo `plugins/` y registrándolos en `.claude-plugin/marketplace.json`.
