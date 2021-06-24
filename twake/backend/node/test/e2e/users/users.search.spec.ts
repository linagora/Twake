import { beforeAll, afterAll, afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { TestDbService } from "../utils.prepare.db";

describe("The /users API", () => {
  const url = "/internal/services/users/v1";
  let platform: TestPlatform;

  beforeEach(async ends => {
    platform = await init({
      services: ["database", "search", "pubsub", "websocket", "webserver", "user", "auth"],
    });
    ends();
  });
  afterEach(async ends => {
    ends();
  });

  describe("The GET /users/?search=... route", () => {
    it("Should find the searched users", async done => {
      const testDbService = new TestDbService(platform);
      await testDbService.createCompany(platform.workspace.company_id);
      const workspacePk = {
        id: platform.workspace.workspace_id,
        group_id: platform.workspace.company_id,
      };
      await testDbService.createWorkspace(workspacePk);
      await testDbService.createUser([workspacePk], {
        firstName: "Bob",
        lastName: "Smith",
        email: "bob@twake.app",
      });
      await testDbService.createUser([workspacePk], {
        firstName: "Bob",
        lastName: "Rabiot",
        email: "rabiot.b@twake.app",
      });
      await testDbService.createUser([workspacePk], {
        firstName: "Bob",
        lastName: "Smith-Rabiot",
        email: "rbs@twake.app",
      });
      await testDbService.createUser([workspacePk], {
        firstName: "Alexïs",
        lastName: "Goélâns",
        email: "alexis.goelans@twake.app",
      });

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/users`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        query: {
          search: "alexis",
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json).toMatchObject({ resources: expect.any(Array) });
      const resources = json.resources;

      console.log("SEARCH RESULT: ", resources);

      expect(resources.length).toBe(1);

      done();
    });
  });
});
