import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { TestDbService } from "../utils.prepare.db";

describe("The /workspaces API", () => {
  const url = "/internal/services/workspaces/v1";
  let platform: TestPlatform;

  let testDbService: TestDbService;

  const nonExistentId = "11111111-1111-1111-1111-111111111111";
  const companyId = "21111111-1111-1111-1111-111111111111";
  const workspaceId = "31111111-1111-1111-1111-111111111111";

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

    await platform.database.getConnector().init();
    testDbService = new TestDbService(platform);
    await testDbService.createCompany(companyId);
    const workspacePk = { id: workspaceId, group_id: companyId };
    await testDbService.createWorkspace(workspacePk);
    await testDbService.createUser([workspacePk]);
    ends();
  });

  afterAll(async ends => {
    await platform.database.getConnector().drop();
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
      const jwtToken = await platform.auth.getJWTToken({ sub: testDbService.users[0].id });

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${nonExistentId}/workspaces`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });
      expect(response.statusCode).toBe(404);
      done();
    });

    it("should 200 when company belongs to user", async done => {
      const jwtToken = await platform.auth.getJWTToken({ sub: testDbService.users[0].id });
      const companyId = testDbService.company.id;
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });
      expect(response.statusCode).toBe(200);
      console.log(response.json());

      const resources = response.json()["resources"];

      expect(resources.length).toBeGreaterThan(0);

      for (const resource of resources) {
        expect(resource).toMatchObject({
          id: expect.any(String),
          company_id: expect.any(String),
          name: expect.any(String),
          logo: expect.any(String),
          default: expect.any(Boolean),
          archived: expect.any(Boolean),
          role: expect.stringMatching(/admin|member/),
        });

        if (resource.stats) {
          expect(resource.stats).toMatchObject({
            created_at: expect.any(Number),
            total_members: expect.any(Number),
          });
        }
      }

      done();
    });
  });
});
