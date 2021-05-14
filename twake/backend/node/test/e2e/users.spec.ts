import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "./setup";

const myId = "9ba49092-af64-11eb-90a9-0242ac150004";
const anotherUserId = "f4a5cc9e-ae77-11eb-b120-0242ac120005";

describe("The /users API", () => {
  const url = "/internal/services/users/v1/users";
  let platform: TestPlatform;
  jest.setTimeout(30000);

  beforeEach(async ends => {
    platform = await init({
      services: ["database", "pubsub", "websocket", "webserver", "user", "auth"],
    });
    ends();
  });

  afterEach(async () => {
    await platform.tearDown();
    platform = null;
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
      const jwtToken = await platform.auth.getJWTToken({ sub: myId });
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
      const id = "9ba49092-af64-11eb-90a9-0242ac150004";
      const jwtToken = await platform.auth.getJWTToken({ sub: id });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/${id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const resource = response.json()["resource"];

      expect(resource).toMatchObject({
        id: id,
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
            // status: expect.stringMatching(/active|deactivated|invited/),
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

  describe.only("The GET /users route", () => {
    it("should 401 when user is not authenticated", async done => {
      const response = await platform.app.inject({
        method: "GET",
        url,
      });

      expect(response.statusCode).toBe(401);
      done();
    });

    it.only("should 200 with array of users", /**
     *
     */ async done => {
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

      console.log(JSON.stringify(resources, null, 2));

      done();
    });
  });

  describe.skip("The POST /users route", () => {
    it("should 401 when not authenticated", async done => {
      const response = await platform.app.inject({
        method: "POST",
        url,
      });

      expect(response.statusCode).toBe(401);
      done();
    });

    it("should 400 if body is not defined", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "POST",
        url,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toBe(400);
      done();
    });

    it("should 400 if body is empty JSON", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "POST",
        url,
        payload: {},
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toBe(400);
      done();
    });

    it("should 400 if body.email is not defined", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "POST",
        url,
        payload: {
          notemail: "test",
        },
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toBe(400);
      done();
    });

    it("should create the user and send it back", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "POST",
        url,
        payload: {
          email: "me@twakeapp.com",
        },
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toBe(201);
      done();
    });
  });
});
