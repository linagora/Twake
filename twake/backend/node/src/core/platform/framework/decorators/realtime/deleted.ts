import { PathResolver, getPath } from "..";
import { DeleteResult } from "../../api/crud-service";
import { eventBus } from "../../realtime";

export function RealtimeDeleted<T>(path: string | PathResolver<T>): MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(target: Object, propertyKey: string, descriptor: PropertyDescriptor ): void {
    const originalMethod = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function(...args: any[]) {
      const result: DeleteResult<T> = await originalMethod.apply(this, args);

      if (!(result instanceof DeleteResult)) {
        return result;
      }

      // check if resource has been deleted from result
      // if yes then send event
      result.deleted && eventBus.emit("entity:deleted", {
        path: getPath(path, result),
        entity: result.entity,
        result
      });

      return result;
    };
  };
}
