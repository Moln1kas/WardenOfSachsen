import { spawn } from "bun";
import { join } from "path";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const NUMBERS_DIR = join(process.cwd(), "assets", "numbers");
const TEMP_DIR = join(process.cwd(), "assets", "temp");

if (!existsSync(TEMP_DIR)) {
  await mkdir(TEMP_DIR, { recursive: true });
}

export const generateCaptchaVoice = async (digits: number[]): Promise<string> => {
  const outputPath = join(TEMP_DIR, `captcha_${Date.now()}.ogg`);
  const inputs = digits.map(d => join(NUMBERS_DIR, `${d}.ogg`));

  let delays = "";
  let labels = "";
  
  inputs.forEach((_, i) => {
    const ms = i === 0 ? 0 : Math.floor(Math.random() * 300 + 400);
    delays += `[${i}:a]adelay=${ms}|${ms}[a${i}];`;
    labels += `[a${i}]`;
  });

  const filterComplex = `${delays}${labels}concat=n=${inputs.length}:v=0:a=1[out]`;

  const args = [
    "-y",
    ...inputs.flatMap(input => ["-i", input]),
    "-filter_complex", filterComplex,
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
    throw new Error(`FFmpeg error (exit code ${exitCode}): ${error}`);
  }

  return outputPath;
}