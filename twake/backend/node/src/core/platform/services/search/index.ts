import { TwakeService, logger, ServiceName } from "../../framework";
import { SearchServiceAPI } from "./api";

@ServiceName("search")
export default class Search extends TwakeService<SearchServiceAPI> {
  version = "1";
  name = "push";

  public async doInit(): Promise<this> {
    return this;
  }

  api(): SearchServiceAPI {
    return this;
  }
}
