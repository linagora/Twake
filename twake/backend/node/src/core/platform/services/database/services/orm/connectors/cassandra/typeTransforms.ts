
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { isBoolean, isNumber } from "lodash";
import { ColumnType } from "../../types";
import crypto, { createSecretKey, randomBytes } from 'crypto' 

export const cassandraType = {
  plainstring: "TEXT",
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
  if ( v !== null && type === "string" || type === "json" ) {
    if (type === "json") {
      try {
        v = JSON.stringify(v);
      } catch (err) {
        v = null;
      }
    }
    
    let iv = randomBytes(16);
    var encrypt = ((val: any) => {
      let cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
      return Buffer.concat([
        cipher.update(val),
        cipher.final()
      ]);
    });
    console.log("A ENCODER: ", v);
    console.log("TRUC STOCKEE EN BD: ",  iv.toString('hex') + ":" + encrypt(v).toString('hex'));
   
    return `'${  iv.toString('hex') + ":" + encrypt(v).toString('hex') || ""}'`;
  }
  if (type === "blob") {
    return "''"; //Not implemented yet
  }
  if (type === "plainstring") {
    return `'${v}'`; //Not implemented yet
  }
  return `'${v || ""}'`;
};

export const transformValueFromDbString = (v: any, type: string, options: any = {}): any => {
  if (type === "string" || type === "json" ){
    console.log("A DECODER: ", v);
    //let iv = v.substring(0,34);
    var decrypt = ((val: string) => {
      let encryptedArray = val.split(':');
      let iv = Buffer.from(encryptedArray[0], 'hex');
      let encrypted = Buffer.from(encryptedArray[1], 'hex');
      let decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
    });
    try{
      v = decrypt(v).toString();
    }catch(err){
      v = v; //No-op
    }
    console.log("DECODEE: ", v);

    if (type === "json") {
      try {
        return JSON.parse(v);
      } catch (err) {
        return null;
      }
    }
  }
  
  return v
};
