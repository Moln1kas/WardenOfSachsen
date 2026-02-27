import { spawn } from "bun";
import { join } from "path";
import { mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { logger } from "./logger";

const NUMBERS_DIR = join(process.cwd(), "assets", "numbers");
const MUSIC_DIR = join(process.cwd(), "assets", "music");
const TEMP_DIR = join(process.cwd(), "assets", "temp");

if (!existsSync(TEMP_DIR)) {
  await mkdir(TEMP_DIR, { recursive: true });
}

export const generateCaptchaVoice = async (digits: number[]): Promise<string> => {
  const outputPath = join(TEMP_DIR, `captcha_${Date.now()}.ogg`);
  const voiceInputs = digits.map(d => join(NUMBERS_DIR, `${d}.ogg`));

  let filter = "";
  let voiceLabels = "";
  
  voiceInputs.forEach((_, i) => {
    const tempo = (Math.random() * 0.2 + 0.9).toFixed(2); 
    const delay = i === 0 ? 0 : Math.floor(Math.random() * 300 + 200);

    filter += `[${i}:a]adelay=${delay}|${delay},atempo=${tempo}[v${i}];`;
    voiceLabels += `[v${i}]`;
  });

  filter += `${voiceLabels}concat=n=${voiceInputs.length}:v=0:a=1[vocal];`;

  filter += `anoisesrc=d=7:c=brown:a=0.03:r=48000[bg];`;

  filter += `[vocal][bg]amix=inputs=2:duration=first:weights=1 1,acrusher=level_in=1:level_out=1:bits=8:mode=log[out]`;

  const args = [
    "-y",
    ...voiceInputs.flatMap(input => ["-i", input]),
    "-filter_complex", filter,
    "-map", "[out]",
    "-c:a", "libopus",
    "-application", "voip",
    "-b:a", "6k",
    outputPath
  ];

  const proc = spawn({
    cmd: ["ffmpeg", ...args],
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text();
    logger.error("FFmpeg Args:", args.join(" "));
    throw new Error(`FFmpeg error (exit code ${exitCode}): ${error}`);
  }

  return outputPath;
}