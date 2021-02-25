import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { CryptoResult } from ".";

export default {
  encrypt,
  decrypt,
};

function encrypt(data: any, encryptionKey: any): CryptoResult {
  try {
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-cbc", encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()]).toString(
      "hex",
    );
    return {
      data: `${iv.toString("hex")}:${encrypted}`,
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
  const encryptedArray = data.split(":");
  
  if (!encryptedArray.length || encryptedArray.length !== 2) {
    return {
      data,
      done: false,
    };
  }

  const iv = Buffer.from(encryptedArray[0], "hex");
  const encrypted = Buffer.from(encryptedArray[1], "hex");
  const decipher = createDecipheriv("aes-256-cbc", encryptionKey, iv);
  const decrypt = JSON.parse(
    Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(),
  );
  return {
    data: decrypt,
    done: true,
  };
}
