// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { beforeAll, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "./setup";
import { TestDbService } from "./utils.prepare.db";
import { Api } from "./utils.api";

describe("Applications", () => {
  const url = "/internal/services/applications/v1";

  let platform: TestPlatform;
  let testDbService: TestDbService;
  let api: Api;
  let companyId: string;

  beforeAll(async ends => {
    platform = await init();
    await platform.database.getConnector().drop();
    testDbService = await TestDbService.getInstance(platform, true);
    companyId = platform.workspace.company_id;
    api = new Api(platform);
    ends();
  });

  afterAll(done => {
    platform.tearDown().then(done);
  });

  describe("Create application", function () {
    it("should 200 on application create", async done => {
      const payload = { foo: "bar" };

      const response = await api.post(`${url}/applications2`, payload);
      expect(response.statusCode).toBe(200);

      done();
    });
  });
});
