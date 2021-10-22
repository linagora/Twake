// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { beforeAll, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "./setup";
import { DatabaseServiceAPI } from "../../src/core/platform/services/database/api";
import Repository from "../../src/core/platform/services/database/services/orm/repository/repository";
import { v1 as uuidv1 } from "uuid";
import { CounterAPI } from "../../src/core/platform/services/counter/types";
import {
  WorkspaceCounterEntity,
  WorkspaceCounterPrimaryKey,
} from "../../src/services/workspaces/entities/workspace_counters";
import { CounterProvider } from "../../src/core/platform/services/counter/provider";
import { Pagination } from "../../src/core/platform/framework/api/crud-service";

describe("Counters implementation", () => {
  let platform: TestPlatform;
  let database: DatabaseServiceAPI;
  let testCounterRepository: Repository<WorkspaceCounterEntity>;
  let workspaceCounter: CounterProvider;

  const workspaceId = uuidv1();

  const counterPk: WorkspaceCounterPrimaryKey = {
    id: workspaceId,
    counter_type: "members",
  };

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

    const counterApi: CounterAPI = platform.platform.getProvider<CounterAPI>("counter");
    expect(counterApi).toBeTruthy();

    const repo = await database.getRepository<WorkspaceCounterEntity>(
      "workspace_counters",
      WorkspaceCounterEntity,
    );

    workspaceCounter = counterApi.getCounter<WorkspaceCounterEntity>(repo);

    workspaceCounter.reviseCounter(async (pk: WorkspaceCounterPrimaryKey) => {
      return Promise.resolve(5); // fake value
    }, 4);

    expect(workspaceCounter).toBeTruthy();

    ends();
  });

  afterAll(done => {
    platform.tearDown().then(done);
  });

  it("Initializing empty value", async done => {
    await workspaceCounter.increase(counterPk, 0);
    const val = await workspaceCounter.get(counterPk);
    expect(val).toEqual(0);
    done();
  });

  it("Adding value", async done => {
    // adding 1

    await workspaceCounter.increase(counterPk, 1);
    let val = await workspaceCounter.get(counterPk);
    expect(val).toEqual(1);

    // adding 2

    await workspaceCounter.increase(counterPk, 2);
    val = await workspaceCounter.get(counterPk);
    expect(val).toEqual(3);

    done();
  });

  it("Subtracting value", async done => {
    // Subtracting 2

    await workspaceCounter.increase(counterPk, -2);
    let val = await workspaceCounter.get(counterPk);
    expect(val).toEqual(1);

    // Subtracting 10

    await workspaceCounter.increase(counterPk, -10);
    val = await workspaceCounter.get(counterPk);
    expect(val).toEqual(-9);

    done();
  });

  it("Revising counter", async done => {
    // Subtracting 2

    await workspaceCounter.increase(counterPk, 1);
    const val = await workspaceCounter.get(counterPk);
    expect(val).toEqual(5); // fake value from revise function

    done();
  });
});
