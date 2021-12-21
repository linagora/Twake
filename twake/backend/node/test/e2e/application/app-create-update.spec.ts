import { beforeAll, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { TestDbService } from "../utils.prepare.db";
import { Api } from "../utils.api";
import Application, {
  PublicApplicationObject,
} from "../../../src/services/applications/entities/application";
import { cloneDeep } from "lodash";

import { logger as log } from "../../../src/core/platform/framework";
import { v1 as uuidv1 } from "uuid";

describe("Applications", () => {
  const url = "/internal/services/applications/v1";

  let platform: TestPlatform;
  let testDbService: TestDbService;
  let api: Api;
  let appRepo;

  beforeAll(async ends => {
    platform = await init();
    await platform.database.getConnector().drop();
    testDbService = await TestDbService.getInstance(platform, true);
    await testDbService.createDefault();
    postPayload.company_id = platform.workspace.company_id;
    api = new Api(platform);
    appRepo = await testDbService.getRepository("application", Application);
    ends();
  });

  afterAll(done => {
    platform.tearDown().then(done);
  });

  const publishApp = async id => {
    const entity = await appRepo.findOne({ id });
    if (!entity) throw new Error(`entity ${id} not found`);
    entity.publication.published = true;
    await appRepo.save(entity);
  };

  describe("Create application", function () {
    it("should 403 if creator is not a company admin", async done => {
      const payload = cloneDeep(postPayload);

      const user = await testDbService.createUser([testDbService.defaultWorkspace()], {
        companyRole: "member",
      });

      const response = await api.post(`${url}/applications`, payload, user.id);
      expect(response.statusCode).toBe(403);
      done();
    });

    it("should 200 on application create", async done => {
      const payload = cloneDeep(postPayload);
      const response = await api.post(`${url}/applications`, payload);
      expect(response.statusCode).toBe(200);

      const r = response.resource;

      expect(r.company_id).toBe(payload.company_id);
      expect(!!r.is_default).toBe(false);
      expect(r.identity).toMatchObject(payload.identity);
      expect(r.access).toMatchObject(payload.access);
      expect(r.display).toMatchObject(payload.display);
      expect(r.publication).toMatchObject(payload.publication);
      expect(r.stats).toMatchObject({
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
        version: 0,
      });

      expect(r.api).toMatchObject({
        hooksUrl: payload.api.hooksUrl,
        allowedIps: payload.api.allowedIps,
        privateKey: expect.any(String),
      });

      expect(r.api.privateKey).not.toBe("");

      const dbData = await appRepo.findOne({ id: response.resource.id });

      expect(dbData.api).toMatchObject({
        allowedIps: payload.api.allowedIps,
        hooksUrl: payload.api.hooksUrl,
        privateKey: expect.any(String),
      });

      done();
    });
  });
  describe("Update application", function () {
    let createdApp: PublicApplicationObject;

    beforeAll(async done => {
      const payload = cloneDeep(postPayload);
      const response = await api.post(`${url}/applications`, payload);
      createdApp = response.resource;

      done();
    });

    it("should 403 if editor is not a company admin", async done => {
      if (!createdApp) throw new Error("can't find created app");
      log.debug(createdApp);

      const user = await testDbService.createUser([testDbService.defaultWorkspace()], {
        companyRole: "member",
      });

      const response = await api.post(`${url}/applications/${createdApp.id}`, postPayload, user.id);
      expect(response.statusCode).toBe(403);
      done();
    });

    it("should 404 if application not found", async done => {
      const response = await api.post(`${url}/applications/${uuidv1()}`, postPayload);
      expect(response.statusCode).toBe(404);
      done();
    });

    describe("Unpublished application", () => {
      it("should 200 on application update", async done => {
        const payload = cloneDeep(postPayload);

        payload.is_default = true;
        payload.identity.name = "test2";
        payload.api.hooksUrl = "123123";
        payload.access.read = [];
        payload.publication.requested = true;

        const response = await api.post(`${url}/applications/${createdApp.id}`, payload);
        expect(response.statusCode).toBe(200);

        const r = response.resource;

        expect(r.company_id).toBe(payload.company_id);
        expect(!!r.is_default).toBe(false);
        expect(r.identity).toMatchObject(payload.identity);

        expect(r.access).toMatchObject(payload.access);
        expect(r.display).toMatchObject(payload.display);
        expect(r.publication).toMatchObject(payload.publication);
        expect(r.stats).toMatchObject({
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
          version: 1,
        });

        expect(r.api).toBeTruthy();

        const dbData = await appRepo.findOne({ id: response.resource.id });

        expect(dbData.api).toMatchObject({
          allowedIps: payload.api.allowedIps,
          hooksUrl: payload.api.hooksUrl,
          privateKey: expect.any(String),
        });

        done();
      });
    });

    describe.skip("Published application", () => {
      beforeAll(async done => {
        const payload = cloneDeep(postPayload);
        const response = await api.post(`${url}/applications`, payload);
        createdApp = response.resource;
        await publishApp(createdApp.id);
        done();
      });

      it("should 200 on update if allowed fields changed", async done => {
        const payload = cloneDeep(createdApp) as Application;
        const entity = await appRepo.findOne({ id: createdApp.id });
        payload.api = cloneDeep(entity.api);
        payload.publication.requested = true;
        const response = await api.post(`${url}/applications/${createdApp.id}`, payload);
        expect(response.statusCode).toBe(200);

        expect(response.resource.publication).toMatchObject({
          requested: true,
          published: true,
        });
        done();
      });

      it("should 400 on update if not allowed fields changed", async done => {
        const payload = cloneDeep(createdApp) as Application;
        const entity = await appRepo.findOne({ id: createdApp.id });
        payload.api = cloneDeep(entity.api);
        const response = await api.post(`${url}/applications/${createdApp.id}`, payload);
        expect(response.statusCode).toBe(400);
        done();
      });
    });
  });
  describe("Get applications", function () {
    let firstApp: PublicApplicationObject;
    let secondApp: PublicApplicationObject;
    let thirdApp: PublicApplicationObject;
    beforeAll(async done => {
      const payload = cloneDeep(postPayload);
      firstApp = (await api.post(`${url}/applications`, payload)).resource;
      secondApp = (await api.post(`${url}/applications`, payload)).resource;
      thirdApp = (await api.post(`${url}/applications`, payload)).resource;

      await publishApp(firstApp.id);
      await publishApp(secondApp.id);

      done();
    });

    it("should list published applications", async done => {
      const response = await api.get(`${url}/applications`);
      expect(response.statusCode).toBe(200);

      const published = response.resources.filter(a => a.publication.published).length;
      const unpublished = response.resources.filter(a => a.publication.unpublished).length;

      expect(published).toBeGreaterThanOrEqual(2);
      expect(unpublished).toEqual(0);

      expect(response.resources.map(a => a.id)).toEqual(
        expect.arrayContaining([firstApp.id, secondApp.id]),
      );

      done();
    });

    it("should return public object for published application to any user", async done => {
      const response = await api.get(`${url}/applications/${firstApp.id}`, uuidv1());
      expect(response.statusCode).toBe(200);
      expect(response.resource.id).toEqual(firstApp.id);
      expect(response.resource.api).toBeFalsy();
      done();
    });

    it("should return public object for unpublished application to any user", async done => {
      const response = await api.get(`${url}/applications/${thirdApp.id}`, uuidv1());
      expect(response.statusCode).toBe(200);
      expect(response.resource.id).toEqual(thirdApp.id);
      expect(response.resource.api).toBeFalsy();
      done();
    });

    it("should return whole object for published application to admin", async done => {
      const response = await api.get(`${url}/applications/${firstApp.id}`);
      expect(response.statusCode).toBe(200);
      expect(response.resource.id).toEqual(firstApp.id);
      expect(response.resource.api).toBeTruthy();

      done();
    });

    it("should return whole object for unpublished application to admin", async done => {
      const response = await api.get(`${url}/applications/${thirdApp.id}`);
      expect(response.statusCode).toBe(200);
      expect(response.resource.id).toEqual(thirdApp.id);
      expect(response.resource.api).toBeTruthy();
      done();
    });
  });
});

const postPayload = {
  is_default: true,
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
    hooksUrl: "hooksUrl",
    allowedIps: "allowedIps",
  },
  access: {
    read: ["messages"],
    write: ["messages"],
    delete: ["messages"],
    hooks: ["messages"],
  },
  display: {
    twake: {
      version: 1,

      files: {
        editor: {
          preview_url: "string", //Open a preview inline (iframe)
          edition_url: "string", //Url to edit the file (full screen)
          extensions: [], //Main extensions app can read
          // if file was created by the app, then the app is able to edit with or without extension
          empty_files: [
            {
              url: "string", // "https://[...]/empty.docx";
              filename: "string", // "Untitled.docx";
              name: "string", // "Word Document";
            },
          ],
        },
        actions: [
          //List of action that can apply on a file
          {
            name: "string",
            id: "string",
          },
        ],
      },

      //Chat plugin
      chat: {
        input: true,
        commands: [
          {
            command: "string", // my_app mycommand
            description: "string",
          },
        ],
        actions: [
          //List of action that can apply on a message
          {
            name: "string",
            id: "string",
          },
        ],
      },

      //Allow app to appear as a bot user in direct chat
      direct: false,

      //Display app as a standalone application in a tab
      tab: { url: "string" },

      //Display app as a standalone application on the left bar
      standalone: { url: "string" },

      //Define where the app can be configured from
      configuration: ["global", "channel"],
    },
  },
  publication: {
    requested: false, //Publication requested
  },
};
