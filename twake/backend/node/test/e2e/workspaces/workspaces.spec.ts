import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { TestDbService } from "../utils.prepare.db";
import { v4 as uuidv4 } from "uuid";

describe("The /workspaces API", () => {
  const url = "/internal/services/workspaces/v1";
  let platform: TestPlatform;

  let testDbService: TestDbService;

  const nonExistentId = "11111111-1111-1111-1111-111111111111";
  const companyId = "21111111-1111-1111-1111-111111111111";
  // let workspaceId: string = null;

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
    const ws1pk = { id: uuidv4(), group_id: companyId };
    const ws2pk = { id: uuidv4(), group_id: companyId };
    const ws3pk = { id: uuidv4(), group_id: companyId };
    await testDbService.createWorkspace(ws1pk);
    await testDbService.createWorkspace(ws2pk);
    await testDbService.createWorkspace(ws3pk);
    await testDbService.createUser([ws1pk, ws2pk]);
    await testDbService.createUser([ws3pk], "admin");
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
      const userId = testDbService.workspaces[0].users[0].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${nonExistentId}/workspaces`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });
      expect(response.statusCode).toBe(404);
      done();
    });

    it("should 200 when company belongs to user", async done => {
      const userId = testDbService.workspaces[0].users[0].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });
      const companyId = testDbService.company.id;
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });
      expect(response.statusCode).toBe(200);

      const resources = response.json()["resources"];

      expect(resources.length).toBe(2);

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

  describe("The GET /workspaces/:workspace_id route", () => {
    it("should 401 when not authenticated", async done => {
      const workspaceId = testDbService.workspaces[0].workspace.id;

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${nonExistentId}/workspaces/${workspaceId}`,
      });
      expect(response.statusCode).toBe(401);
      done();
    });

    it("should 404 when workspace not found", async done => {
      const userId = testDbService.workspaces[0].users[0].id;
      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${uuidv4()}`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });
      expect(response.statusCode).toBe(404);
      done();
    });

    it("should 403 when user not belong to workspace and not company_admin", async done => {
      const workspaceId = testDbService.workspaces[2].workspace.id;
      const userIdFromAnotherWorkspace = testDbService.workspaces[0].users[0].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userIdFromAnotherWorkspace });

      console.log("\n\n\n");
      console.log("workspaceId", workspaceId);
      console.log("userIdFromAnotherWorkspace", userIdFromAnotherWorkspace);

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });
      expect(response.statusCode).toBe(403);

      expect(response.json()).toEqual({
        error: "Forbidden",
        message: `You are not belong to workspace ${workspaceId}`,
        statusCode: 403,
      });

      done();
    });

    it("should 200 when user is company_admin", async done => {
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userIdFromAnotherWorkspace = testDbService.workspaces[2].users[0].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userIdFromAnotherWorkspace });

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });
      expect(response.statusCode).toBe(200);

      const resource = response.json()["resource"];

      expect(resource).toMatchObject({
        id: expect.any(String),
        company_id: expect.any(String),
        name: expect.any(String),
        logo: expect.any(String),
        default: expect.any(Boolean),
        archived: expect.any(Boolean),
      });

      if (resource.stats) {
        expect(resource.stats).toMatchObject({
          created_at: expect.any(Number),
          total_members: expect.any(Number),
        });
      }

      done();
    });

    it("should 200 when user is belong to workspace", async done => {
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userIdFromThisWorkspace = testDbService.workspaces[0].users[0].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userIdFromThisWorkspace });

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });
      expect(response.statusCode).toBe(200);

      const resource = response.json()["resource"];

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

      done();
    });
  });
});
