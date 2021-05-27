import { TwakeService, logger, ServiceName } from "../../framework";
import { PushServiceAPI } from "./api";

@ServiceName("push")
export default class Push extends TwakeService<PushServiceAPI> {
  version = "1";
  name = "push";

  public async doInit(): Promise<this> {
    return this;
  }

  api(): PushServiceAPI {
    return this;
  }
}
