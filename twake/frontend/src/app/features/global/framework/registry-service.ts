class ServiceRegistry {
  services: { [key: string]: any };

  constructor() {
    this.services = {};
  }

  register(name: string, service: any) {
    if (!service || !name) {
      return;
    }

    this.services[name] = service;
  }
}

export default new ServiceRegistry();
