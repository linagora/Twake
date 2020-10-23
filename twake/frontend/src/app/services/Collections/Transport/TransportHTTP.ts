import Collections, { Collection, Resource } from '../Collections';
import Transport from './Transport';

export default class TransportHTTP {
  constructor(private readonly transport: Transport) {}

  private async request(method: string, route: string, options: any) {
    route = Collections.getOptions().transport?.rest?.url + route;

    const response = await fetch(route, {
      method: method,
      headers: {
        ...Collections.getOptions().transport?.rest?.headers,
        ...this.transport.apiOptions?.headers,
        ...options?.headers,
      },
      body: options?.body,
    });
    if ([200, 201, 204].indexOf(response.status) >= 0) {
      //Request succeeded
      return await response.json();
    } else {
      throw response;
    }
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
