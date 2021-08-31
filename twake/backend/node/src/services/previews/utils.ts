import { v4 as uuidv4 } from "uuid";
import mimes from "./services/processing/mime";

export function getTmpFile() {
  return `/tmp/${uuidv4()}`;
}

export function isFileType(fileMime: string, fileName: string, requiredExtensions: string[]): any {
  const extension = fileName.split(".").pop(); //filenameToExtension(fileName);
  const secondaryExtensions = Object.keys(mimes).filter(k => mimes[k] === fileMime);
  const fileExtensions = [extension, ...secondaryExtensions];
  return fileExtensions.some(e => requiredExtensions.includes(e));
}
