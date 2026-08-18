#!/usr/bin/env node
// Instalador de la statusline del plugin smk-tcc. Corre en cada SessionStart.
//
// - Si el usuario NO tiene `statusLine` en ~/.claude/settings.json → la
//   configura apuntando al statusline.js del plugin.
// - Si ya tiene una statusline PROPIA (que no es la del plugin) → no la toca.
// - Si tiene la del plugin pero la ruta cambió (p.ej. el plugin se movió al
//   actualizarse) → corrige la ruta.
//
// Nunca lanza errores: un fallo aquí no debe romper el arranque de la sesión.

const fs = require("fs");
const os = require("os");
const path = require("path");

// Marcador que identifica un comando de statusline instalado por este plugin
const PLUGIN_COMMAND_MARKER = /smk-tcc[\\/].*statusline\.js/;

function main() {
  const settingsPath = path.join(os.homedir(), ".claude", "settings.json");
  const statuslineScriptPath = path.join(__dirname, "statusline.js");
  const desiredCommand = `node "${statuslineScriptPath}"`;

  let settings = {};
  if (fs.existsSync(settingsPath)) {
    const rawSettings = fs.readFileSync(settingsPath, "utf8");
    try {
      settings = JSON.parse(rawSettings);
    } catch {
      // settings.json ilegible: no arriesgarse a pisarlo
      return;
    }
  }

  const existingStatusLine = settings.statusLine;
  if (existingStatusLine) {
    const existingCommand = existingStatusLine.command || "";
    const isPluginStatusline = PLUGIN_COMMAND_MARKER.test(existingCommand);
    if (!isPluginStatusline) return; // statusline propia del usuario: respetarla
    if (existingCommand === desiredCommand) return; // ya está al día
  }

  settings.statusLine = { type: "command", command: desiredCommand };
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
  console.log("smk-tcc: statusline del equipo configurada en ~/.claude/settings.json");
}

try {
  main();
} catch {
  // Silencioso a propósito: el hook no debe interrumpir la sesión
}
