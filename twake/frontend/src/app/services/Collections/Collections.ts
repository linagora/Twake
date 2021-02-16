import { assign } from 'lodash';
import Logger from 'services/Logger';
import Collection, { CollectionOptions } from './Collection';
import Resource from './Resource';
import Transport from './Transport/Transport';
import { clearCurrentDatabase } from './Storage';

export { default as Collection } from './Collection';
export { default as Resource } from './Resource';
export { default as EventEmitter } from './EventEmitter';

type Options = {
  storageKey?: string;
  transport?: {
    rest?: {
      url?: string; //Rest API prefix, like http://localhost:8000/internal
      headers?: { [key: string]: string };
    };
    socket?: {
      url?: string; //Socket API, like http://localhost:8000/internal/sockets
      authenticate?: () => Promise<any>;
    };
  };
};

const logger = Logger.getLogger('Collections');

class Collections {
  private collections: { [key: string]: Collection<Resource<any>> } = {};
  private options: Options = { transport: {}, storageKey: 'none' };
  protected transport: Transport = new Transport();
  private started: boolean = false;

  public setOptions(options: Options) {
    this.options = assign(this.options, options);
  }

  public getOptions(): Options {
    return this.options;
  }

  public connect(options?: Options) {
    options && this.setOptions(options);
    this.transport.connect();
    this.started = true;
  }

  public getTransport() {
    return this.transport;
  }

  public clear(): void {
    logger.debug('Clearing collections');
    clearCurrentDatabase();
  }

  public get<R extends Resource<any>, C extends Collection<R>>(
    path: string,
    type?: new (data: any) => R,
    existingCollectionCreator?: () => C,
    options?: CollectionOptions,
  ): Collection<R> {
    if (!this.started) {
      logger.error(`Try to init ${path} collection before Collections started!`);
      throw `Try to init ${path} collection before Collections started!`;
    }

    options = options || {};

    const parts = path.split('::');
    path = parts[0];
    options.tag = parts[1] || options?.tag || '';

    let formattedPath = `/${path}/`.replace(new RegExp('//', 'g'), '/').toLocaleLowerCase();
    if (formattedPath !== path) {
      logger.warn(`Collection path was not well formatted, needs: ${formattedPath} got ${path}`);
    }

    const key = formattedPath + '::' + options.tag;

    options.storageKey = this.options.storageKey || '';

    if (!this.collections[key]) {
      logger.debug(`Create collection ${path}`);
      this.collections[key] = existingCollectionCreator
        ? existingCollectionCreator()
        : new Collection(formattedPath, type || Resource, options);
      this.collections[key].setOptions(options);
    }

    return this.collections[key] as Collection<R>;
  }
}

const collections = new Collections();
(window as any).Collections = collections;

export default collections;
