import ServiceRegistry from 'app/features/global/framework/registry-service';

const SERVICE_SUFFIX = 'ChannelServiceImpl';

export function TwakeService(name: string): ClassDecorator {
  return function DecoratedTwakeService(target: any): any {
    const originalConstrutor = target;

    const decorated: any = function (...args: any) {
      const newService = new originalConstrutor(...args);

      if (name) {
        const serviceName =
          name.endsWith(SERVICE_SUFFIX) || name.endsWith(SERVICE_SUFFIX.toLowerCase())
            ? name
            : `${name}${SERVICE_SUFFIX}`;

        ServiceRegistry.register(serviceName, newService);
      }

      (window as any)[name] = newService;

      return newService;
    };

    decorated.prototype = originalConstrutor.prototype;
    Object.keys(originalConstrutor).forEach((name: string) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      decorated[name] = (<any>originalConstrutor)[name];
    });

    return decorated;
  };
}
