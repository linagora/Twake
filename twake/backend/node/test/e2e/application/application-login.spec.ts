import { beforeAll, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { TestDbService } from "../utils.prepare.db";
import { Api } from "../utils.api";
import { logger as log } from "../../../src/core/platform/framework";
import { randomBytes } from "crypto";
import { ApplicationLoginResponse } from "../../../src/services/applicationsapi/web/types";
import { cloneDeep } from "lodash";

describe("Applications", () => {
  let platform: TestPlatform;
  let testDbService: TestDbService;
  let api: Api;
  let appId: string;
  let private_key: string;
  let accessToken: ApplicationLoginResponse["access_token"];

  beforeAll(async ends => {
    platform = await init();
    await platform.database.getConnector().drop();
    testDbService = await TestDbService.getInstance(platform, true);
    api = new Api(platform);

    postPayload.company_id = platform.workspace.company_id;

    const createdApplication = await api.post(
      "/internal/services/applications/v1/applications",
      postPayload,
    );

    appId = createdApplication.resource.id;
    private_key = createdApplication.resource.api.private_key;

    ends();
  });

  afterAll(done => {
    platform.tearDown().then(done);
  });

  describe("Login", function () {
    it("Should be ok on valid token", async done => {
      expect(appId).toBeTruthy();

      const response = await api.post("/api/console/v1/login", {
        id: appId,
        secret: private_key,
      });
      expect(response.statusCode).toBe(200);

      const resource = (await response.json()).resource as ApplicationLoginResponse;

      expect(resource).toMatchObject({
        access_token: {
          time: expect.any(Number),
          expiration: expect.any(Number),
          refresh_expiration: expect.any(Number),
          value: expect.any(String),
          refresh: expect.any(String),
          type: expect.any(String),
        },
      });

      accessToken = resource.access_token;

      done();
    });
  });

  describe("Get myself", function () {
    it("Should be 401 on invalid token", async done => {
      const response = await platform.app.inject({
        method: "GET",
        url: "/api/console/v1/me",
        headers: {
          authorization: `Bearer ${accessToken.value + "!!"}`,
        },
      });
      log.debug(response.json());
      expect(response.statusCode).toBe(401);
      done();
    });

    it("Should be 403 on auth by users (not company) token", async done => {
      const userToken = await platform.auth.getJWTToken();

      const response = await platform.app.inject({
        method: "GET",
        url: "/api/console/v1/me",
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });
      log.debug(response.json());
      expect(response.statusCode).toBe(403);
      done();
    });

    it("Should be ok on valid token", async done => {
      const response = await platform.app.inject({
        method: "GET",
        url: "/api/console/v1/me",
        headers: {
          authorization: `Bearer ${accessToken.value}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const resource = (await response.json()).resource;
      log.debug(resource);
      expect(resource).toMatchObject(postPayload);
      done();
    });
  });
});

const postPayload = {
  is_default: false,
  company_id: null,
  identity: {
    code: "code",
    name: "name",
    icon: "icon",
    description: "description",
    website: "website",
    categories: [],
    compatibility: [],
  },
  api: {
    hooks_url: "hooks_url",
    allowed_ips: "allowed_ips",
  },
  access: {
    read: ["messages"],
    write: ["messages"],
    delete: ["messages"],
    hooks: ["messages"],
  },
  display: {},
  publication: {
    requested: true,
  },
};
