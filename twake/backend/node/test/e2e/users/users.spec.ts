import { beforeAll, afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { TestUsers } from "./utils";

describe("The /users API", () => {
  const url = "/internal/services/users/v1/users";
  let platform: TestPlatform;
  jest.setTimeout(30000);

  let testUsers: TestUsers;

  beforeEach(async ends => {
    platform = await init({
      services: ["database", "pubsub", "websocket", "webserver", "user", "auth"],
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
      services: ["database", "pubsub", "websocket", "webserver", "user", "auth"],
    });
    testUsers = new TestUsers(platform);
    await testUsers.createCompanyAndUsers();
    ends();
  });

  afterAll(async ends => {
    await testUsers.deleteAll();
    ends();
  });

  describe("The GET /users/:id route", () => {
    it("should 401 when not authenticated", async done => {
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/1`,
      });

      expect(response.statusCode).toBe(401);
      done();
    });

    it("should 404 when user does not exists", async done => {
      const id = "11111111-1111-1111-1111-111111111111";
      const jwtToken = await platform.auth.getJWTToken({ sub: testUsers.users[0].id });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/${id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: "Not Found",
        message: `User ${id} not found`,
        statusCode: 404,
      });
      done();
    });

    it("should 200 and big response for myself", async done => {
      const myId = testUsers.users[0].id;
      const jwtToken = await platform.auth.getJWTToken({ sub: myId });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/${myId}`,
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
      const myId = testUsers.users[0].id;
      const anotherUserId = testUsers.users[1].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: myId });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/${anotherUserId}`,
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
        url,
      });

      expect(response.statusCode).toBe(401);
      done();
    });

    it("should 200 with array of users", async done => {
      const myId = testUsers.users[0].id;
      const anotherUserId = testUsers.users[1].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: myId });
      const response = await platform.app.inject({
        method: "GET",
        url,
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
        url: `${url}/1/companies`,
      });

      expect(response.statusCode).toBe(401);
      done();
    });

    it("should 404 when user does not exists", async done => {
      const id = "11111111-1111-1111-1111-111111111111";
      const jwtToken = await platform.auth.getJWTToken({ sub: testUsers.users[0].id });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/${id}/companies`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: "Not Found",
        message: `User ${id} not found`,
        statusCode: 404,
      });
      done();
    });

    it("should 200 and on correct request", async done => {
      const myId = testUsers.users[0].id;
      const anotherUserId = testUsers.users[1].id;

      const jwtToken = await platform.auth.getJWTToken({ sub: myId });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/${anotherUserId}/companies`,
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

  describe.skip("The GET /companies/:company_id route", () => {
    it("should 404 when company does not exists", async done => {
      const response = await platform.app.inject({
        method: "GET",
        url: "/companies/1",
      });
      expect(response.statusCode).toBe(404);
      done();
    });

    it("should 200 when company exists", async done => {
      const companyId = testUsers.company.id;
      const response = await platform.app.inject({
        method: "GET",
        url: `/companies/${companyId}`,
      });
      expect(response.statusCode).toBe(200);
      done();
    });
  });
});
