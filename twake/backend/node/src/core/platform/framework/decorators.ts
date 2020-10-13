/* eslint-disable @typescript-eslint/ban-types */
import { CONSUMES_METADATA, PREFIX_METADATA, SERVICENAME_METADATA } from "./api/constants";

export function ServiceName(name: string): ClassDecorator {
  return function(target: Function): void {
    if (name) {
      Reflect.defineMetadata(SERVICENAME_METADATA, name, target.prototype);
    }
  };
}

export function Consumes(services: string[] = []): ClassDecorator {
  return function(target: Function): void {
    Reflect.defineMetadata(CONSUMES_METADATA, services, target.prototype);
  };
}

export function Prefix(prefix: string = "/"): ClassDecorator {
  return function(target: Function): void {
    Reflect.defineMetadata(PREFIX_METADATA, prefix, target.prototype);
  };
}

