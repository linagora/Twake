// Store current value and the recoil setter if available
export default class ExtendedState<T> {
  map: Map<string, { set: Function; current: T }> = new Map();
  public setHandler(id: string, handler: Function, value: T) {
    this.map.set(id, { current: value, set: handler });
  }
  public set(id: string, current: T) {
    console.log('set ', id, ' to ', current);
    console.trace();
    const setter = this.map.get(id)?.set || ((_: T) => {});
    this.map.set(id, {
      current,
      set: setter,
    });
    setter(current);
  }
  public get(id: string) {
    return this.map.get(id)?.current;
  }
}
