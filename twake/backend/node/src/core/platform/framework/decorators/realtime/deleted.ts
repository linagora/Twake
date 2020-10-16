import { eventBus } from "../../realtime";

export function RealtimeDeleted(path: string): MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(target: Object, propertyKey: string, descriptor: PropertyDescriptor ): void {
    const originalMethod = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function(...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // check if resource has been deleted from result
      // if yes then send event
      eventBus.emit("entity:deleted", {
        path,
        entity: args[0],
        result
      });

      return result;
    };
  };
}
