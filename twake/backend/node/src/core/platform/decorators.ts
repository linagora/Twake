import { CONSUMES_METADATA, PREFIX_METADATA, SERVICENAME_METADATA } from "./constants";

export function ServiceName(name: string): ClassDecorator {
  return function(target: Object): void {
    if (name) {
      Reflect.defineMetadata(SERVICENAME_METADATA, name, target.prototype);
    }
  };
}

export function Consumes(services: string[] = []): ClassDecorator {
  return function(target: Object): void {
    Reflect.defineMetadata(CONSUMES_METADATA, services, target.prototype);
  };
}

export function Prefix(prefix: string = "/"): ClassDecorator {
  return function(target: Object): void {
    Reflect.defineMetadata(PREFIX_METADATA, prefix, target.prototype);
  };
}

