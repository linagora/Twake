import Logger from "services/Logger";
import Collection, { CollectionOptions } from './Collection';
import Resource from './Resource';
import Transport from './Transport/Transport';
import _ from 'lodash';

export { default as Collection } from './Collection';
export { default as Resource } from './Resource';
export { default as EventEmitter } from './EventEmitter';

type Options = {
  transport?: {
    rest?: {
      url?: string; //Rest API prefix, like http://localhost:8000/internal
      headers?: { [key: string]: string };
    };
    socket?: {
      url?: string; //Socket API, like http://localhost:8000/internal/sockets
      authenticate?: any;
    };
  };
};

const logger = Logger.getLogger("Collections");

class Collections {
  private collections: { [key: string]: Collection<Resource<any>> } = {};
  private options: Options = { transport: {} };
  protected transport: Transport = new Transport();

  constructor() {
    (window as any).Collections = this;
  }

  public setOptions(options: Options) {
    this.options = _.assign(this.options, options);
  }

  public getOptions(): Options {
    return this.options;
  }

  public connect(options?: Options) {
    if (options) this.setOptions(options);
    this.transport.connect();
  }

  public getTransport() {
    return this.transport;
  }

  public get<G extends Resource<any>, C extends Collection<G>>(
    path: string,
    type?: new (data: any) => G,
    existingCollectionCreator?: () => C,
    options?: CollectionOptions,
  ): Collection<G> {
    logger.debug(`Get collection ${path}`);
    options = options || {};

    const parts = path.split('::');
    path = parts[0];
    options.tag = parts[1] || options?.tag || '';

    let formattedPath = `/${path}/`.replace(new RegExp('//', 'g'), '/').toLocaleLowerCase();
    if (formattedPath !== path) {
      logger.warn(`Collection path was not well formatted, needs: ${formattedPath} got ${path}`);
    }

    let creation = false;
    let key = formattedPath + '::' + options.tag;

    if (!this.collections[key]) {
      creation = true;
      this.collections[key] = existingCollectionCreator
        ? existingCollectionCreator()
        : new Collection(formattedPath, type || Resource, options);
      this.collections[key].setOptions(options);
    }

    return this.collections[key] as Collection<G>;
  }
}

export default new Collections();
