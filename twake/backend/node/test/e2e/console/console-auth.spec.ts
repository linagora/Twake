import { afterAll, beforeAll, describe, expect, it as _it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { TestDbService } from "../utils.prepare.db";
import { v1 as uuidv1 } from "uuid";
import crypto from "crypto";
import { ConsoleServiceAPI } from "../../../src/services/console/api";
import { ConsoleOptions, ConsoleType } from "../../../src/services/console/types";

let consoleType: ConsoleType = null;

export const it = (name: string, cb: (a: any) => void) => {
  _it(name, async done => {
    if (consoleType === "remote") {
      cb(done);
    } else {
      console.warn(`[skipped]: ${name} (console-mode only)`);
      done();
    }
  });
};

describe("The console API auth", () => {
  const url = "/internal/services/console/v1/token";

  let platform: TestPlatform;

  let testDbService: TestDbService;
  const companyId = uuidv1();

  const firstEmail = "superman@email.com";
  const secondEmail = "C.o.n.sole_created-user@email.com";
  const thirdEmail = "superman@someogherservice.com";

  const firstUserPassword = "superPassw0rd";

  let consoleOptions: ConsoleOptions = null;

  beforeAll(async ends => {
    platform = await init({
      services: ["database", "pubsub", "webserver", "user", "workspaces", "auth", "console"],
    });

    if ((platform.database as any).type == "mongodb") {
      await platform.database.getConnector().drop();
    }
    await platform.database.getConnector().init();
    testDbService = await TestDbService.getInstance(platform);
    await testDbService.createCompany(companyId);
    const ws0pk = { id: uuidv1(), group_id: companyId };
    // const ws1pk = { id: uuidv1(), group_id: companyId };
    await testDbService.createWorkspace(ws0pk);
    // await testDbService.createWorkspace(ws1pk);
    await testDbService.createUser(
      [ws0pk],
      "member",
      "admin",
      firstEmail,
      "superman",
      firstUserPassword,
    );
    // await testDbService.createUser([ws0pk], "member", "member");
    // await testDbService.createUser([ws1pk], "member", "member", emailForExistedUser);

    const console = platform.platform.getProvider<ConsoleServiceAPI>("console");
    consoleOptions = console.consoleOptions;
    consoleType = console.consoleType;

    ends();
  });

  afterAll(async ends => {
    await platform.tearDown();
    ends();
  });

  describe("Common checks", () => {
    it("should 400 when required params are missing ", async done => {
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}`,
        payload: {
          email: "",
          password: "",
          access_token: "",
        },
      });
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        statusCode: 400,
        error: "Bad Request",
        message: "access_token or email+password are required",
      });
      done();
    });
  });
  describe.skip("Auth using token", () => {
    it("should 403 when token is invalid", async done => {
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}`,
        payload: {
          email: "",
          password: "",
          access_token: "",
        },
      });
      expect(response.json()).toMatchObject({ mock: true });
      expect(response.statusCode).toBe(200);
      done();
    });

    it("should 200 when token is valid", async done => {
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}`,
        payload: {
          email: "",
          password: "",
          access_token: "",
        },
      });
      expect(response.json()).toMatchObject({ mock: true });
      expect(response.statusCode).toBe(200);
      done();
    });
  });
  describe("Auth using email/password", () => {
    it("should 403 when user doesn't exists", async done => {
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}`,
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
      done();
    });

    it("should 403 when password doesn't match", async done => {
      const user = testDbService.users[0];

      const response = await platform.app.inject({
        method: "POST",
        url: `${url}`,
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
      done();
    });

    it("should 200 when credentials is valid", async done => {
      const user = testDbService.users[0];

      const response = await platform.app.inject({
        method: "POST",
        url: `${url}`,
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

      done();
    });
  });
});
