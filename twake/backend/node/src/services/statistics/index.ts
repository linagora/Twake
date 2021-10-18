import { Consumes, TwakeService } from "../../core/platform/framework";
import { STATISTICS_GLOBAL_KEY, StatisticsAPI } from "./types";
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

  async increase(companyId: string, eventName: string, value: number = 1) {
    const now = new Date();
    const monthId = +(now.getFullYear() + now.getMonth().toString().padStart(2, "0")); // format 202108

    Promise.all([
      this.dbIncrement(STATISTICS_GLOBAL_KEY, eventName, monthId, value),
      this.dbIncrement(STATISTICS_GLOBAL_KEY, eventName, 0, value),
      this.dbIncrement(companyId, eventName, monthId, value),
      this.dbIncrement(companyId, eventName, 0, value),
    ]);
  }

  async get(companyId: string = STATISTICS_GLOBAL_KEY, eventName: string): Promise<number> {
    const res = await this.repository.findOne({
      company_id: companyId,
      event_name: eventName,
      month_id: 0,
    });

    return res?.value || 0;
  }

  private dbIncrement(
    companyId: string,
    eventName: string,
    monthId: number,
    value: number = 1,
  ): Promise<void> {
    const entity = getStatisticsEntityInstance({
      company_id: companyId,
      event_name: eventName,
      month_id: monthId,
    });

    entity.value = value;
    return this.repository.save(entity);
  }
}
