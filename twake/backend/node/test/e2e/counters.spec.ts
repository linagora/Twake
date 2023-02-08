// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { beforeAll, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "./setup";
import { v1 as uuidv1 } from "uuid";
import { CounterAPI } from "../../src/core/platform/services/counter/types";
import {
  WorkspaceCounterEntity,
  WorkspaceCounterPrimaryKey,
  WorkspaceCounterType,
} from "../../src/services/workspaces/entities/workspace_counters";
import { CounterProvider } from "../../src/core/platform/services/counter/provider";
import WorkspaceUser, {
  getInstance as getWorkspaceUserInstance,
  TYPE as WorkspaceUserEntityType,
} from "../../src/services/workspaces/entities/workspace_user";

import { countRepositoryItems } from "../../src/utils/counters";
import { TestDbService } from "./utils.prepare.db";
import {
  ChannelCounterEntity,
  ChannelCounterPrimaryKey,
  ChannelUserCounterType,
} from "../../src/services/channels/entities/channel-counters";
import { ChannelMemberType } from "../../src/services/channels/types";
import { getMemberOfChannelInstance, MemberOfChannel } from "../../src/services/channels/entities";
import gr from "../../src/services/global-resolver";

describe("Counters implementation", () => {
  let platform: TestPlatform;
  // let database: DatabaseServiceAPI;
  let counterApi: CounterAPI;
  let testDbService: TestDbService;

  beforeAll(async () => {
    platform = await init();

    testDbService = new TestDbService(platform);

    await gr.database.getConnector().drop();

    counterApi = platform.platform.getProvider<CounterAPI>("counter");
    expect(counterApi).toBeTruthy();

  });

  afterAll(async () => {
    await platform.tearDown();
    platform = null;
  });

  const getCounter = async (type, entity) => {
    return counterApi.getCounter<entity>(await testDbService.getRepository<entity>(type, entity));
  };

  describe("Workspace counters", () => {
    let counter: CounterProvider;
    const counterPk = { id: uuidv1(), counter_type: WorkspaceCounterType.MEMBERS };

    beforeAll(async () => {
      counter = await getCounter("workspace_counters", WorkspaceCounterEntity);

      const workspaceUserRepository = await testDbService.getRepository(
        WorkspaceUserEntityType,
        WorkspaceUser,
      );

      await workspaceUserRepository.save(
        getWorkspaceUserInstance({
          workspaceId: counterPk.id,
          userId: uuidv1(),
          id: uuidv1(),
        }),
      );

      expect(counter).toBeTruthy();

    });

    it("Initializing empty value", async () => {
      await counter.increase(counterPk, 0);
      const val = await counter.get(counterPk);
      expect(val).toEqual(0);
    });

    it("Adding value", async () => {
      // adding 1

      await counter.increase(counterPk, 1);
      let val = await counter.get(counterPk);
      expect(val).toEqual(1);

      // adding 2

      await counter.increase(counterPk, 2);
      val = await counter.get(counterPk);
      expect(val).toEqual(3);

    });

    it("Subtracting value", async () => {
      // Subtracting 2

      await counter.increase(counterPk, -2);
      let val = await counter.get(counterPk);
      expect(val).toEqual(1);

      // Subtracting 10

      await counter.increase(counterPk, -10);
      val = await counter.get(counterPk);
      expect(val).toEqual(-9);

    });

    it("Revising counter", async () => {
      // Subtracting 2

      const workspaceUserRepository = await testDbService.getRepository(
        WorkspaceUserEntityType,
        WorkspaceUser,
      );

      counter.setReviseCallback(async (pk: WorkspaceCounterPrimaryKey) => {
        if (pk.counter_type == "members") {
          return countRepositoryItems(workspaceUserRepository, { workspace_id: pk.id });
        }
      }, 4);

      await counter.increase(counterPk, 1);
      const val = await counter.get(counterPk);
      expect(val).toEqual(1);

    });
  });

  describe("Channel counters", () => {
    let counter: CounterProvider;
    let counterPk: ChannelCounterPrimaryKey;

    beforeAll(async () => {
      counterPk = {
        id: uuidv1(),
        company_id: uuidv1(),
        workspace_id: uuidv1(),
        counter_type: ChannelUserCounterType.MEMBERS,
      };

      counter = await getCounter("channel_counters", ChannelCounterEntity);

      const memberOfChannelRepository = await testDbService.getRepository(
        "channel_members",
        MemberOfChannel,
      );

      await memberOfChannelRepository.save(
        getMemberOfChannelInstance({
          company_id: counterPk.company_id,
          workspace_id: counterPk.workspace_id,
          channel_id: counterPk.id,
          user_id: uuidv1(),
        }),
      );

      expect(counter).toBeTruthy();

    });

    it("Initializing empty value", async () => {
      await counter.increase(counterPk, 0);
      const val = await counter.get(counterPk);
      expect(val).toEqual(0);
    });

    it("Adding value", async () => {
      // adding 1

      await counter.increase(counterPk, 1);
      let val = await counter.get(counterPk);
      expect(val).toEqual(1);

      // adding 2

      await counter.increase(counterPk, 2);
      val = await counter.get(counterPk);
      expect(val).toEqual(3);

    });

    it("Subtracting value", async () => {
      // Subtracting 2

      await counter.increase(counterPk, -2);
      let val = await counter.get(counterPk);
      expect(val).toEqual(1);

      // Subtracting 10

      await counter.increase(counterPk, -10);
      val = await counter.get(counterPk);
      expect(val).toEqual(-9);

    });

    it("Revising counter", async () => {
      // Subtracting 2

      const memberOfChannelRepository = await testDbService.getRepository(
        "channel_members",
        MemberOfChannel,
      );

      counter.setReviseCallback(async (pk: ChannelCounterPrimaryKey) => {
        if (pk.counter_type == ChannelUserCounterType.MEMBERS) {
          return countRepositoryItems(
            memberOfChannelRepository,
            { channel_id: pk.id, company_id: pk.company_id, workspace_id: pk.workspace_id },
            { type: ChannelMemberType.MEMBER },
          );
        }
      }, 4);

      await counter.increase(counterPk, 1);
      const val = await counter.get(counterPk);
      expect(val).toEqual(1);

    });
  });
});
