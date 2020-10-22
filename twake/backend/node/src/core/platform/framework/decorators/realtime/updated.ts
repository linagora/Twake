import { PathResolver, getPath } from "..";
import { UpdateResult } from "../../api/crud-service";
import { eventBus, RealtimeEntityEvent, RealtimeEntityActionType } from "../../realtime";

/**
 *
 * @param path the path to push the notification to
 * @param resourcePath the path of the resource itself
 */
export function RealtimeUpdated<T>(path: string | PathResolver<T>, resourcePath?: string | PathResolver<T>): MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(target: Object, propertyKey: string, descriptor: PropertyDescriptor ): void {
    const originalMethod = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function(...args: any[]) {
      const result: UpdateResult<T> = await originalMethod.apply(this, args);

      if (!(result instanceof UpdateResult)) {
        return result;
      }

      eventBus.publish<T>(RealtimeEntityActionType.Updated, {
        type: result.type,
        path: getPath(path, result),
        resourcePath: getPath(resourcePath, result),
        entity: result.entity,
        result
      } as RealtimeEntityEvent<T>);

      return result;
    };
  };
}
