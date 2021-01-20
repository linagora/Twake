
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { isBoolean, isNumber } from "lodash";
import { ColumnType } from "../../types";
import crypto, { randomBytes } from 'crypto' 

export const cassandraType = {
  encoded_string: "TEXT",
  encoded_json: "TEXT",
  string: "TEXT",
  json: "TEXT",
  number: "BIGINT",
  timeuuid: "TIMEUUID",
  uuid: "UUID",
  counter: "COUNTER",
  blob: "BLOB",
  boolean: "BOOLEAN",
};

const encryptionKey = randomBytes(32);

export const transformValueToDbString = (v: any, type: ColumnType, options: any = {}): string => {
  if (type === "number") {
    if (!isNumber(v)) {
      throw new Error(`'${v}' is not a ${type}`);
    }
    return `${v}`;
  }
  if (type === "uuid" || type === "timeuuid") {
    v = (v || "").replace(/[^a-zA-Z0-9-]/g, "");
    return `${v}`;
  }
  if (type === "boolean") {
    if (!isBoolean(v)) {
      throw new Error(`'${v}' is not a ${type}`);
    }
    return `${!!v}`;
  }
  if (type === "encoded_string" || type === "encoded_json") {
    if (type === "encoded_json") {
      try {
        v = JSON.stringify(v);
      } catch (err) {
        v = null;
      }
    }
    v = encrypting(v);
    return `'${v || ""}'`;
  }
  if (type === "blob") {
    return "''"; //Not implemented yet
  }
  if (type === "string" || type === "json") {
    if (type === "json") {
      try {
        v = JSON.stringify(v);
      } catch (err) {
        v = null;
      }
    }
    return `'${v}'`; //Not implemented yet
  }
  return `'${v || ""}'`;
};

export const transformValueFromDbString = (v: any, type: string, options: any = {}): any => {
  if (v !== null && type === "encoded_string" || type === "encoded_json"){
    try{
      v = decrypting(v);
    }catch(err){
      v = v;
    }
    if (type === "encoded_json") {
      try {
        return JSON.parse(v);
      } catch (err) {
        return null;
      }
    }
  }
  if (type === "json") {
    try {
      return JSON.parse(v);
    } catch (err) {
      return null;
    }
  }
  return v
};

export function encrypting (v: any ): string {
  const iv = randomBytes(16);
    var encrypt = ((val: any) => {
      const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
      return Buffer.concat([
        cipher.update(JSON.stringify(val)),
        cipher.final()
      ]).toString('hex');
    });
  return (iv.toString('hex') + ":" + encrypt(v))
}

export function decrypting (v: any): any {
  var decrypt = ((val: string) => {
    const encryptedArray = val.split(':');
    const iv = Buffer.from(encryptedArray[0], 'hex');
    const encrypted = Buffer.from(encryptedArray[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
    return JSON.parse(Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString());
  });
  return decrypt(v)
}
