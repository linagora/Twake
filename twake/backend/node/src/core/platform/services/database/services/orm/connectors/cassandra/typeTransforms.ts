/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { isBoolean, isInteger, isNull, isString, isUndefined } from "lodash";
import { ColumnOptions, ColumnType } from "../../types";
import { decrypt, encrypt } from "../../../../../../../crypto";
import { logger } from "../../../../../../../../core/platform/framework";

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
  twake_boolean: "TINYINT",
};

type TransformOptions = {
  secret?: any;
  columns?: ColumnOptions;
  column?: any;
};

export const transformValueToDbString = (
  v: any,
  type: ColumnType,
  options: TransformOptions = {},
): string => {
  if (type === "number") {
    if (isNull(v)) {
      return "null";
    }
    return `${parseInt(v)}`;
  }
  if (type === "uuid" || type === "timeuuid") {
    if (isNull(v)) {
      return "null";
    }

    v = (v || "").toString().replace(/[^a-zA-Z0-9-]/g, "");
    return `${v}`;
  }
  if (type === "boolean") {
    //Security to avoid string with "false" in it
    if (!isInteger(v) && !isBoolean(v) && !isNull(v) && !isUndefined(v)) {
      throw new Error(`'${v}' is not a ${type}`);
    }
    return `${!!v}`;
  }
  if (type === "twake_boolean") {
    if (!isBoolean(v)) {
      throw new Error(`'${v}' is not a ${type}`);
    }
    return v ? "1" : "0";
  }
  if (type === "encoded_string" || type === "encoded_json") {
    if (type === "encoded_json") {
      try {
        v = JSON.stringify(v);
      } catch (err) {
        v = null;
      }
    }
    const encrypted = encrypt(v, options.secret);
    return `'${(encrypted.data || "").toString().replace(/'/gm, "''")}'`;
  }
  if (type === "blob") {
    return "''"; //Not implemented yet
  }
  if (type === "string" || type === "json") {
    if (type === "json" && v !== null) {
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
  logger.trace(`Transform value %o of type ${type}`, v);

  if (v !== null && (type === "encoded_string" || type === "encoded_json")) {
    let decryptedValue: any;

    if (typeof v === "string" && v.trim() === "") {
      return v;
    }

    try {
      decryptedValue = decrypt(v, options.secret).data;
    } catch (err) {
      logger.debug({ err }, `Can not decrypt data %o of type ${type}`, v);

      decryptedValue = v;
    }

    if (type === "encoded_json") {
      try {
        decryptedValue = JSON.parse(decryptedValue);
      } catch (err) {
        logger.debug(
          { err },
          `Can not parse JSON from decrypted data %o of type ${type}`,
          decryptedValue,
        );
        decryptedValue = null;
      }
    }

    return decryptedValue;
  }

  if (type === "twake_boolean") {
    return Boolean(v);
  }

  if (type === "json") {
    try {
      return JSON.parse(v);
    } catch (err) {
      return null;
    }
  }
  if (type === "uuid") {
    return String(v);
  }
  if (type === "number") {
    return new Number(v).valueOf();
  }
  return v;
};
