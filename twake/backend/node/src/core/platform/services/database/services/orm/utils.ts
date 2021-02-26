import crypto, { randomBytes } from "crypto";
import _ from "lodash";
import { ColumnDefinition, EntityDefinition } from "./types";

export function getEntityDefinition(
  instance: any,
): {
  entityDefinition: EntityDefinition;
  columnsDefinition: { [name: string]: ColumnDefinition };
} {
  const entityConfituration = _.cloneDeep(instance.constructor.prototype._entity);
  const entityColumns = _.cloneDeep(instance.constructor.prototype._columns);
  return {
    entityDefinition: entityConfituration,
    columnsDefinition: entityColumns,
  };
}

export function unwrapPrimarykey(entityDefinition: EntityDefinition): string[] {
  const partitionKey = entityDefinition.options.primaryKey.shift();
  const primaryKey: string[] = [
    ...(typeof partitionKey === "string" ? [partitionKey] : partitionKey),
    ...(entityDefinition.options.primaryKey as string[]),
  ];
  return primaryKey;
}

export function encrypt(v: any, encryptionKey: any): string {
  try {
    const iv = randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(v)), cipher.final()]).toString(
      "hex",
    );
    return iv.toString("hex") + ":" + encrypted;
  } catch (err) {
    return v;
  }
}

export function decrypt(v: any, encryptionKey: any): any {
  const encryptedArray = v.split(":");
  const iv = Buffer.from(encryptedArray[0], "hex");
  const encrypted = Buffer.from(encryptedArray[1], "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", encryptionKey, iv);
  const decrypt = JSON.parse(
    Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(),
  );
  return decrypt;
}
