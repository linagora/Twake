import { v4 as uuidv4 } from "uuid";
import mimes from "./services/processing/mime";
import fs, { existsSync } from "fs";
import { unlink } from "fs/promises";

export function getTmpFile(): string {
  const targetDir = "/tmp/";
  fs.mkdirSync(targetDir, { recursive: true });
  return `${targetDir}${uuidv4()}`;
}

export function isFileType(fileMime: string, fileName: string, requiredExtensions: string[]): any {
  const extension = fileName.split(".").pop();
  const secondaryExtensions = Object.keys(mimes).filter(k => mimes[k] === fileMime);
  const fileExtensions = [extension, ...secondaryExtensions];
  return fileExtensions.some(e => requiredExtensions.includes(e));
}

export async function cleanFiles(paths: string[]) {
  for (const path of paths) {
    if (existsSync(path)) await unlink(path);
  }
}
