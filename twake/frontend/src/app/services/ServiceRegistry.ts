import Logger from 'services/Logger';
const logger = Logger.getLogger('TwakeServiceRegistry');

class ServiceRegistry {
  services: {[key: string]: any};

  constructor() {
    this.services = {};
  }

  register(name: string, service: any) {
    logger.debug('Register service', name, service);
    if (!service || !name) {
      return;
    }

    this.services[name] = service;
  }
}

export default new ServiceRegistry();