import { afterAll, beforeAll, describe, expect, it as _it, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { TestDbService } from "../utils.prepare.db";
import { v1 as uuidv1 } from "uuid";
import gr from "../../../src/services/global-resolver";

export const itRemote = (name: string, cb: (a: any) => void) => {
  _it(name, async () => {
    if (gr.services.console.consoleType === "remote") {
      cb(done);
    } else {
      console.warn(`[skipped]: ${name} (console-mode only)`);
    }
  });
};

describe("The console API auth", () => {
  const loginUrl = "/internal/services/console/v1/login";
  const tokenRefreshUrl = "/internal/services/console/v1/token";

  let platform: TestPlatform;

  let testDbService: TestDbService;
  const companyId = uuidv1();

  const firstEmail = "superman@email.com";

  const firstUserPassword = "superPassw0rd";

  beforeAll(async () => {
    platform = await init({
      services: [
        "database",
        "message-queue",
        "search",
        "applications",
        "webserver",
        "user",
        "workspaces",
        "auth",
        "console",
        "storage",
        "counter",
        "statistics",
        "platform-services",
      ],
    });

    await platform.database.getConnector().init();
    testDbService = await TestDbService.getInstance(platform);
    await testDbService.createCompany(companyId);
    const ws0pk = { id: uuidv1(), company_id: companyId };
    // const ws1pk = { id: uuidv1(), company_id: companyId };
    await testDbService.createWorkspace(ws0pk);
    // await testDbService.createWorkspace(ws1pk);
    await testDbService.createUser([ws0pk], {
      companyRole: "member",
      workspaceRole: "moderator",
      email: firstEmail,
      firstName: "superman",
      password: firstUserPassword,
    });
    // await testDbService.createUser([ws0pk], "member", "member");
    // await testDbService.createUser([ws1pk], "member", "member", emailForExistedUser);

    await new Promise(r => setTimeout(r, 1000));

  });

  afterAll(async () => {
    await platform.tearDown();
  });

  describe("Common checks", () => {
    it("should 400 when required params are missing ", async () => {
      const response = await platform.app.inject({
        method: "POST",
        url: `${loginUrl}`,
        payload: {
          email: "",
          password: "",
          remote_access_token: "",
        },
      });
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        statusCode: 400,
        error: "Bad Request",
        message: "remote_access_token or email+password are required",
      });
    });
  });
  describe("Auth using token", () => {
    itRemote("should 403 when token is invalid", async () => {
      const response = await platform.app.inject({
        method: "POST",
        url: `${loginUrl}`,
        payload: {
          remote_access_token: "12345",
        },
      });
      expect(response.json()).toMatchObject({
        error: "Forbidden",
        message: "Bad access token credentials",
        statusCode: 403,
      });
      expect(response.statusCode).toBe(403);

    });

    itRemote("should 200 when token is valid", async () => {
      const response = await platform.app.inject({
        method: "POST",
        url: `${loginUrl}`,
        payload: {
          email: "",
          password: "",
          remote_access_token: "a550c8b8b942bd92e447271343ac6b29",
        },
      });
      expect(response.json()).toMatchObject({
        access_token: {
          time: expect.any(Number),
          expiration: expect.any(Number),
          refresh_expiration: expect.any(Number),
          value: expect.any(String),
          refresh: expect.any(String),
          type: "Bearer",
        },
      });
      expect(response.statusCode).toBe(200);
    });
  });
  describe("Auth using email/password", () => {
    it("should 403 when user doesn't exists", async () => {
      const response = await platform.app.inject({
        method: "POST",
        url: `${loginUrl}`,
        payload: {
          email: "randomEmail",
          password: "randomPass",
        },
      });
      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({
        error: "Forbidden",
        message: "User doesn't exists",
        statusCode: 403,
      });
    });

    it("should 403 when password doesn't match", async () => {
      const user = testDbService.users[0];

      const response = await platform.app.inject({
        method: "POST",
        url: `${loginUrl}`,
        payload: {
          email: user.email_canonical,
          password: "randomPass",
        },
      });
      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({
        error: "Forbidden",
        message: "Password doesn't match",
        statusCode: 403,
      });
    });

    it("should 200 when credentials is valid", async () => {
      const user = testDbService.users[0];

      const response = await platform.app.inject({
        method: "POST",
        url: `${loginUrl}`,
        payload: {
          email: user.email_canonical,
          password: firstUserPassword,
        },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        access_token: {
          time: expect.any(Number),
          expiration: expect.any(Number),
          refresh_expiration: expect.any(Number),
          value: expect.any(String),
          refresh: expect.any(String),
          type: "Bearer",
        },
      });

    });
  });
  describe("Token renewal", () => {
    it("should 200 when refresh from access_token", async () => {
      const user = testDbService.users[0];

      const firstResponse = await platform.app.inject({
        method: "POST",
        url: `${loginUrl}`,
        payload: {
          email: user.email_canonical,
          password: firstUserPassword,
        },
      });

      const firstRes = firstResponse.json().access_token;
      expect(firstRes.value).toBeTruthy();

      setTimeout(async () => {
        const response = await platform.app.inject({
          method: "POST",
          url: `${tokenRefreshUrl}`,
          headers: {
            authorization: `Bearer ${firstRes.value}`,
          },
        });

        const secondRes = response.json().access_token;

        expect(secondRes.expiration).toBeGreaterThan(firstRes.expiration);
        expect(secondRes.refresh_expiration).toBeGreaterThan(firstRes.refresh_expiration);

      }, 2000);
    });

    it("should 200 when refresh from refresh_token", async () => {
      const user = testDbService.users[0];

      const firstResponse = await platform.app.inject({
        method: "POST",
        url: `${loginUrl}`,
        payload: {
          email: user.email_canonical,
          password: firstUserPassword,
        },
      });

      const firstRes = firstResponse.json().access_token;
      expect(firstRes.refresh).toBeTruthy();

      setTimeout(async () => {
        const response = await platform.app.inject({
          method: "POST",
          url: `${tokenRefreshUrl}`,
          headers: {
            authorization: `Bearer ${firstRes.refresh}`,
          },
        });

        const secondRes = response.json().access_token;

        expect(secondRes.expiration).toBeGreaterThan(firstRes.expiration);
        expect(secondRes.refresh_expiration).toBeGreaterThan(firstRes.refresh_expiration);

      }, 2000);
    });
  });
});
