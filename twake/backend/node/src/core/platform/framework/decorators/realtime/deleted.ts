import { PathResolver } from "..";
import { eventBus } from "../../realtime";

export function RealtimeDeleted<T>(path: string | PathResolver<T>): MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(target: Object, propertyKey: string, descriptor: PropertyDescriptor ): void {
    const originalMethod = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function(...args: any[]) {
      const result = await originalMethod.apply(this, args);
      let computedPath;

      if (typeof path === "function") {
        computedPath = path(args[0]);
      } else {
        computedPath = path;
      }

      // check if resource has been deleted from result
      // if yes then send event
      eventBus.emit("entity:deleted", {
        path: computedPath,
        entity: args[0],
        result
      });

      return result;
    };
  };
}
