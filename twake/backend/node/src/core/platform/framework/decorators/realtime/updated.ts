import { PathResolver, getPath } from "..";
import { UpdateResult } from "../../api/crud-service";
import { eventBus } from "../../realtime";

export function RealtimeUpdated<T>(path: string | PathResolver<T>): MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(target: Object, propertyKey: string, descriptor: PropertyDescriptor ): void {
    const originalMethod = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function(...args: any[]) {
      const result: UpdateResult<T> = await originalMethod.apply(this, args);

      if (!(result instanceof UpdateResult)) {
        return result;
      }

      eventBus.emit("entity:updated", {
        path: getPath(path, result),
        entity: result.entity,
        result
      });

      return result;
    };
  };
}
