import Logger from 'services/Logger';
import Collections from '../Collections';
import Transport from './Transport';

const logger = Logger.getLogger('Collections/Transport/HTTP');

type HTTPMethod = 'post' | 'delete' | 'get' | 'put';

export default class TransportHTTP {
  constructor(private readonly transport: Transport) {}

  private async request(method: HTTPMethod, route: string, options: any) {
    logger.debug(`${method.toUpperCase()} ${route}`);
    const prefix = Collections.getOptions().transport?.rest?.url;
    if (!prefix) {
      return { offline: true };
    }
    route = `${prefix}${route}`;

    const headers = {
      ...Collections.getOptions().transport?.rest?.headers,
      ...this.transport.apiOptions?.headers,
      ...options?.headers,
    };

    if (method === 'delete' || method === 'get') {
      delete headers['Content-Type'];
    }

    const response = await fetch(route, {
      method: method,
      headers: headers,
      body: options?.body,
    });
    if (response.status === 204) {
      return {};
    }
    return await response.json();
  }

  public async post(route: string, body: any, options: any = {}) {
    options.body = JSON.stringify(body);
    return await this.request('post', route, options);
  }

  public async get(route: string, options?: any) {
    return await this.request('get', route, options);
  }

  public async put(route: string, body: any, options: any = {}) {
    options.body = JSON.stringify(body);
    return await this.request('put', route, options);
  }

  public async delete(route: string, options?: any) {
    return await this.request('delete', route, options);
  }
}
