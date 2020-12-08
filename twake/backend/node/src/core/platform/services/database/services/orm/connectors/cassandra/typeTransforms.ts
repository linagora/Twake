import { ColumnType } from "../../types";

export const cassandraType = {
  string: "TEXT",
  encrypted: "TEXT",
  json: "TEXT",
  number: "BIGINT",
  timeuuid: "TIMEUUID",
  uuid: "UUID",
  counter: "COUNTER",
  blob: "BLOB",
  boolean: "BOOLEAN",
};

export const transformValueToDbString = (v: any, type: ColumnType, options: any = {}) => {
  if (type === "uuid" || type === "timeuuid" || type === "number") {
    v = (v || "").replace(/[^a-zA-Z0-9-]/g, "");
    return `${v}`;
  }
  if (type === "boolean") {
    return `${!!v}`;
  }
  if (type === "encrypted" || type === "json") {
    if (type === "json") {
      v = JSON.stringify(v);
    }
    return `'${v || ""}'`; //Encryption not implemented yet
  }
  if (type === "blob") {
    return "''"; //Not implemented yet
  }
  return `'${v || ""}'`;
};

export const transformValueFromDbString = (v: any, type: string, options: any = {}) => {
  return v;
};
