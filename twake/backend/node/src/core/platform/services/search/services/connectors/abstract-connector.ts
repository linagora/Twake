import { Connector } from ".";
import { ConnectionOptions, SearchType } from "..";

export abstract class AbstractConnector<T extends ConnectionOptions, SearchClient>
  implements Connector {
  constructor(protected type: SearchType, protected options: T) {}

  connect(): Promise<this> {
    throw new Error("Method not implemented.");
  }

  getOptions(): T {
    return this.options;
  }

  getType(): SearchType {
    return this.type;
  }
}
