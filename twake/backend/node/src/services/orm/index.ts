import { ConnectionOptions } from "typeorm";
import { TwakeService } from "../../core/platform/framework";
import ORMServiceAPI from "./provider";
import ORMService from "./services";

export default class ORM extends TwakeService<ORMServiceAPI> {
  version = "1";
  name = "orm";
  service: ORMService;

  public async doInit(): Promise<this> {
    this.service = new ORMService();
    const configuration: ConnectionOptions = {
      ...this.configuration.get<ConnectionOptions>("connection"),
      ...{ entities: ["dist/**/*.entity{ .ts,.js}", "dist/**/entities/*{ .ts,.js}"] },
      ...{ subscribers: ["dist/**/entities/*subscriber*{ .ts,.js}"]}
    };

    await this.service.connect(configuration);

    return this;
  }

  api(): ORMServiceAPI {
    return this.service;
  }
}
