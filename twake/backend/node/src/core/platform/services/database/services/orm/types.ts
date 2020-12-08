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
  generator: ColumnType;
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
