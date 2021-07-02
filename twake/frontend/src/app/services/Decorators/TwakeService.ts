import ServiceRegistry from 'services/ServiceRegistry';

export function TwakeService(name: string): ClassDecorator {
  return function DecoratedTwakeService(target: any): any {
    const originalConstrutor = target;

    const decorated: any = function (...args: any) {
      const newService = new originalConstrutor(...args);

      if (name) {
        ServiceRegistry.register(name, newService);
        console.log(ServiceRegistry.services);
      }
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
