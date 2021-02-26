import { eventBus } from "../bus";

/* eslint-disable @typescript-eslint/no-explicit-any */
const METADATA_NAME = "pubsub:parameter";

/**
 * Methods decorated with this decorator will publish message defined by the PubsubParameter annotated parameters
 *
 * @param topic The topic to push the data to
 * @param data The default data to publish in the topic. This message will be enriched and overrided by the @PubsubParameter values
 */
export function PubsubPublish(topic: string, data: { [id: string]: any } = {}): MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor): void {
    const fields: Map<number, string> =
      Reflect.getOwnMetadata(`${METADATA_NAME}:${String(propertyKey)}`, target) ||
      new Map<number, string>();

    if (fields.size === 0) {
      return;
    }

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      fields.forEach((value, index) => {
        data[value] = args[index];
      });

      eventBus.publish({
        data,
        topic,
      });

      return await originalMethod.apply(this, args);
    };
  };
}

/**
 * Defines parameters of the function to be used as pubsub message data
 *
 * @param parameterName the name to be used as property name in the pubsub message data
 */
export function PubsubParameter(parameterName: string): ParameterDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (target: Object, propertyKey: string | symbol, parameterIndex: number): void {
    const fields: Map<number, string> =
      Reflect.getOwnMetadata(`${METADATA_NAME}:${String(propertyKey)}`, target) ||
      new Map<number, string>();

    fields.set(parameterIndex, parameterName);
    Reflect.defineMetadata(`${METADATA_NAME}:${String(propertyKey)}`, fields, target);
  };
}
