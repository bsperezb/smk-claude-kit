#!/usr/bin/env node
// Statusline del equipo SMK — lee el JSON que Claude Code pasa por stdin
// y pinta una línea con: dot "live", carpeta, modelo + effort, barra de
// contexto animada, tokens, duración de sesión y rate limits 5h/7d.
// Multiplataforma: solo requiere Node ≥ 18 (sin bash ni jq).

const path = require("path");

function readStdin() {
  return new Promise((resolve) => {
    let raw = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (raw += chunk));
    process.stdin.on("end", () => resolve(raw));
    process.stdin.on("error", () => resolve(""));
  });
}

function formatTokens(count) {
  if (count < 1000) return String(count);
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1000000).toFixed(1)}M`;
}

function formatDuration(durationMs) {
  const totalSeconds = Math.floor(durationMs / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  if (totalSeconds < 3600) return `${Math.floor(totalSeconds / 60)}m`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h${minutes}m`;
}

// "—" = sin ventana abierta (la API aún no envía resets_at) · "ya" = reset vencido
function formatReset(resetEpochSeconds, nowEpochSeconds) {
  if (!resetEpochSeconds || resetEpochSeconds <= 0) return "—";
  const secondsLeft = resetEpochSeconds - nowEpochSeconds;
  if (secondsLeft <= 0) return "ya";
  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  if (days > 0 && hours > 0) return `${days}d ${hours}h`;
  if (days > 0) return `${days}d`;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "<1m";
}

function formatModelName(modelId, modelDisplayName) {
  // claude-sonnet-4-7 → "Sonnet 4.7" · claude-fable-5 → "Fable 5"
  const versionedMatch = modelId.match(/claude-(opus|sonnet|haiku|fable)-(\d+)-(\d+)/);
  if (versionedMatch) {
    const family = versionedMatch[1][0].toUpperCase() + versionedMatch[1].slice(1);
    return `${family} ${versionedMatch[2]}.${versionedMatch[3]}`;
  }
  const singleVersionMatch = modelId.match(/claude-(opus|sonnet|haiku|fable)-(\d+)/);
  if (singleVersionMatch) {
    const family = singleVersionMatch[1][0].toUpperCase() + singleVersionMatch[1].slice(1);
    return `${family} ${singleVersionMatch[2]}`;
  }
  return modelDisplayName || "Claude";
}

function severityColor(usedPercentage) {
  if (usedPercentage > 85) return "\x1b[1;31m";
  if (usedPercentage > 60) return "\x1b[1;33m";
  return "\x1b[1;32m";
}

// Barra de 10 bloques con degradado verde→amarillo→rojo y shimmer animado
function buildContextBar(contextPercentage, animationFrame) {
  const barWidth = 10;
  let filledBlocks = Math.floor((contextPercentage * barWidth + 50) / 100);
  if (filledBlocks > barWidth) filledBlocks = barWidth;

  let bar = "";
  for (let blockIndex = 0; blockIndex < barWidth; blockIndex++) {
    const blockCenterPercentage = (2 * blockIndex + 1) * 5; // 5, 15, 25… 95
    let red;
    let green;
    if (blockCenterPercentage <= 50) {
      red = Math.floor((blockCenterPercentage * 255) / 50);
      green = 255;
    } else {
      red = 255;
      green = Math.floor(((100 - blockCenterPercentage) * 255) / 50);
    }

    if (blockIndex < filledBlocks) {
      if (blockIndex === animationFrame) {
        // Shimmer: el bloque en la posición de la animación gana brillo
        const brightRed = Math.floor((red + 255) / 2);
        const brightGreen = Math.floor((green + 255) / 2);
        bar += `\x1b[1m\x1b[38;2;${brightRed};${brightGreen};200m█\x1b[22m`;
      } else {
        bar += `\x1b[38;2;${red};${green};0m█`;
      }
    } else if (blockIndex === animationFrame) {
      // Traza tenue del shimmer al pasar por bloques vacíos
      bar += "\x1b[38;2;110;110;110m█";
    } else {
      bar += "\x1b[38;2;60;60;60m█";
    }
  }
  return bar + "\x1b[0m";
}

// Dot "live" pulsante (breathing verde, 4 frames)
function buildLiveDot(pulseFrame) {
  const pulseFrames = [
    "\x1b[38;2;40;170;80m●\x1b[0m",
    "\x1b[38;2;80;215;120m●\x1b[0m",
    "\x1b[1m\x1b[38;2;140;255;180m●\x1b[22m\x1b[0m",
    "\x1b[38;2;80;215;120m●\x1b[0m",
  ];
  return pulseFrames[pulseFrame];
}

async function main() {
  let statusInput = {};
  try {
    statusInput = JSON.parse(await readStdin());
  } catch {
    // Sin datos válidos: se pinta con valores por defecto
  }

  // Frames de animación (1 Hz, basados en epoch — sin polling)
  const nowEpochSeconds = Math.floor(Date.now() / 1000);
  const animationFrame = nowEpochSeconds % 13; // 0..12: 10 bloques + pausa
  const pulseFrame = nowEpochSeconds % 4;

  const modelId = statusInput.model?.id || "";
  const modelDisplayName = statusInput.model?.display_name || "";
  const modelName = formatModelName(modelId, modelDisplayName);
  const effort = statusInput.output_config?.effort || "med";

  const currentDir = statusInput.workspace?.current_dir || statusInput.cwd || "";
  const folderName = path.basename(currentDir) || "~";

  const contextPercentage = Math.floor(statusInput.context_window?.used_percentage || 0);
  const inputTokens = statusInput.context_window?.total_input_tokens || 0;
  const outputTokens = statusInput.context_window?.total_output_tokens || 0;
  const totalTokensFormatted = formatTokens(inputTokens + outputTokens);

  const sessionDuration = formatDuration(statusInput.cost?.total_duration_ms || 0);

  const fiveHourUsed = Math.floor(statusInput.rate_limits?.five_hour?.used_percentage || 0);
  const fiveHourReset = formatReset(statusInput.rate_limits?.five_hour?.resets_at || 0, nowEpochSeconds);
  const sevenDayUsed = Math.floor(statusInput.rate_limits?.seven_day?.used_percentage || 0);
  const sevenDayReset = formatReset(statusInput.rate_limits?.seven_day?.resets_at || 0, nowEpochSeconds);

  const contextBar = buildContextBar(contextPercentage, animationFrame);
  const liveDot = buildLiveDot(pulseFrame);
  const fiveHourColor = severityColor(fiveHourUsed);
  const sevenDayColor = severityColor(sevenDayUsed);
  const reset = "\x1b[0m";

  process.stdout.write(
    `${liveDot} 📁 ${folderName} │ 🤖 ${modelName} (${effort}) │ ${contextBar} ${contextPercentage}% │ ` +
      `🔢 ${totalTokensFormatted} │ ⏱ ${sessionDuration} │ ` +
      `📊 Ventana 5h: ${fiveHourColor}${fiveHourUsed}%${reset} (reset en ${fiveHourReset}) · ` +
      `Semana: ${sevenDayColor}${sevenDayUsed}%${reset} (reset en ${sevenDayReset})\n`
  );
}

main();
