/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { isBoolean, isNumber } from "lodash";
import { ColumnType } from "../../types";
import { decrypt, encrypt } from "../../utils";

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

type TransformOptions = any; //To complete

export const transformValueToDbString = (
  v: any,
  type: ColumnType,
  options: TransformOptions = {},
): string => {
  if (type === "number") {
    if (!isNumber(v)) {
      throw new Error(`'${v}' is not a ${type}`);
    }
    return `${v}`;
  }
  if (type === "uuid" || type === "timeuuid") {
    v = ((v || "") + "").replace(/[^a-zA-Z0-9-]/g, "");
    return `${v || "00000000-0000-4000-0000-000000000000"}`;
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
    v = encrypt(v, options.secret);
    return `'${(v || "").toString().replace(/'/gm, "''")}'`; //Encryption not implemented yet
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
    return `'${(v || "").toString().replace(/'/gm, "''")}'`;
  }
  return `'${(v || "").toString().replace(/'/gm, "''")}'`;
};

export const transformValueFromDbString = (
  v: any,
  type: string,
  options: TransformOptions = {},
): any => {
  if ((v !== null && type === "encoded_string") || type === "encoded_json") {
    try {
      v = decrypt(v, options.secret);
    } catch (err) {
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
  return v;
};
