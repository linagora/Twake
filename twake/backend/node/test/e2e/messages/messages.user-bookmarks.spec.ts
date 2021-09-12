import "reflect-metadata";
import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { TestPlatform, init } from "../setup";
import { UserMessageBookmark } from "../../../src/services/messages/entities/user-message-bookmarks";
import {
  ResourceDeleteResponse,
  ResourceListResponse,
  ResourceUpdateResponse,
} from "../../../src/utils/types";
import { deserialize } from "class-transformer";
import { MessageServiceAPI } from "../../../src/services/messages/api";
import { v4 as uuidv4, v1 as uuidv1 } from "uuid";

describe("The Messages User Bookmarks feature", () => {
  const url = "/internal/services/messages/v1";
  let platform: TestPlatform;

  beforeEach(async () => {
    platform = await init({
      services: [
        "webserver",
        "database",
        "search",
        "storage",
        "applications",
        "pubsub",
        "user",
        "search",
        "websocket",
        "messages",
        "auth",
        "realtime",
        "channels",
        "counter",
        "platform-services",
      ],
    });
  });

  afterEach(async () => {
    await platform.tearDown();
  });

  describe("On user manage bookmmarks", () => {
    it("should create new bookmark", async done => {
      const service = platform.platform.getProvider<MessageServiceAPI>("messages");

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/preferences/bookmarks/`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: {
          resource: {
            name: "mybookmark",
          },
        },
      });

      const result: ResourceUpdateResponse<UserMessageBookmark> = deserialize(
        ResourceUpdateResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resource).toMatchObject({
        user_id: platform.currentUser.id,
        name: "mybookmark",
      });

      const list = await service.userBookmarks.list({}, {}, getContext(platform));
      expect(list.getEntities().length).toBe(1);

      done();
    });

    it("should prevent duplicated bookmark", async done => {
      const service = platform.platform.getProvider<MessageServiceAPI>("messages");

      const uuid = uuidv4();

      await service.userBookmarks.save(
        {
          id: uuid,
          company_id: platform.workspace.company_id,
          user_id: platform.currentUser.id,
          name: "mybookmark",
        },
        {},
        getContext(platform),
      );

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/preferences/bookmarks/`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: {
          resource: {
            name: "mybookmark",
          },
        },
      });

      const result: ResourceUpdateResponse<UserMessageBookmark> = deserialize(
        ResourceUpdateResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resource).toMatchObject({
        id: uuid,
        user_id: platform.currentUser.id,
        name: "mybookmark",
      });

      const list = await service.userBookmarks.list({}, {}, getContext(platform));
      expect(list.getEntities().length).toBe(1);

      done();
    });

    it("should remove bookmark", async done => {
      const service = platform.platform.getProvider<MessageServiceAPI>("messages");

      const id = uuidv4();

      await service.userBookmarks.save(
        {
          id,
          company_id: platform.workspace.company_id,
          user_id: platform.currentUser.id,
          name: "mybookmark",
        },
        {},
        getContext(platform),
      );

      let list = await service.userBookmarks.list({}, {}, getContext(platform));
      expect(list.getEntities().length).toBe(1);

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${platform.workspace.company_id}/preferences/bookmarks/${id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      list = await service.userBookmarks.list({}, {}, getContext(platform));
      expect(list.getEntities().length).toBe(0);

      done();
    });

    it("should list bookmarks", async done => {
      const service = platform.platform.getProvider<MessageServiceAPI>("messages");

      await service.userBookmarks.save(
        {
          id: uuidv4(),
          company_id: platform.workspace.company_id,
          user_id: platform.currentUser.id,
          name: "mybookmark",
        },
        {},
        getContext(platform),
      );

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/preferences/bookmarks`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      const result: ResourceListResponse<UserMessageBookmark> = deserialize(
        ResourceListResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resources.length).toBe(1);
      expect(result.resources[0].name).toBe("mybookmark");
      done();
    });
  });
});

function getContext(platform: TestPlatform) {
  return {
    company: { id: platform.workspace.company_id },
    user: { id: platform.currentUser.id },
  };
}
