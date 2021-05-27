import { ColumnType } from "../../types";
import { decrypt, encrypt } from "../../../../../../../crypto";
import _, { isNull } from "lodash";
import uuidTime from "uuid-time";
import { mongoUuidv1 } from "../../utils";

export const transformValueToDbString = (v: any, type: ColumnType, options: any = {}): any => {
  if (type === "timeuuid") {
    if (isNull(v) || !v) {
      return null;
    }
    //Convert to orderable number on mongodb
    return uuidTime.v1(v);
  }
  if (type === "encoded_string" || type === "encoded_json") {
    if (type === "encoded_json") {
      try {
        v = JSON.stringify(v);
      } catch (err) {
        v = null;
      }
    }
    if (v !== undefined) {
      v = encrypt(v, options.secret).data;
    }
    return v;
  }
  if (type === "blob") {
    return ""; //Not implemented yet
  }
  if (type === "string" || type === "json") {
    if (type === "json") {
      try {
        v = JSON.stringify(v);
      } catch (err) {
        v = null;
      }
    }
    return v;
  }
  return v || "";
};

export const transformValueFromDbString = (v: any, type: string, options: any = {}): any => {
  if (type === "timeuuid") {
    return mongoUuidv1(v);
  }
  if (v !== null && (type === "encoded_string" || type === "encoded_json")) {
    try {
      v = decrypt(v, options.secret).data;
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
