import { EntityDefinition } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Entity(name: string, options: any = {}): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (constructor: Function): void {
    const entityDefinition: EntityDefinition = {
      name,
      type: options.type || name,
      options,
    };
    constructor.prototype._entity = entityDefinition;
  };
}
