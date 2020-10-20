import { PathResolver, getPath } from "..";
import { CreateResult } from "../../api/crud-service";
import { eventBus } from "../../realtime";

export function RealtimeCreated<T>(path: string | PathResolver<T>): MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(target: Object, propertyKey: string, descriptor: PropertyDescriptor ): void {
    const originalMethod = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function(...args: any[]) {
      const result: CreateResult<T> = await originalMethod.apply(this, args);

      if (!(result instanceof CreateResult)) {
        return result;
      }

      eventBus.emit("entity:created", {
        path: getPath(path, result),
        entity: result.entity,
        result
      });

      return result;
    };
  };
}
