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
  
  const musicId = Math.floor(Math.random() * 3);
  const bgMusicPath = join(MUSIC_DIR, `${musicId}.ogg`);

  let filter = "";
  let voiceLabels = "";
  
  voiceInputs.forEach((_, i) => {
    const tempo = (Math.random() * 0.3 + 0.85).toFixed(2); 
    const delay = i === 0 ? 0 : Math.floor(Math.random() * 400 + 300);

    filter += `[${i}:a]adelay=${delay}|${delay},atempo=${tempo},highpass=f=200[v${i}];`;
    voiceLabels += `[v${i}]`;
  });

  filter += `${voiceLabels}concat=n=${voiceInputs.length}:v=0:a=1,volume=0.3[vocal_pure];`;

  const bgIndex = voiceInputs.length;
  
  filter += `[${bgIndex}:a]volume=1.0,aphaser=type=t:speed=2[bg_dirty];`;

 filter += `[vocal_pure][bg_dirty]amix=inputs=2:duration=first:weights=1 1,compand=0.3|0.3:1|1:-90/-60|-60/-40|-40/-30|-20/-20:6:0:-90:0.2,alimiter=limit=0.9[out]`;

  const args = [
    "-y",
    ...voiceInputs.flatMap(input => ["-i", input]),
    "-ss", `${Math.floor(Math.random() * 40)}`,
    "-i", bgMusicPath,
    "-filter_complex", filter,
    "-map", "[out]",
    "-c:a", "libopus",
    "-b:a", "24k",
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