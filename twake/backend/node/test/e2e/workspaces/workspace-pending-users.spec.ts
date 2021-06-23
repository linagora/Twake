import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { TestDbService, uuid } from "../utils.prepare.db";
import { v1 as uuidv1 } from "uuid";

describe("The /workspace/pending users API", () => {
  const url = "/internal/services/workspaces/v1";
  let platform: TestPlatform;

  let testDbService: TestDbService;

  const nonExistentId = uuidv1();
  const companyId = uuidv1();

  const firstEmail = "first@test-user.com";
  const secondEmail = "second@test-user.com";
  const thirdEmail = "third@test-user.com";
  const emailForExistedUser = "exist@email.com";

  beforeAll(async ends => {
    platform = await init({
      services: ["database", "pubsub", "webserver", "user", "workspaces", "auth"],
    });

    if ((platform.database as any).type == "mongodb") {
      await platform.database.getConnector().drop();
    }
    await platform.database.getConnector().init();
    testDbService = new TestDbService(platform);
    await testDbService.createCompany(companyId);
    const ws0pk = { id: uuidv1(), group_id: companyId };
    const ws1pk = { id: uuidv1(), group_id: companyId };
    await testDbService.createWorkspace(ws0pk);
    await testDbService.createWorkspace(ws1pk);
    await testDbService.createUser([ws0pk], "member", "admin");
    await testDbService.createUser([ws0pk], "member", "member");
    await testDbService.createUser([ws1pk], "member", "member", emailForExistedUser);
    ends();
  });

  afterAll(async ends => {
    await platform.tearDown();
    ends();
  });

  describe("Invite users to a workspace by email", () => {
    it("should 401 when not authenticated", async done => {
      const companyId = testDbService.company.id;

      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${companyId}/workspaces/${nonExistentId}/users/invite`,
      });
      expect(response.statusCode).toBe(401);
      done();
    });

    it("should 404 when workspace not found", async done => {
      const userId = testDbService.users[0].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${companyId}/workspaces/${nonExistentId}/users/invite`,
        headers: { authorization: `Bearer ${jwtToken}` },
        payload: {
          invitations: [
            {
              email: firstEmail,
              role: "member",
              company_role: "member",
            },
          ],
        },
      });

      expect(response.statusCode).toBe(404);
      done();
    });

    it("should 403 when requester is not workspace admin", async done => {
      const workspace_id = testDbService.workspaces[0].workspace.id;
      const userId = testDbService.workspaces[0].users[1].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${companyId}/workspaces/${workspace_id}/users/invite`,
        headers: { authorization: `Bearer ${jwtToken}` },
        payload: {
          invitations: [
            {
              email: firstEmail,
              role: "member",
              company_role: "member",
            },
          ],
        },
      });
      expect(response.statusCode).toBe(403);
      done();
    });

    it("should 200 when ok", async done => {
      const companyId = testDbService.company.id;
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userId = testDbService.workspaces[0].users[0].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/invite`,
        headers: { authorization: `Bearer ${jwtToken}` },
        payload: {
          invitations: [
            {
              email: firstEmail,
              role: "member",
              company_role: "member",
            },
            {
              email: secondEmail,
              role: "member",
              company_role: "member",
            },
            {
              email: "exist@email.com",
              role: "member",
              company_role: "member",
            },
          ],
        },
      });
      expect(response.statusCode).toBe(200);

      const resources = response.json()["resources"];

      expect(resources.length).toBe(3);

      for (const item of resources) {
        expect(item).toMatchObject({
          email: expect.stringMatching(/first@test-user.com|second@test-user.com|exist@email.com/),
          status: "ok",
        });
      }

      done();
    });

    it("should fail in response with already added users", async done => {
      const companyId = testDbService.company.id;
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userId = testDbService.workspaces[0].users[0].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/invite`,
        headers: { authorization: `Bearer ${jwtToken}` },
        payload: {
          invitations: [
            {
              email: firstEmail,
              role: "member",
              company_role: "member",
            },
            {
              email: thirdEmail,
              role: "member",
              company_role: "member",
            },
          ],
        },
      });
      expect(response.statusCode).toBe(200);

      const resources = response.json()["resources"];

      expect(resources.length).toBe(2);

      expect(resources[0]).toMatchObject({
        email: "first@test-user.com",
        status: "error",
      });

      expect(resources[1]).toMatchObject({
        email: "third@test-user.com",
        status: "ok",
      });

      done();
    });
  });

  describe("Delete a pending user from a workspace", () => {
    it("should 401 when not authenticated", async done => {
      const companyId = testDbService.company.id;
      const email = "first@test-user.com";

      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${companyId}/workspaces/${nonExistentId}/pending/${email}`,
      });

      expect(response.statusCode).toBe(401);
      done();
    });

    it("should 404 when workspace not found", async done => {
      const companyId = testDbService.company.id;
      const email = "first@test-user.com";

      const userId = testDbService.users[0].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });
      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${companyId}/workspaces/${nonExistentId}/pending/${email}`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(404);
      done();
    });

    it("should 403 when requester is not workspace admin", async done => {
      const companyId = testDbService.company.id;
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userId = testDbService.workspaces[0].users[1].id;
      const email = "first@test-user.com";

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/pending/${email}`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(403);
      done();
    });

    it("should {status:error} when email is absent in pending list", async done => {
      const companyId = testDbService.company.id;
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userId = testDbService.workspaces[0].users[0].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/pending/non-exist-email`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        status: "error",
      });

      done();
    });

    it("should 200 when ok", async done => {
      const companyId = testDbService.company.id;
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userId = testDbService.workspaces[0].users[0].id;
      const email = "first@test-user.com";

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });
      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/pending/${email}`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        status: "success",
      });

      done();
    });
  });

  describe("Get list of pending users in workspace", () => {
    it("should 401 when not authenticated", async done => {
      const companyId = testDbService.company.id;
      const email = "first@test-user.com";

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${nonExistentId}/pending/${email}`,
      });
      expect(response.statusCode).toBe(401);
      done();
    });

    it("should 404 when workspace not found", async done => {
      const companyId = testDbService.company.id;
      const email = "first@test-user.com";

      const userId = testDbService.users[0].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${nonExistentId}/pending/${email}`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(404);
      done();
    });

    it("should 403 when requester is not workspace admin", async done => {
      const companyId = testDbService.company.id;
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userId = testDbService.workspaces[0].users[1].id;
      const email = "first@test-user.com";

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/pending/${email}`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(403);
      done();
    });

    it("should 200 when ok", async done => {
      const companyId = testDbService.company.id;
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userId = testDbService.workspaces[0].users[0].id;
      const email = "first@test-user.com";

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/pending/${email}`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(200);

      const resources = response.json()["resources"];
      expect(resources.length).toBe(2);

      expect(resources[0]).toMatchObject({
        email: "second@test-user.com",
        role: "member",
        company_role: "member",
      });

      expect(resources[1]).toMatchObject({
        email: "third@test-user.com",
        role: "member",
        company_role: "member",
      });

      done();
    });

    it("existed user should be added instantly", async done => {
      const companyId = testDbService.company.id;
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userId = testDbService.workspaces[0].users[0].id;
      const email = "first@test-user.com";

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(200);

      const resources = response.json()["resources"];

      expect(resources.find((a: any) => a.user.email === emailForExistedUser)).toBeDefined();

      done();
    });
  });
});
