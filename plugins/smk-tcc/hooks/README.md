# Hooks

## Activos (`hooks.json`)

- **SessionStart**: corre `statusline/install.js` (Node). Configura la statusline del equipo en el `~/.claude/settings.json` del usuario la primera vez. Es idempotente: si el usuario ya tiene una statusline propia no la toca, y si el plugin cambió de ruta al actualizarse, la corrige.
- **SessionStart**: corre `ponytail-defaults/install.js` (Node). Preconfigura el nivel por defecto del plugin `ponytail` (de terceros) en `"lite"` la primera vez, escribiendo `~/.config/ponytail/config.json`. Es idempotente: si el usuario ya tiene `PONYTAIL_DEFAULT_MODE` o un `defaultMode` propio, no lo toca.

## Candidatos futuros (no activos)

- **PostToolUse (Edit|Write)**: correr `npx eslint --fix` sobre archivos `.js`/`.vue` editados en repos con ESLint configurado.
- **PreToolUse (Bash)**: bloquear commits/push directos a ramas protegidas (`master`, `main`, `qa`).
- **UserPromptSubmit**: integración con indexadores de código (p.ej. codegraph) si el equipo lo adopta.

Para implementarlos: crear `hooks/hooks.json` siguiendo la doc oficial de plugins de Claude Code y subir la versión minor del plugin.

> Nota multiplataforma: cuando se implementen, los comandos de los hooks deben funcionar en Linux, macOS y Windows (usar `npx`/node en lugar de scripts bash específicos de un SO).
