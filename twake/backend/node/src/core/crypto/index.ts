import legacy from "./legacy";
import v1 from "./v1";
import { createHash } from "crypto";

export type CryptoResult = {
  /**
   * Encrypted | Decrypted data if done, original data if not done due to error or not encrypted data to decrypt
   */
  data: any;
  /**
   * Is there an error while processing the input data?
   */
  err?: Error;
  /**
   * Did we encrypted | decrypted the data? true if yes.
   */
  done?: boolean;
};

export function decrypt(data: string, encryptionKey: string): CryptoResult {
  const result = legacy.decrypt(data, encryptionKey);
  if (result.done) {
    return result;
  }

  return result.done ? result : v1.decrypt(data, encryptionKey);
}

export function encrypt(value: any, encryptionKey: any): CryptoResult {
  return v1.encrypt(value, encryptionKey);
}

export function md5(value: string): string {
  return createHash("md5").update(value).digest("hex");
}
