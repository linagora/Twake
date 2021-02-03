import { v4 as uuidv4 } from 'uuid';
import Collection from './Collection';

/**
 * This represent a Resource.
 * Collections contain Resources.
 * Each resource contain an id and custom content, the id is always initiated with a tmp:uuidv4 string.
 */

type ResourceState = {
  upToDate: boolean; //The object is up to date (got it from the backend or websocket, not from cache)
  persisted: boolean; //The object was persisted on the backend at least one time, and so no tmp id
  shared: boolean; //The object was persisted and got from websocket, that mean everyone else should have it
};
export default class Resource<T> {
  private _data: T & { id?: string };
  private _state: ResourceState;
  private _key: string = 'key:' + uuidv4();
  private _collection: any;

  protected _type: string = '';
  protected _resourcePrimaryKey: string[] = ['id'];
  protected _resourceIdKey: string = 'id';

  constructor(data: T & { id?: string }) {
    this._data = { id: this.genId(), ...data };
    this._state = {
      upToDate: false,
      persisted: false,
      shared: false,
    };
  }

  private genId() {
    return 'tmp:' + uuidv4();
  }

  public get type(): string {
    return this._type || '';
  }

  public get id(): string {
    return (this._data as any)[this._resourceIdKey] || this._data.id;
  }

  public set id(id: string) {
    (this._data as any)[this._resourceIdKey] = id;
  }

  public get key(): string {
    return this._key || '';
  }

  public get data(): T & { id?: string } {
    return this._data;
  }

  public set data(data: T & { id?: string }) {
    this._data = data;
  }

  public get state(): ResourceState {
    return this._state;
  }

  public set state(state: ResourceState) {
    this._state = state;
  }

  public getDataForRest() {
    return {
      ...this.data,
      _id: undefined,
      _frontId: undefined,
      _state: undefined,
      _paths: undefined,
      id: this.state.persisted ? this.id : undefined,
    };
  }

  public getDataForStorage() {
    return {
      ...this.data,
      _primaryKey: this.getPrimaryKey(),
      _state: this.state,
    };
  }

  public getPrimaryKey(): string {
    return this._resourcePrimaryKey.map(k => (this._data as any)[k]).join('+');
  }

  public getIdKey(): string {
    return this._resourceIdKey;
  }

  public setShared(state: boolean = true) {
    if (!this._state.shared && state) {
      this.setPersisted(); //If found from websocket, then it comes from the server
    }
    this._state.shared = state;
  }

  public setPersisted(state: boolean = true) {
    if (!this._state.persisted && state) {
      this.setUpToDate(); //If persisted then it is uptodate
    }
    this._state.persisted = state;
  }

  public setUpToDate(state: boolean = true) {
    this._state.upToDate = state;
  }

  public setCollection(collection: Collection<Resource<T>>) {
    this._collection = collection;
  }

  public async action(action: string, body: any) {
    return await this._collection.action(action, body, {
      onResourceId: this.id,
    });
  }
}
