import { mkdirSync, existsSync, promises as fsPromise } from "fs";
import globalResolver from "../services/global-resolver";
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";

const { unlink } = fsPromise;

/**
 * Generates a random temporary file path
 *
 * @param {string} suffix - the file extension.
 * @returns {string} - the temporary file.
 */
export const getTmpFile = (suffix: string = ""): string => {
  const targetDir = "/tmp/";
  mkdirSync(targetDir, { recursive: true });
  return `${targetDir}${uuidv4()}${suffix}`;
};

/**
 * Removes files from disk
 *
 * @param {string[]} paths - the paths to be deleted.
 */
export const cleanFiles = async (paths: string[]): Promise<void> => {
  for (const path of paths) {
    if (existsSync(path)) await unlink(path);
  }
};

/**
 * Writes a File stream into a temporary file path
 *
 * @param {Readable} input - the input stream.
 * @param {string} extension - the file extension.
 * @returns {Promise<string>} - the generated file.
 */
export const writeToTemporaryFile = async (input: Readable, extension: string): Promise<string> => {
  try {
    const temporaryFilePath = getTmpFile(`.${extension}`);

    await globalResolver.platformServices.storage.write(temporaryFilePath, input);

    return temporaryFilePath;
  } catch (error) {
    console.debug(error);

    throw Error(error);
  }
};

/**
 * Reads a file from the disk
 *
 * @returns {Promise<Readable>} - the file readable stream.
 */
export const readFromTemporaryFile = async (path: string): Promise<Readable> => {
  return await globalResolver.platformServices.storage.read(path);
};
