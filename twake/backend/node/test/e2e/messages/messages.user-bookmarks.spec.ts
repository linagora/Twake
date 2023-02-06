import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { UserMessageBookmark } from "../../../src/services/messages/entities/user-message-bookmarks";
import { ResourceListResponse, ResourceUpdateResponse } from "../../../src/utils/types";
import { deserialize } from "class-transformer";
import { v4 as uuidv4 } from "uuid";
import gr from "../../../src/services/global-resolver";

describe("The Messages User Bookmarks feature", () => {
  const url = "/internal/services/messages/v1";
  let platform: TestPlatform;

  beforeEach(async () => {
    platform = await init({
      services: [
        "webserver",
        "database",
        "search",
        "files",
        "storage",
        "applications",
        "message-queue",
        "user",
        "search",
        "websocket",
        "messages",
        "auth",
        "realtime",
        "channels",
        "counter",
        "statistics",
        "platform-services",
      ],
    });
  });

  afterEach(async () => {
    await platform.tearDown();
  });

  describe("On user manage bookmmarks", () => {
    it("should create new bookmark", async () => {
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

      const context = getContext(platform);

      const list = await gr.services.messages.userBookmarks.list({
        user_id: context.user.id,
        company_id: context.company.id,
      });
      expect(list.getEntities().length).toBe(1);

    });

    it("should prevent duplicated bookmark", async () => {
      // const uuid = uuidv4();

      const context = getContext(platform);

      const data = await gr.services.messages.userBookmarks.save(
        {
          company_id: platform.workspace.company_id,
          user_id: platform.currentUser.id,
          name: "mybookmark",
          test: "123",
        },
        context,
      );
      const uuid = data.entity.id;

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

      const list = await gr.services.messages.userBookmarks.list({
        user_id: context.user.id,
        company_id: context.company.id,
      });
      expect(list.getEntities().length).toBe(1);

    });

    it("should remove bookmark", async () => {
      const id = uuidv4();
      const context = getContext(platform);

      await gr.services.messages.userBookmarks.save(
        {
          id,
          company_id: platform.workspace.company_id,
          user_id: platform.currentUser.id,
          name: "mybookmark",
        },
        context,
      );

      let list = await gr.services.messages.userBookmarks.list({
        user_id: context.user.id,
        company_id: context.company.id,
      });
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

      list = await gr.services.messages.userBookmarks.list({
        user_id: context.user.id,
        company_id: context.company.id,
      });
      expect(list.getEntities().length).toBe(0);

    });

    it("should list bookmarks", async () => {
      const context = getContext(platform);

      await gr.services.messages.userBookmarks.save(
        {
          id: uuidv4(),
          company_id: platform.workspace.company_id,
          user_id: platform.currentUser.id,
          name: "mybookmark",
        },
        context,
      );

      const list = await gr.services.messages.userBookmarks.list({
        user_id: context.user.id,
        company_id: context.company.id,
      });
      expect(list.getEntities().length).toBe(1);

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
    });
  });
});

function getContext(platform: TestPlatform) {
  return {
    company: { id: platform.workspace.company_id },
    user: { id: platform.currentUser.id },
  };
}
