import { beforeAll, afterAll, afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { TestUsers } from "./utils";

describe("The /workspaces API", () => {
  const url = "/internal/services/workspaces/v1";
  let platform: TestPlatform;

  let testUsers: TestUsers;

  const nonExistentId = "11111111-1111-1111-1111-111111111111";

  beforeAll(async ends => {
    platform = await init({
      services: [
        "database",
        "search",
        "pubsub",
        "websocket",
        "webserver",
        "user",
        "workspaces",
        "auth",
      ],
    });
    testUsers = new TestUsers(platform);
    await testUsers.deleteAll();
    await testUsers.createCompanyAndUsers();
    ends();
  });

  afterAll(async ends => {
    // await testUsers.deleteAll();
    await platform.tearDown();
    ends();
  });

  describe("The GET /workspaces/ route", () => {
    it("should 401 when not authenticated", async done => {
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${nonExistentId}/workspaces`,
      });
      expect(response.statusCode).toBe(401);
      done();
    });

    it("should 404 when company not found", async done => {
      const jwtToken = await platform.auth.getJWTToken({ sub: testUsers.users[0].id });

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${nonExistentId}/workspaces`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });
      expect(response.statusCode).toBe(404);
      done();
    });

    it("should 200 when company belongs to user", async done => {
      const jwtToken = await platform.auth.getJWTToken({ sub: testUsers.users[0].id });
      const companyId = testUsers.company.id;
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });
      expect(response.statusCode).toBe(200);
      console.log(response.json());
      done();
    });
  });
});
