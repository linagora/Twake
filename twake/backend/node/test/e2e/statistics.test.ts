// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { beforeAll, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "./setup";
import { StatisticsAPI } from "../../src/core/platform/services/statistics/types";
import { StatisticsPrimaryKey } from "../../src/core/platform/services/statistics/entities/statistics";
import { v1 as uuidv1 } from "uuid";

describe("Statistics implementation", () => {
  let platform: TestPlatform;
  // let database: DatabaseServiceAPI;
  let statisticsAPI: StatisticsAPI;

  // const workspaceId = uuidv1();
  //
  // const counterPk: WorkspaceCounterPrimaryKey = {
  //   id: workspaceId,
  //   counter_type: "members",
  // };

  beforeAll(async ends => {
    platform = await init({
      services: ["database", "statistics", "webserver", "auth"],
    });

    // database = platform.platform.getProvider<DatabaseServiceAPI>("database");
    await platform.database.getConnector().drop();

    statisticsAPI = platform.platform.getProvider<StatisticsAPI>("statistics");
    expect(statisticsAPI).toBeTruthy();

    ends();
  });

  afterAll(done => {
    platform.tearDown().then(done);
  });

  it("Check statistics counters", async done => {
    await statisticsAPI.increase(platform.workspace.company_id, "test");
    await statisticsAPI.increase(platform.workspace.company_id, "test");
    const secondCompanyId = uuidv1();
    await statisticsAPI.increase(secondCompanyId, "test");
    await statisticsAPI.increase(secondCompanyId, "test");
    await statisticsAPI.increase(platform.workspace.company_id, "test2");

    expect(await statisticsAPI.get(platform.workspace.company_id, "test")).toEqual(2);
    expect(await statisticsAPI.get(secondCompanyId, "test")).toEqual(2);
    expect(await statisticsAPI.get(null, "test")).toEqual(4);

    expect(await statisticsAPI.get(platform.workspace.company_id, "test2")).toEqual(1);
    expect(await statisticsAPI.get(secondCompanyId, "test2")).toEqual(0);
    expect(await statisticsAPI.get(null, "test2")).toEqual(1);

    done();
  });
});
