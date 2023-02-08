import { afterAll, beforeAll, describe, expect, it as _it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { TestDbService } from "../utils.prepare.db";
import { v1 as uuidv1 } from "uuid";
import gr from "../../../src/services/global-resolver";
/*
 THIS TESTS RUNS ONLY FOR THE CONSOLE-MODE (CONSOLE TYPE: INTERNAL)
*/

export const it = async (name: string, cb: (a: any) => void) => {
  return _it(name, async () => {
    if (gr.services.console.consoleType === "internal") {
      await cb();
    } else {
      console.warn(`[skipped]: ${name} (no-console mode only)`);
    }
  });
};

describe("The /workspace/pending users API", () => {
  const url = "/internal/services/workspaces/v1";
  let platform: TestPlatform;

  let testDbService: TestDbService;

  const nonExistentId = uuidv1();
  const companyId = uuidv1();

  const firstEmail = "first@test-user.com";
  const secondEmail = "second@test-user.com";
  const thirdEmail = "third@test-user.com";
  const fourthUser = "fourth@test-user.com";
  const emailForExistedUser = "exist@email.com";

  async function doTheTest() {
    return Promise.resolve(gr.services.console.consoleType === "remote");
  }

  beforeAll(async () => {
    platform = await init({
      services: [
        "user",
        "database",
        "message-queue",
        "webserver",
        "search",
        "workspaces",
        "applications",
        "auth",
        "console",
        "storage",
        "counter",
        "statistics",
        "platform-services",
      ],
    });

    await platform.database.getConnector().drop();
    await platform.database.getConnector().init();
    testDbService = new TestDbService(platform);
    await testDbService.createCompany(companyId);
    const ws0pk = { id: uuidv1(), company_id: companyId };
    const ws1pk = { id: uuidv1(), company_id: companyId };
    const ws2pk = { id: uuidv1(), company_id: companyId };
    await testDbService.createWorkspace(ws0pk);
    await testDbService.createWorkspace(ws1pk);
    await testDbService.createWorkspace(ws2pk);
    await testDbService.createUser([ws0pk], { companyRole: "member", workspaceRole: "moderator" });
    await testDbService.createUser([ws0pk], { companyRole: "member", workspaceRole: "member" });
    await testDbService.createUser([ws1pk], {
      companyRole: "member",
      workspaceRole: "member",
      email: emailForExistedUser,
    });
    await testDbService.createUser([ws2pk], {
      companyRole: "guest",
      workspaceRole: "member",
      email: fourthUser,
    });

  });

  afterAll(async () => {
    await platform.tearDown();
  });

  describe("Invite users to a workspace by email", () => {
    it("should 401 when not authenticated", async () => {
      const companyId = testDbService.company.id;

      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${companyId}/workspaces/${nonExistentId}/users/invite`,
      });
      expect(response.statusCode).toBe(401);
    });

    it("should 404 when workspace not found", async () => {
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
    });

    it("should 403 when requester is not at least workspace member", async () => {
      const workspace_id = testDbService.workspaces[2].workspace.id;
      const userId = testDbService.workspaces[2].users[0].id;

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
    });

    it("should 200 when ok", async () => {
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

    });

    it("should fail in response with already added users", async () => {
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

    });
  });

  describe("Delete a pending user from a workspace", () => {
    it("should 401 when not authenticated", async () => {
      const companyId = testDbService.company.id;
      const email = "first@test-user.com";

      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${companyId}/workspaces/${nonExistentId}/pending/${email}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it("should 404 when workspace not found", async () => {
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
    });

    it("should 403 when requester is not at least workspace member", async () => {
      const companyId = testDbService.company.id;
      const workspaceId = testDbService.workspaces[2].workspace.id;
      const userId = testDbService.workspaces[2].users[0].id;
      const email = "first@test-user.com";

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/pending/${email}`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(403);
    });

    it("should {status:error} when email is absent in pending list", async () => {
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

    });

    it("should 200 when ok", async () => {
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

    });
  });

  describe("Get list of pending users in workspace", () => {
    it("should 401 when not authenticated", async () => {
      const companyId = testDbService.company.id;
      const email = "first@test-user.com";

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${nonExistentId}/pending`,
      });
      expect(response.statusCode).toBe(401);
    });

    it("should 404 when workspace not found", async () => {
      const companyId = testDbService.company.id;
      const email = "first@test-user.com";

      const userId = testDbService.users[0].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${nonExistentId}/pending`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(404);
    });

    it("should 403 when requester is not at least workspace member", async () => {
      const companyId = testDbService.company.id;
      const workspaceId = testDbService.workspaces[2].workspace.id;
      const userId = testDbService.workspaces[2].users[0].id;
      const email = "first@test-user.com";

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/pending`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(403);
    });

    it("should 200 when ok", async () => {
      const companyId = testDbService.company.id;
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userId = testDbService.workspaces[0].users[0].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/pending`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(200);

      const resources = response.json()["resources"];
      console.log("resources A: ", resources);
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

    });

    it("existed user should be added instantly", async () => {
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

      console.log("resources B: ", resources);
      expect(resources.find((a: any) => a.user.email === emailForExistedUser)).toBeDefined();

    });
  });
});
