/**
 * This represent a Resource.
 * Collections contain Resources.
 * Each resource contain an id and custom content, the id is always initiated with a tmp:uuidv4 string.
 * TODO: Resources will also contain a status (persited, from cache etc).
 */
export default class Resource<T> {
  private _data: T & { id?: string };

  constructor(data: T & { id?: string }) {
    this._data = { id: this.genId(), ...data };
  }

  private genId() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return 'tmp:' + s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  public get id(): string {
    return this._data.id || '';
  }

  public get data(): T & { id?: string } {
    return this._data;
  }

  public set data(data: T & { id?: string }) {
    this._data = data;
  }
}
