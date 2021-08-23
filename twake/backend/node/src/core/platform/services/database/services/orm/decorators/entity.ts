import { EntityDefinition } from "../types";

type EntityOption = {
  type?: string;
  ttl?: number;
  primaryKey: (string | string[])[];
  globalIndexes?: string[][];
  search?: {
    source: (entity: any) => any; //Should return an object that will be indexed
    shouldUpdate?: (entity: any) => any; //Should return an object that will be indexed
    index?: string; //Index name
    esMapping?: any; //Used for elasticsearch mappings
    mongoMapping?: any; //Used for elasticsearch mappings
  };
};

export function Entity(name: string, options: EntityOption): ClassDecorator {
  return function (constructor: Function): void {
    const entityDefinition: EntityDefinition = {
      name,
      type: options.type || name,
      options,
    };
    constructor.prototype._entity = entityDefinition;
  };
}
