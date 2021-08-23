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
  private collections = new Map<string, Collection<Resource<any>>>();
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
      // eslint-disable-next-line no-throw-literal
      throw `Try to init ${path} collection before Collections started!`;
    }

    options = options || {};

    const parts = path.split('::');
    path = parts[0];
    options.tag = parts[1] || options?.tag || '';

    const formattedPath = `/${path}/`.replace(new RegExp('//', 'g'), '/').toLocaleLowerCase();
    const key = `${formattedPath}::${options.tag}`;
    if (formattedPath !== path) {
      logger.warn(`Collection path was not well formatted, needs: ${formattedPath} got ${path}`);
    }

    options.storageKey = this.options.storageKey || '';

    if (!this.collections.has(key)) {
      logger.debug(`Create collection ${path}`);
      const collection = (
        existingCollectionCreator
          ? existingCollectionCreator()
          : new Collection(formattedPath, type || Resource, options)
      ).setOptions(options);

      this.collections.set(key, collection);
    }

    return this.collections.get(key) as Collection<R>;
  }
}

const collections = new Collections();
(window as any).Collections = collections;

export default collections;
