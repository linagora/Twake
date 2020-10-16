import { eventBus } from "../../realtime";

export function RealtimeUpdated(path: string): MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(target: Object, propertyKey: string, descriptor: PropertyDescriptor ): void {
    const originalMethod = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function(...args: any[]) {
      const result = await originalMethod.apply(this, args);

      eventBus.emit("entity:updated", {
        path,
        entity: args[0],
        result
      });

      return result;
    };
  };
}
