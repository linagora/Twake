import { Consumes, TwakeService } from "../../core/platform/framework";
import { StatisticsAPI } from "./types";
import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import StatisticsEntity, {
  getInstance as getStatisticsEntityInstance,
  TYPE as StatisticsEntityType,
} from "./entities/statistics";
import Repository from "../../core/platform/services/database/services/orm/repository/repository";

@Consumes(["database"])
export default class StatisticsService
  extends TwakeService<StatisticsAPI>
  implements StatisticsAPI
{
  name = "statistics";
  version = "1";
  private repository: Repository<StatisticsEntity>;
  private GLOBAL = "global";

  api(): StatisticsAPI {
    return this;
  }

  async doInit(): Promise<this> {
    const database = this.context.getProvider<DatabaseServiceAPI>("database");
    this.repository = await database.getRepository<StatisticsEntity>(
      StatisticsEntityType,
      StatisticsEntity,
    );
    return this;
  }

  async increase(companyId: string, eventName: string): Promise<unknown> {
    const now = new Date();
    const monthId = +(now.getFullYear() + now.getMonth().toString().padStart(2, "0")); // format 202108

    await this.dbIncrement(this.GLOBAL, eventName, monthId);
    await this.dbIncrement(this.GLOBAL, eventName, 0);
    await this.dbIncrement(companyId, eventName, monthId);
    await this.dbIncrement(companyId, eventName, 0);

    return null;
  }

  async get(companyId: string | null, eventName: string): Promise<number> {
    const res = await this.repository.findOne({
      company_id: companyId || this.GLOBAL,
      event_name: eventName,
      month_id: 0,
    });

    if (res) {
      return res.value;
    }
    return 0;
  }

  private dbIncrement(companyId: string, eventName: string, monthId: number): Promise<void> {
    const entity = getStatisticsEntityInstance({
      company_id: companyId,
      event_name: eventName,
      month_id: monthId,
    });

    entity.value = 1;

    return this.repository.save(entity);
  }
}
