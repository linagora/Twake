import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { TestDbService } from "../utils.prepare.db";
import { v1 as uuidv1 } from "uuid";
import AuthService from "../../../src/core/platform/services/auth/provider";
import { InviteTokenObject } from "../../../src/services/workspaces/web/types";
import gr from "../../../src/services/global-resolver";

describe("The /workspaces API (invite tokens)", () => {
  const url = "/internal/services/workspaces/v1";
  let platform: TestPlatform;

  let testDbService: TestDbService;
  let authServiceApi: AuthService;

  let companyId = uuidv1();

  const startup = async () => {
    platform = await init({
      services: [
        "database",
        "message-queue",
        "webserver",
        "user",
        "search",
        "workspaces",
        "auth",
        "console",
        "counter",
        "storage",
        "applications",
        "statistics",
        "platform-services",
      ],
    });

    companyId = platform.workspace.company_id;

    authServiceApi = await platform.platform.getProvider<AuthService>("auth");
    testDbService = new TestDbService(platform);
    await resetDatabase();
  };

  const shutdown = async () => {
    await platform.tearDown();
  };

  const resetDatabase = async () => {
    // await platform.database.getConnector().init();
    await platform.database.getConnector().drop();
    await testDbService.createCompany(companyId, "TestJoinCompany");
    const ws0pk = { id: uuidv1(), company_id: companyId };
    const ws1pk = { id: uuidv1(), company_id: companyId };
    const ws2pk = { id: uuidv1(), company_id: companyId };
    await testDbService.createWorkspace(ws0pk, "FirstWorkspace");
    await testDbService.createWorkspace(ws1pk, "SecondWorkspace");
    await testDbService.createWorkspace(ws2pk, "ThirdWorkspace");
    await testDbService.createUser([ws0pk, ws1pk]);
    await testDbService.createUser([ws2pk], { companyRole: "admin" });
    await testDbService.createUser([ws2pk], { companyRole: undefined, workspaceRole: "moderator" });
    await testDbService.createUser([], { companyRole: "guest" });
  };

  const decodeToken = (token: string): InviteTokenObject => {
    return gr.services.workspaces.decodeInviteToken(token);
  };

  describe("The GET /tokens/ route", () => {
    beforeAll(startup);
    afterAll(shutdown);
    it("should 401 when not authenticated", async done => {
      const companyId = testDbService.company.id;

      const workspaceId = testDbService.workspaces[0].workspace.id;

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens`,
      });
      expect(response.statusCode).toBe(401);
      done();
    });

    it("should 403 when user is not a workspace member", async done => {
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userIdFromAnotherWorkspace = platform.currentUser.id;
      const companyId = testDbService.company.id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userIdFromAnotherWorkspace });

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });
      expect(response.statusCode).toBe(403);

      done();
    });

    it("should 404 when token doesn't exists yet", async done => {
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userId = testDbService.workspaces[0].users[0].id;
      const companyId = testDbService.company.id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(404);

      done();
    });

    it("should 200 when user is a workspace member", async done => {
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userId = testDbService.workspaces[0].users[0].id;
      const companyId = testDbService.company.id;

      await gr.services.workspaces.createInviteToken(companyId, workspaceId, userId);

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(200);

      expect(response.json()).toMatchObject({
        resources: [
          {
            token: expect.any(String),
          },
        ],
      });

      done();
    });
  });

  describe("The POST /tokens/ route", () => {
    beforeAll(startup);
    afterAll(shutdown);

    it("should 401 when not authenticated", async done => {
      const companyId = testDbService.company.id;

      const workspaceId = testDbService.workspaces[0].workspace.id;

      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens`,
      });
      expect(response.statusCode).toBe(401);
      done();
    });

    it("should 403 when user is not a workspace member", async done => {
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userIdFromAnotherWorkspace = platform.currentUser.id;
      const companyId = testDbService.company.id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userIdFromAnotherWorkspace });

      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens`,
        headers: { authorization: `Bearer ${jwtToken}` },
        payload: {},
      });
      expect(response.statusCode).toBe(403);

      done();
    });

    it("should 200 when user is a workspace member", async done => {
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userId = testDbService.workspaces[0].users[0].id;
      const companyId = testDbService.company.id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const beforeResponse = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(beforeResponse.statusCode).toBe(404);

      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(200);

      expect(response.json()).toMatchObject({
        resource: {
          token: expect.any(String),
        },
      });

      const createToken = decodeToken(response.json().resource.token);

      const afterResponse = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(afterResponse.statusCode).toBe(200);

      expect(afterResponse.json()).toMatchObject({
        resources: [
          {
            token: expect.any(String),
          },
        ],
      });

      const getToken = decodeToken(afterResponse.json().resources[0].token);

      expect(createToken.t).toEqual(getToken.t);

      done();
    });

    it("should 200 when when recreate token", async done => {
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userId = testDbService.workspaces[0].users[0].id;
      const companyId = testDbService.company.id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const beforeResponse = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(beforeResponse.statusCode).toBe(200);

      const beforeResponseResource = beforeResponse.json()["resources"][0];

      expect(beforeResponseResource).toMatchObject({
        token: expect.any(String),
      });

      const beforeResponseToken = decodeToken(beforeResponseResource.token).t;

      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(200);

      const responseResource = response.json()["resource"];

      expect(responseResource).toMatchObject({
        token: expect.any(String),
      });

      const responseToken = decodeToken(responseResource.token).t;

      expect(responseToken).not.toEqual(beforeResponseToken);

      const afterResponse = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(afterResponse.statusCode).toBe(200);

      const afterResponseResource = afterResponse.json()["resources"][0];

      expect(afterResponseResource).toMatchObject({
        token: expect.any(String),
      });

      const afterResponseToken = decodeToken(afterResponseResource.token).t;

      expect(responseToken).toEqual(afterResponseToken);
      expect(afterResponseToken).not.toEqual(beforeResponseToken);

      done();
    });
  });

  describe("The DELETE /tokens/ route", () => {
    beforeAll(startup);
    afterAll(shutdown);

    it("should 401 when not authenticated", async done => {
      const companyId = testDbService.company.id;

      const workspaceId = testDbService.workspaces[0].workspace.id;

      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens/fake1-${new Date().getTime()}`,
      });
      expect(response.statusCode).toBe(401);
      done();
    });

    it("should 403 when user is not a workspace member", async done => {
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userIdFromAnotherWorkspace = platform.currentUser.id;
      const companyId = testDbService.company.id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userIdFromAnotherWorkspace });

      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens/fake2-${new Date().getTime()}`,
        headers: { authorization: `Bearer ${jwtToken}` },
        payload: {},
      });
      expect(response.statusCode).toBe(403);

      done();
    });

    it("should 204 when user is a workspace member", async done => {
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userId = testDbService.workspaces[0].users[0].id;
      const companyId = testDbService.company.id;

      await gr.services.workspaces.createInviteToken(companyId, workspaceId, userId);

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const beforeResponse = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(beforeResponse.statusCode).toBe(200);

      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens/${
          beforeResponse.json().resources[0].token
        }`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(response.statusCode).toBe(204);

      const afterResponse = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens`,
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      expect(afterResponse.statusCode).toBe(404);

      done();
    });

    it("should 404 when deleting token that doesn't exists", async done => {
      const workspaceId = testDbService.workspaces[0].workspace.id;
      const userId = testDbService.workspaces[0].users[0].id;
      const companyId = testDbService.company.id;

      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/users/tokens/fake3-${new Date().getTime()}`,
        headers: { authorization: `Bearer ${jwtToken}` },
        payload: {},
      });
      expect(response.statusCode).toBe(404);

      done();
    });
  });

  describe("Join workspace using token", () => {
    let workspaceId;
    let userId;
    let companyId;
    let inviteToken;

    beforeAll(async () => {
      await startup();
      companyId = testDbService.company.id;
      workspaceId = testDbService.workspaces[0].workspace.id;
      userId = testDbService.workspaces[2].users[0].id;
      inviteToken = await gr.services.workspaces.createInviteToken(companyId, workspaceId, userId);
    });
    afterAll(shutdown);

    it("should 404 when when token not found", async done => {
      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/join`,
        headers: { authorization: `Bearer ${jwtToken}` },
        payload: {
          join: false,
          token: "SOME FAKE TOKEN",
        },
      });
      expect(response.statusCode).toBe(404);
      done();
    });

    it("should 200 when user is not authorized", async done => {
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/join`,
        // headers: { authorization: `Bearer ${jwtToken}` },
        payload: {
          join: false,
          token: inviteToken.token,
        },
      });
      expect(response.statusCode).toBe(200);

      const resource = response.json()["resource"];

      expect(resource).toMatchObject({
        company: {
          name: "TestJoinCompany",
        },
        workspace: {
          name: "FirstWorkspace",
        },
        auth_required: true,
      });

      done();
    });

    it("should 200 when user is authorized and not joining", async done => {
      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/join`,
        headers: { authorization: `Bearer ${jwtToken}` },
        payload: {
          join: false,
          token: inviteToken.token,
        },
      });
      expect(response.statusCode).toBe(200);

      const resource = response.json()["resource"];

      expect(resource).toMatchObject({
        company: {
          name: "TestJoinCompany",
        },
        workspace: {
          name: "FirstWorkspace",
        },
        auth_required: false,
      });

      done();
    });

    it("should 200 when user is authorized and joining", async done => {
      const jwtToken = await platform.auth.getJWTToken({ sub: userId });

      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/join`,
        headers: { authorization: `Bearer ${jwtToken}` },
        payload: {
          join: true,
          token: inviteToken.token,
        },
      });
      expect(response.statusCode).toBe(200);

      const resource = response.json()["resource"];

      expect(resource).toMatchObject({
        company: {
          id: companyId,
          name: "TestJoinCompany",
        },
        workspace: {
          id: workspaceId,
          name: "FirstWorkspace",
        },
        auth_required: false,
      });

      done();
    });
  });
});
