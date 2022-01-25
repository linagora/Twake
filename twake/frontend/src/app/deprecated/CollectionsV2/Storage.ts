import _ from 'lodash';
import minimongo, { MinimongoDb } from 'minimongo';
import Logger from '../../features/global/services/logger-service';
import { v4 as uuidv4 } from 'uuid';

export type MongoItemType = {
  _state: any;
  [key: string]: any;
};

const logger = Logger.getLogger('Collections/Storage');

/**
 * Collection store API
 */
export interface CollectionStore {
  addCollection(type: string): { [id: string]: any };
  upsert(type: string, path: string, item: any): any;
  remove(type: string, path: string, item: any): any;
  clear(type: string, path: string): void;
  find(type: string, path: string, filters?: any, options?: any): any[];
  findOne(type: string, path: string, filters?: any, options?: any): any;
}

/**
 * This class is the link between minimongo and our Collections.
 * - It choose the right db to use
 * - It abstract the minimongo internal _id and try to not duplicates objects with same id
 */
export class CollectionStorage implements CollectionStore {
  private database: { [type: string]: { [id: string]: any } } = {};
  private frontIdToIdTransform: { [frontId: string]: string } = {};

  static miniMongoInstance: MinimongoDb;
  public mongoDb: MinimongoDb | null = null;

  constructor() {
    (window as any).storage = this;
  }

  addCollection(type: string) {
    this.database[type] = this.database[type] || {};
    return this.database[type];
  }

  upsert(type: string, path: string, item: any): any {
    item._primaryKey = item._primaryKey || item.id;

    if (!item._primaryKey) {
      logger.log('upsert: ', 'Every resources must contain an id', path, item);
      // eslint-disable-next-line no-throw-literal
      throw 'Every resources must contain an id';
    }

    const collection = this.addCollection(type);

    if (
      item._frontId &&
      this.frontIdToIdTransform[item._frontId] &&
      this.frontIdToIdTransform[item._frontId] !== item._primaryKey
    ) {
      const currentOne = collection[this.frontIdToIdTransform[item._frontId]];

      if (currentOne) {
        const paths = _.uniq([
          ...(currentOne?._paths || []),
          ...(collection[item._primaryKey]?._paths || []),
        ]);
        collection[item._primaryKey] = _.assign(collection[item._primaryKey], currentOne);
        collection[item._primaryKey]._paths = paths;
      }

      delete collection[this.frontIdToIdTransform[item._frontId]];
    }

    if (!item._frontId) {
      item._frontId = uuidv4();
    }

    collection[item._primaryKey] = collection[item._primaryKey] || {};

    collection[item._primaryKey] = _.cloneDeep(
      _.assign(collection[item._primaryKey] || {}, {
        ...item,
        _paths: collection[item._primaryKey]?._paths || [],
      }),
    );

    collection[item._primaryKey]._paths.indexOf(path) < 0 &&
      collection[item._primaryKey]._paths.push(path);

    this.frontIdToIdTransform[item._frontId] = item._primaryKey;

    return _.cloneDeep(collection[item._primaryKey]);
  }

  remove(type: string, path: string, item: any = {}): any {
    const collection = this.addCollection(type);
    const items = this.find(type, path, item);
    for (let item of items) {
      collection[item._primaryKey]._paths = item._paths.filter((p: string) => p !== path);
      if (!path || collection[item._primaryKey]._paths.length === 0) {
        item._primaryKey && collection[item._primaryKey] && delete collection[item._primaryKey];
      }
    }
    return true;
  }

  clear(type: string, path: string) {
    this.remove(type, path);
    if (!path) {
      delete this.database[type];
    }
  }

  find(type: string, path: string, filters: any = {}, options: any = {}): any[] {
    const collection = this.addCollection(type);
    if (filters._primaryKey) {
      return collection[filters._primaryKey] ? [_.cloneDeep(collection[filters._primaryKey])] : [];
    }

    return Object.values(collection)
      .filter(
        item =>
          Object.keys(filters).every(filter => item[filter] === filters[filter]) &&
          (!path || item._paths.indexOf(path) >= 0),
      )
      .map(e => _.cloneDeep(e));
  }

  findOne(type: string, path: string, filters: any = {}, options: any = {}): any {
    return this.find(type, path, filters, options)[0];
  }
}

const storages: { [key: string]: CollectionStorage } = {};

export default function getStore(key: string): CollectionStore {
  if (!key) {
    throw new Error('Storage key is not set');
  }

  if (storages[key]) {
    return storages[key];
  }

  cleanupOldDatabase(key);

  storages[key] = new CollectionStorage();
  getDB({ namespace: key }).then(mongoDb => {
    storages[key].mongoDb = mongoDb;
  });

  return storages[key];
}

export async function getDB(
  options: { namespace: string } = { namespace: 'twake' },
): Promise<MinimongoDb> {
  if (CollectionStorage.miniMongoInstance) {
    return CollectionStorage.miniMongoInstance;
  }

  return new Promise<MinimongoDb>(resolve => {
    if (isIndexedDBSupported()) {
      const mongo = new minimongo.IndexedDb(
        //@ts-ignore typescript doesn't find autoselectLocalDb even if it exists
        { namespace: options.namespace },
        () => {
          logger.debug('Mini Mongo is ready');
          resolve(mongo);
        },
        () => resolve(new minimongo.MemoryDb()),
      );
    } else {
      resolve(new minimongo.MemoryDb());
    }
  }).then((db: MinimongoDb) => {
    CollectionStorage.miniMongoInstance = db;

    return CollectionStorage.miniMongoInstance;
  });
}

export function clearCurrentDatabase(): void {
  const database = getExistingDatabase();
  removeDatabase(database);
}

function cleanupOldDatabase(userId: string): void {
  const database = getDBName(userId);
  const oldDatabase = getExistingDatabase();

  if (oldDatabase === database) {
    return;
  }

  saveDatabaseName(database);
  removeDatabase(oldDatabase);
}

function removeDatabase(name: string): void {
  if (!name || !isIndexedDBSupported()) {
    return;
  }

  if (window.indexedDB.deleteDatabase) {
    const req = window.indexedDB.deleteDatabase(name);

    req.onerror = () => logger.debug('Error while removing the DB', name);
    req.onblocked = () => logger.debug('DB removal is blocked', name);
    req.onsuccess = () => logger.debug('DB has been removed', name);
    req.onupgradeneeded = () => logger.debug('DB upgrade needed', name);
  }
}

function isIndexedDBSupported(): boolean {
  return 'indexedDB' in window;
}

function getExistingDatabase(): string {
  const database = window.localStorage.getItem('collections:db');
  return database ? JSON.parse(database) : '';
}

function saveDatabaseName(name: string) {
  window.localStorage.setItem('collections:db', JSON.stringify(name));
}

function getDBName(userId: string): string {
  return `IDBWrapper-minimongo_${userId}`;
}
