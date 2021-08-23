// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { beforeAll, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "./setup";
import { DatabaseServiceAPI } from "../../src/core/platform/services/database/api";
import Repository from "../../src/core/platform/services/database/services/orm/repository/repository";
import { v1 as uuidv1 } from "uuid";
import CounterAPI from "../../src/core/platform/services/counter/provider";
import CounterProvider, { CounterType } from "../../src/core/platform/services/counter/types";
import { CounterEntity as WorkspaceCounterEntity } from "../../src/core/platform/services/counter/entities/workspace_counters";

describe("Counters implementation", () => {
  let platform: TestPlatform;
  let database: DatabaseServiceAPI;
  let testCounterRepository: Repository<TestCounterEntity>;
  let workspaceCounter: CounterProvider;

  const getDbData = (entityId: string, type: string) =>
    testCounterRepository.findOne({
      id: entityId,
      counter_type: type,
    });
  const workspaceId = uuidv1();

  beforeAll(async ends => {
    platform = await init({
      services: ["database", "pubsub", "webserver", "auth", "counter"],
    });

    database = platform.platform.getProvider<DatabaseServiceAPI>("database");
    await platform.database.getConnector().drop();

    testCounterRepository = await database.getRepository<WorkspaceCounterEntity>(
      "workspace_counters",
      WorkspaceCounterEntity,
    );

    const counterApi = platform.platform.getProvider<CounterAPI>("counter");
    expect(counterApi).toBeTruthy();
    // workspaceCounter = counterApi.getCounter(CounterType.WORKSPACE);
    workspaceCounter = counterApi.getCounter(CounterType.WORKSPACE);
    expect(workspaceCounter).toBeTruthy();

    ends();
  });

  afterAll(done => {
    platform.tearDown().then(done);
  });

  it("Initializing empty value", async done => {
    await workspaceCounter.increase(workspaceId, "members", 0);
    const dbData = await getDbData(workspaceId, "members");
    expect(dbData.value).toEqual(0);
    done();
  });

  it("Adding value", async done => {
    // adding 1

    await workspaceCounter.increase(workspaceId, "members", 1);
    let dbData = await getDbData(workspaceId, "members");
    expect(dbData.value).toEqual(1);

    // adding 2

    await workspaceCounter.increase(workspaceId, "members", 2);
    dbData = await getDbData(workspaceId, "members");
    expect(dbData.value).toEqual(3);

    done();
  });

  it("Subtracting value", async done => {
    // Subtracting 2

    await workspaceCounter.increase(workspaceId, "members", -2);
    let dbData = await getDbData(workspaceId, "members");
    expect(dbData.value).toEqual(1);

    // Subtracting 10

    await workspaceCounter.increase(workspaceId, "members", -10);
    dbData = await getDbData(workspaceId, "members");
    expect(dbData.value).toEqual(-9);

    done();
  });
});
