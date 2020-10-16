import { PathResolver } from "..";
import { eventBus } from "../../realtime";

export function RealtimeUpdated<T>(path: string | PathResolver<T>): MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(target: Object, propertyKey: string, descriptor: PropertyDescriptor ): void {
    const originalMethod = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function(...args: any[]) {
      const result = await originalMethod.apply(this, args);
      let computedPath;

      if (typeof path === "function") {
        computedPath = path(result);
      } else {
        computedPath = path;
      }

      eventBus.emit("entity:updated", {
        path: computedPath,
        entity: args[0],
        result
      });

      return result;
    };
  };
}
