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
class Collections {
  private collections: { [key: string]: Collection<Resource<any>> } = {};
  private options: Options = { transport: {} };
  protected transport: Transport = new Transport();

  constructor() {
    (window as any).Collections = this;
  }

  public setOptions(options: Options) {
    this.options = _.merge(this.options, options);
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
    let formattedPath = `/${path}/`.replace(new RegExp('//', 'g'), '/').toLocaleLowerCase();
    if (formattedPath !== path) {
      console.warn(`Collection path was not well formatted, needs: ${formattedPath} got ${path}`);
    }

    let creation = false;

    if (!this.collections[formattedPath]) {
      creation = true;
      this.collections[formattedPath] = existingCollectionCreator
        ? existingCollectionCreator()
        : new Collection(formattedPath, type || Resource, options);
    }

    return this.collections[formattedPath] as Collection<G>;
  }
}

export default new Collections();
