export type EntityDefinition = {
  name: string;
  options: {
    primaryKey: (string | string[])[];
    ttl?: number;
  };
};

export type ColumnDefinition = {
  type: ColumnType;
  options: ColumnOptions;
};

export type ColumnOptions = {
  order: "ASC" | "DESC";
};

export type ColumnType =
  | "string"
  | "encrypted"
  | "number"
  | "timeuuid"
  | "uuid"
  | "counter"
  | "blob"
  | "boolean";
