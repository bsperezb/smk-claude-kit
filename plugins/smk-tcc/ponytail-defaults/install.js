#!/usr/bin/env node
// Preconfigura el nivel por defecto del plugin ponytail (de terceros) a "lite"
// para el equipo. Corre en cada SessionStart.
//
// - Si el usuario tiene PONYTAIL_DEFAULT_MODE seteado → no toca nada (el env
//   var siempre gana sobre el config file, según ponytail-config.js).
// - Si no tiene ~/.config/ponytail/config.json (o no tiene `defaultMode`) →
//   lo crea/completa con "lite".
// - Si ya tiene un `defaultMode` propio → no lo toca.
//
// Nunca lanza errores: un fallo aquí no debe romper el arranque de la sesión.

const fs = require("fs");
const os = require("os");
const path = require("path");

const TEAM_DEFAULT_MODE = "lite";
const RUNTIME_MODES = ["off", "lite", "full", "ultra"];

// Mismo cálculo de directorio que usa ponytail-config.js (getConfigDir).
function getPonytailConfigDir() {
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, "ponytail");
  }
  if (process.platform === "win32") {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
      "ponytail"
    );
  }
  return path.join(os.homedir(), ".config", "ponytail");
}

function main() {
  if (process.env.PONYTAIL_DEFAULT_MODE) return; // el usuario ya decidió vía env var

  const configPath = path.join(getPonytailConfigDir(), "config.json");

  let config = {};
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, "utf8").replace(/^﻿/, "");
    try {
      config = JSON.parse(raw);
    } catch {
      return; // config ilegible: no arriesgarse a pisarlo
    }
    if (config && RUNTIME_MODES.includes(String(config.defaultMode).toLowerCase())) {
      return; // el usuario ya tiene su propio nivel configurado
    }
  }

  config.defaultMode = TEAM_DEFAULT_MODE;
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  console.log(`smk-tcc: nivel por defecto de ponytail configurado en "${TEAM_DEFAULT_MODE}"`);
}

try {
  main();
} catch {
  // Silencioso a propósito: el hook no debe interrumpir la sesión
}
