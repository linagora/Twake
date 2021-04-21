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

      done();
    });

    it("should remove bookmark", async done => {
      //TODO create bookmark

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
      done();
    });

    it("should list bookmarks", async done => {
      //TODO create bookmarks

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

      console.log(result);

      expect(response.statusCode).toBe(200);
      done();
    });
  });
});
