import { v4 as uuidv4 } from 'uuid';

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

  public get id(): string {
    return this._data.id || '';
  }

  public set id(id: string) {
    this._data.id = id;
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
}
