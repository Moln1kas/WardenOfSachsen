import { createConsola } from "consola";
import { appendFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { stripVTControlCharacters } from "node:util";

const LOGS_DIR = "./logs";

if (!existsSync(LOGS_DIR)) {
  mkdirSync(LOGS_DIR, { recursive: true });
}
export const logger = createConsola({
  level: 3,
});

logger.addReporter({
  log: (logObj) => {
    const { type, args, date } = logObj;

    const rawMessage = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(" ");

    const cleanMessage = stripVTControlCharacters(rawMessage);
    
    const timestamp = date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const logLine = `[${timestamp}] [${type.toUpperCase()}] ${cleanMessage}`;

    const fileName = `${date.toISOString().split('T')[0]}.log`;
    const filePath = join(LOGS_DIR, fileName);

    try {
      appendFileSync(filePath, logLine + "\n", "utf-8");
    } catch (err) {
      console.error("CRITICAL: Failed to write to log file:", err);
    }
  }
});