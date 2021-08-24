import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { CryptoResult } from ".";

export default {
  encrypt,
  decrypt,
};

function encrypt(
  data: any,
  encryptionKey: any,
  options: { disableSalts?: boolean } = {},
): CryptoResult {
  const key = createHash("sha256").update(String(encryptionKey)).digest("hex").substr(0, 32);
  try {
    const iv = options.disableSalts ? "0000000000000000" : randomBytes(16);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()]).toString(
      "base64",
    );
    return {
      data: `${iv.toString("base64")}:${encrypted}`,
      done: true,
    };
  } catch (err) {
    return {
      err,
      data,
      done: false,
    };
  }
}

function decrypt(data: string, encryptionKey: any): CryptoResult {
  const key = createHash("sha256").update(String(encryptionKey)).digest("hex").substr(0, 32);

  const encryptedArray = data.split(":");

  if (!encryptedArray.length || encryptedArray.length !== 2) {
    return {
      data,
      done: false,
    };
  }

  let iv: Buffer | string = Buffer.from(encryptedArray[0], "base64");
  if (encryptedArray[0] === "0000000000000000") {
    iv = "0000000000000000";
  }

  try {
    const encrypted = Buffer.from(encryptedArray[1], "base64");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    const decrypt = JSON.parse(
      Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(),
    );
    return {
      data: decrypt,
      done: true,
    };
  } catch (err) {
    return {
      data,
      done: false,
    };
  }
}
