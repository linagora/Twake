import { Prefix, TwakeService } from "../../core/platform/framework";

@Prefix("/internal/services/online/v1")
export default class OnlineService extends TwakeService<undefined> {
  version = "1";
  name = "online";

  api(): undefined {
    return undefined;
  }

  public async doInit(): Promise<this> {
    return this;
  }
}
