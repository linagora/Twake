import { beforeAll, afterAll, afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { TestDbService } from "../utils.prepare.db";

describe("The /users API", () => {
  const url = "/internal/services/users/v1";
  let platform: TestPlatform;

  let testDbService: TestDbService;

  const nonExistentId = "11111111-1111-1111-1111-111111111111";
  const companyId = "21111111-1111-1111-1111-111111111111";
  const workspaceId = "31111111-1111-1111-1111-111111111111";

  beforeEach(async ends => {
    platform = await init({
      services: ["database", "search", "pubsub", "websocket", "webserver", "user", "auth"],
    });
    ends();
  });
  afterEach(async ends => {
    await platform.tearDown();
    platform = null;
    ends();
  });

  beforeAll(async ends => {
    const platform = await init({
      services: ["database", "search", "pubsub", "websocket", "webserver", "user", "auth"],
    });

    testDbService = new TestDbService(platform);
    await testDbService.createCompany(companyId);
    const workspacePk = { id: workspaceId, group_id: companyId };
    await testDbService.createWorkspace(workspacePk);
    await testDbService.createUser([workspacePk]);
    await testDbService.createUser([workspacePk]);

    ends();
  });

  afterAll(async ends => {
    ends();
  });

  describe("The GET /users/:id route", () => {
    it("should 401 when not authenticated", async done => {
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/users/1`,
      });

      expect(response.statusCode).toBe(401);
      done();
    });

    it("should 404 when user does not exists", async done => {
      const jwtToken = await platform.auth.getJWTToken({ sub: testDbService.users[0].id });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/users/${nonExistentId}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: "Not Found",
        message: `User ${nonExistentId} not found`,
        statusCode: 404,
      });
      done();
    });

    it("should 200 and big response for myself", async done => {
      const myId = testDbService.users[0].id;
      const jwtToken = await platform.auth.getJWTToken({ sub: myId });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/users/${myId}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const resource = response.json()["resource"];

      expect(resource).toMatchObject({
        id: myId,
        provider: expect.any(String),
        provider_id: expect.any(String),
        email: expect.any(String),
        is_verified: expect.any(Boolean),
        picture: expect.any(String),
        first_name: expect.any(String),
        last_name: expect.any(String),
        created_at: expect.any(Number),
        deleted: expect.any(Boolean),
        status: expect.any(String),
        last_activity: expect.any(Number),

        //Below is only if this is myself

        preference: expect.objectContaining({
          locale: expect.any(String),
          timezone: expect.any(Number),
        }),
      });

      expect(resource["companies"]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            role: expect.stringMatching(/owner|admin|member|guest/),
            status: expect.stringMatching(/active|deactivated|invited/),
            company: {
              id: expect.any(String),
              name: expect.any(String),
              logo: expect.any(String),
            },
          }),
        ]),
      );

      done();
    });

    it("should 200 and short response for another user", async done => {
      const myId = testDbService.users[0].id;
      const anotherUserId = testDbService.users[1].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: myId });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/users/${anotherUserId}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const resource = response.json()["resource"];

      expect(resource).toMatchObject({
        id: anotherUserId,
        provider: expect.any(String),
        provider_id: expect.any(String),
        email: expect.any(String),
        is_verified: expect.any(Boolean),
        picture: expect.any(String),
        first_name: expect.any(String),
        last_name: expect.any(String),
        created_at: expect.any(Number),
        deleted: expect.any(Boolean),
        status: expect.any(String),
        last_activity: expect.any(Number),
      });

      expect(resource).not.toMatchObject({
        locale: expect.anything(),
        timezone: expect.anything(),
        companies: expect.anything(),
      });

      done();
    });
  });

  describe("The GET /users route", () => {
    it("should 401 when user is not authenticated", async done => {
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/users`,
      });

      expect(response.statusCode).toBe(401);
      done();
    });

    it("should 200 with array of users", async done => {
      const myId = testDbService.users[0].id;
      const anotherUserId = testDbService.users[1].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: myId });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/users`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        query: {
          user_ids: `${myId},${anotherUserId}`,
          company_ids: "fd96c8a8-ae77-11eb-a1a1-0242ac120005",
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json).toMatchObject({ resources: expect.any(Array) });
      const resources = json.resources;

      done();
    });
  });

  describe("The GET /users/:user_id/companies route", () => {
    it("should 401 when not authenticated", async done => {
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/users/1/companies`,
      });

      expect(response.statusCode).toBe(401);
      done();
    });

    it("should 404 when user does not exists", async done => {
      const jwtToken = await platform.auth.getJWTToken({ sub: testDbService.users[0].id });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/users/${nonExistentId}/companies`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: "Not Found",
        message: `User ${nonExistentId} not found`,
        statusCode: 404,
      });
      done();
    });

    it("should 200 and on correct request", async done => {
      const myId = testDbService.users[0].id;
      const anotherUserId = testDbService.users[1].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: myId });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/users/${anotherUserId}/companies`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const resources = response.json()["resources"];
      expect(resources.length).toBeGreaterThan(0);

      for (const resource of resources) {
        expect(resource).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          logo: expect.any(String),
          role: expect.stringMatching(/owner|admin|member|guest/),
          status: expect.stringMatching(/active|deactivated|invited/),
        });

        if (resource.plan) {
          expect(resource.plan).toMatchObject({
            name: expect.any(String),
            limits: expect.objectContaining({
              members: expect.any(Number),
              guests: expect.any(Number),
              storage: expect.any(Number),
            }),
          });
        }
        if (resources.stats) {
          expect(resource.plan).toMatchObject({
            created_at: expect.any(Number),
            total_members: expect.any(Number),
            total_guests: expect.any(Number),
          });
        }
      }
      done();
    });
  });

  describe("The GET /companies/:company_id route", () => {
    it("should 404 when company does not exists", async done => {
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/11111111-1111-1111-1111-111111111111`,
      });
      expect(response.statusCode).toBe(404);
      done();
    });

    it("should 200 when company exists", async done => {
      const companyId = testDbService.company.id;

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}`,
      });
      expect(response.statusCode).toBe(200);

      const json = response.json();

      expect(json.resource).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        logo: expect.any(String),
      });

      if (json.resource.plan) {
        expect(json.resource.plan).toMatchObject({
          name: expect.any(String),
          limits: expect.objectContaining({
            members: expect.any(Number),
            guests: expect.any(Number),
            storage: expect.any(Number),
          }),
        });
      }

      if (json.resource.stats) {
        expect(json.resource.stats).toMatchObject({
          created_at: expect.any(Number),
          total_members: expect.any(Number),
          total_guests: expect.any(Number),
        });
      }

      done();
    });
  });

  describe("User's device management", () => {
    const device = "myDevice";

    describe("Register device (POST)", () => {
      it("should 400 when type is not FCM", async done => {
        const myId = testDbService.users[0].id;

        const jwtToken = await platform.auth.getJWTToken({ sub: myId });
        const response = await platform.app.inject({
          method: "POST",
          url: `${url}/devices`,
          headers: {
            authorization: `Bearer ${jwtToken}`,
          },
          payload: {
            resource: {
              type: "another",
              value: "value",
              version: "version",
            },
          },
        });

        const resp = response.json();
        expect(response.statusCode).toBe(400);
        expect(resp).toMatchObject({
          statusCode: 400,
          error: "Bad Request",
          message: "Type should be FCM only",
        });
        done();
      });

      it("should 200 when ok", async done => {
        const myId = testDbService.users[0].id;

        const jwtToken = await platform.auth.getJWTToken({ sub: myId });
        const response = await platform.app.inject({
          method: "POST",
          url: `${url}/devices`,
          headers: {
            authorization: `Bearer ${jwtToken}`,
          },
          payload: {
            resource: {
              type: "FCM",
              value: "value",
              version: "version",
            },
          },
        });

        const resp = response.json();
        expect(response.statusCode).toBe(200);

        expect(resp.resource).toMatchObject({
          type: "FCM",
          value: "value",
          version: "version",
        });

        done();
      });
    });

    describe.only("De-register device (DELETE)", () => {
      it("should 200 when ok", async done => {
        const myId = testDbService.users[0].id;

        const jwtToken = await platform.auth.getJWTToken({ sub: myId });
        const response = await platform.app.inject({
          method: "DELETE",
          url: `${url}/devices/${device}`,
          headers: {
            authorization: `Bearer ${jwtToken}`,
          },
        });
        expect(response.statusCode).toBe(204);
        done();
      });
    });
  });
});
