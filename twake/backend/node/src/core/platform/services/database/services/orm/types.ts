import { Column } from "./decorators";

export class UpdatableEntity {
  @Column("updated_at", "number", { onUpsert: _ => new Date().getTime() })
  updated_at: number;

  @Column("created_at", "number", { onUpsert: d => d || new Date().getTime() })
  created_at: number;
}

export type EntityDefinition = {
  name: string;
  type: string;
  options: {
    primaryKey: (string | string[])[];
    ttl?: number;
    search?: {
      source: <Entity>(entity: Entity) => any; //Should return an object that will be indexed
      index?: string; //Index name
      mapping?: any; //Used for elasticsearch mappings
    };
  };
};

export type ColumnDefinition = {
  type: ColumnType;
  nodename: string;
  options: ColumnOptions;
};

export type ColumnOptions = {
  order?: "ASC" | "DESC";
  generator?: ColumnType;
  onUpsert?: (value: any) => any;
};

export type ColumnType =
  | "encoded_string"
  | "encoded_json"
  | "string"
  | "json"
  | "number"
  | "timeuuid"
  | "uuid"
  | "counter"
  | "blob"
  | "boolean"
  // backward compatibility
  | "twake_boolean";

export type EntityTarget<Entity> = ObjectType<Entity>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type ObjectType<T> = { new (): T } | Function;
