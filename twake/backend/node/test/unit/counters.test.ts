import { beforeAll, describe, expect, it, jest } from "@jest/globals";
import { init, TestPlatform } from "../e2e/setup";
import { platform } from "os";
import { DatabaseServiceAPI } from "../../src/core/platform/services/database/api";
import WorkspaceCounter, {
  TYPE as WorkspaceCounterType,
  WorkspaceCounterPrimaryKey,
  getInstance as getWorkspaceCounterInstance,
} from "../../src/services/workspaces/entities/workspace_counters";
import Repository from "../../src/core/platform/services/database/services/orm/repository/repository";
import { v1 as uuidv1 } from "uuid";
import { merge } from "lodash";

describe("Counters implementation", () => {
  let platform: TestPlatform;
  let database: DatabaseServiceAPI;
  let workspaceCounterRepository: Repository<WorkspaceCounter>;

  const workspaceCounterPrimaryKey: WorkspaceCounterPrimaryKey = {
    company_id: uuidv1(),
    workspace_id: uuidv1(),
    counter_type: "members",
  };

  beforeAll(async ends => {
    platform = await init({
      services: ["database", "pubsub", "webserver", "auth"],
    });

    database = platform.platform.getProvider<DatabaseServiceAPI>("database");
    expect(database).toBeTruthy();
    await platform.database.getConnector().drop();

    workspaceCounterRepository = await database.getRepository<WorkspaceCounter>(
      WorkspaceCounterType,
      WorkspaceCounter,
    );

    ends();
  });

  afterAll(done => {
    platform.tearDown().then(done);
  });

  it("Initing empty value", async done => {
    await workspaceCounterRepository.save(getWorkspaceCounterInstance(workspaceCounterPrimaryKey));
    const counter = await workspaceCounterRepository.findOne(workspaceCounterPrimaryKey);
    expect(counter).toMatchObject(merge({ value: 0 }, workspaceCounterPrimaryKey));
    done();
  });

  it("Adding value", async done => {
    let counter = await workspaceCounterRepository.findOne(workspaceCounterPrimaryKey);

    // adding 1

    counter.value = 1;
    await workspaceCounterRepository.save(counter);
    counter = await workspaceCounterRepository.findOne(workspaceCounterPrimaryKey);
    expect(counter).toMatchObject(merge({ value: 1 }, workspaceCounterPrimaryKey));

    // adding 2

    counter.value = 2;
    await workspaceCounterRepository.save(counter);
    counter = await workspaceCounterRepository.findOne(workspaceCounterPrimaryKey);
    expect(counter).toMatchObject(merge({ value: 3 }, workspaceCounterPrimaryKey));

    done();
  });

  it("Subtracting value", async done => {
    let counter = await workspaceCounterRepository.findOne(workspaceCounterPrimaryKey);

    // Subtracting 2

    counter.value = -2;
    await workspaceCounterRepository.save(counter);
    counter = await workspaceCounterRepository.findOne(workspaceCounterPrimaryKey);
    expect(counter).toMatchObject(merge({ value: 1 }, workspaceCounterPrimaryKey));

    // Subtracting 10

    counter.value = -10;
    await workspaceCounterRepository.save(counter);
    counter = await workspaceCounterRepository.findOne(workspaceCounterPrimaryKey);
    expect(counter).toMatchObject(merge({ value: -9 }, workspaceCounterPrimaryKey));

    done();
  });
});
