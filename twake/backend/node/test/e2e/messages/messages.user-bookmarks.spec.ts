import "reflect-metadata";
import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { TestPlatform, init } from "../setup";
import { UserMessageBookmark } from "../../../src/services/messages/entities/user-message-bookmarks";
import {
  ResourceDeleteResponse,
  ResourceListResponse,
  ResourceUpdateResponse,
} from "../../../src/services/types";
import { deserialize } from "class-transformer";
import { MessageServiceAPI } from "../../../src/services/messages/api";

describe("The Messages User Bookmarks feature", () => {
  const url = "/internal/services/messages/v1";
  let platform: TestPlatform;

  beforeEach(async () => {
    platform = await init({
      services: [
        "pubsub",
        "user",
        "websocket",
        "webserver",
        "messages",
        "auth",
        "database",
        "realtime",
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
        url: `${url}/companies/${
          platform.workspace.company_id
        }/preferences/bookmarks/${"mybookmark"}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
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

      let list = await service.userBookmarks.list({}, {}, getContext(platform));
      expect(list.getEntities().length).toBe(1);

      done();
    });

    it("should remove bookmark", async done => {
      const service = platform.platform.getProvider<MessageServiceAPI>("messages");

      await service.userBookmarks.save({
        company_id: platform.workspace.company_id,
        user_id: platform.currentUser.id,
        name: "mybookmark",
      });

      let list = await service.userBookmarks.list({}, {}, getContext(platform));
      expect(list.getEntities().length).toBe(1);

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${
          platform.workspace.company_id
        }/preferences/bookmarks/${"mybookmark"}`,
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

      await service.userBookmarks.save({
        company_id: platform.workspace.company_id,
        user_id: platform.currentUser.id,
        name: "mybookmark",
      });

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

function getContext(platform) {
  return {
    company: { id: platform.workspace.company_id },
    user: { id: platform.currentUser.id },
  };
}
