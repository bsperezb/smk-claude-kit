# Hooks (futuro — no activos)

Este plugin NO instala hooks por ahora. Candidatos documentados para una versión futura:

- **PostToolUse (Edit|Write)**: correr `npx eslint --fix` sobre archivos `.js`/`.vue` editados en repos con ESLint configurado.
- **PreToolUse (Bash)**: bloquear commits/push directos a ramas protegidas (`master`, `main`, `qa`).
- **UserPromptSubmit**: integración con indexadores de código (p.ej. codegraph) si el equipo lo adopta.

Para implementarlos: crear `hooks/hooks.json` siguiendo la doc oficial de plugins de Claude Code y subir la versión minor del plugin.

> Nota multiplataforma: cuando se implementen, los comandos de los hooks deben funcionar en Linux, macOS y Windows (usar `npx`/node en lugar de scripts bash específicos de un SO).
