import Collection from './Collection';
import Resource from './Resource';

export { default as Collection } from './Collection';
export { default as Resource } from './Resource';
export { default as EventEmitter } from './EventEmitter';

class Collections {
  private collections: { [key: string]: Collection<Resource<any>> } = {};

  public get<G extends Resource<any>, C extends Collection<G>>(
    path: string,
    type?: new (data: any) => G,
    existingCollectionCreator?: () => C,
  ): Collection<G> {
    let formattedPath = `/${path}/`.replace(new RegExp('//', 'g'), '/').toLocaleLowerCase();
    if (formattedPath !== path) {
      console.warn(`Collection path was not well formatted, needs: ${formattedPath} got ${path}`);
    }
    if (!this.collections[formattedPath]) {
      this.collections[formattedPath] = existingCollectionCreator
        ? existingCollectionCreator()
        : new Collection(formattedPath, type || Resource);
    }
    return this.collections[formattedPath] as Collection<G>;
  }
}

export default new Collections();
