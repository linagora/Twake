import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
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

  beforeAll(async () => {
    platform = await init();
    await platform.database.getConnector().drop();
    testDbService = await TestDbService.getInstance(platform, true);
    await testDbService.createDefault();
    postPayload.company_id = platform.workspace.company_id;
    api = new Api(platform);
    appRepo = await testDbService.getRepository("application", Application);
  });

  afterAll(async () => {
    await platform.tearDown();
  });

  const publishApp = async id => {
    const entity = await appRepo.findOne({ id });
    if (!entity) throw new Error(`entity ${id} not found`);
    entity.publication.published = true;
    await appRepo.save(entity);
  };

  describe("Create application", function () {
    it("should 403 if creator is not a company admin", async () => {
      const payload = { resource: cloneDeep(postPayload) };

      const user = await testDbService.createUser([testDbService.defaultWorkspace()], {
        companyRole: "member",
      });

      const response = await api.post(`${url}/applications`, payload, user.id);
      expect(response.statusCode).toBe(403);
    });

    it("should 200 on application create", async () => {
      const payload = { resource: cloneDeep(postPayload) };
      const response = await api.post(`${url}/applications`, payload);
      expect(response.statusCode).toBe(200);

      const r = response.resource;

      expect(r.company_id).toBe(payload.resource.company_id);
      expect(!!r.is_default).toBe(false);
      expect(r.identity).toMatchObject(payload.resource.identity);
      expect(r.access).toMatchObject(payload.resource.access);
      expect(r.display).toMatchObject(payload.resource.display);
      expect(r.publication).toMatchObject(payload.resource.publication);
      expect(r.stats).toMatchObject({
        created_at: expect.any(Number),
        updated_at: expect.any(Number),
        version: 0,
      });

      expect(r.api).toMatchObject({
        hooks_url: payload.resource.api.hooks_url,
        allowed_ips: payload.resource.api.allowed_ips,
        private_key: expect.any(String),
      });

      expect(r.api.private_key).not.toBe("");

      const dbData = await appRepo.findOne({ id: response.resource.id });

      expect(dbData.api).toMatchObject({
        allowed_ips: payload.resource.api.allowed_ips,
        hooks_url: payload.resource.api.hooks_url,
        private_key: expect.any(String),
      });

    });
  });
  describe("Update application", function () {
    let createdApp: PublicApplicationObject;

    beforeAll(async () => {
      const payload = { resource: cloneDeep(postPayload) };
      const response = await api.post(`${url}/applications`, payload);
      createdApp = response.resource;

    });

    it("should 403 if editor is not a company admin", async () => {
      if (!createdApp) throw new Error("can't find created app");
      log.debug(createdApp);

      const user = await testDbService.createUser([testDbService.defaultWorkspace()], {
        companyRole: "member",
      });

      const response = await api.post(`${url}/applications/${createdApp.id}`, postPayload, user.id);
      expect(response.statusCode).toBe(403);
    });

    it("should 404 if application not found", async () => {
      const response = await api.post(`${url}/applications/${uuidv1()}`, { resource: postPayload });
      expect(response.statusCode).toBe(404);
    });

    describe("Unpublished application", () => {
      it("should 200 on application update", async () => {
        const payload = { resource: cloneDeep(postPayload) };

        payload.resource.is_default = true;
        payload.resource.identity.name = "test2";
        payload.resource.api.hooks_url = "123123";
        payload.resource.access.read = [];
        payload.resource.publication.requested = true;

        const response = await api.post(`${url}/applications/${createdApp.id}`, payload);
        expect(response.statusCode).toBe(200);

        const r = response.resource;

        expect(r.company_id).toBe(payload.resource.company_id);
        expect(!!r.is_default).toBe(false);
        expect(r.identity).toMatchObject(payload.resource.identity);

        expect(r.access).toMatchObject(payload.resource.access);
        expect(r.display).toMatchObject(payload.resource.display);
        expect(r.publication).toMatchObject(payload.resource.publication);
        expect(r.stats).toMatchObject({
          created_at: expect.any(Number),
          updated_at: expect.any(Number),
          version: 1,
        });

        expect(r.api).toBeTruthy();

        const dbData = await appRepo.findOne({ id: response.resource.id });

        expect(dbData.api).toMatchObject({
          allowed_ips: payload.resource.api.allowed_ips,
          hooks_url: payload.resource.api.hooks_url,
          private_key: expect.any(String),
        });

      });
    });

    describe.skip("Published application", () => {
      beforeAll(async () => {
        const payload = { resource: cloneDeep(postPayload) };
        const response = await api.post(`${url}/applications`, payload);
        createdApp = response.resource;
        await publishApp(createdApp.id);
      });

      it("should 200 on update if allowed fields changed", async () => {
        const payload = { resource: cloneDeep(createdApp) as Application };
        const entity = await appRepo.findOne({ id: createdApp.id });
        payload.resource.api = cloneDeep(entity.api);
        payload.resource.publication.requested = true;
        const response = await api.post(`${url}/applications/${createdApp.id}`, payload);
        expect(response.statusCode).toBe(200);

        expect(response.resource.publication).toMatchObject({
          requested: true,
          published: true,
        });
      });

      it("should 400 on update if not allowed fields changed", async () => {
        const payload = { resource: cloneDeep(createdApp) as Application };
        const entity = await appRepo.findOne({ id: createdApp.id });
        payload.resource.api = cloneDeep(entity.api);
        const response = await api.post(`${url}/applications/${createdApp.id}`, payload);
        expect(response.statusCode).toBe(400);
      });
    });
  });
  describe("Get applications", function () {
    let firstApp: PublicApplicationObject;
    let secondApp: PublicApplicationObject;
    let thirdApp: PublicApplicationObject;
    beforeAll(async () => {
      const payload = { resource: cloneDeep(postPayload) };
      firstApp = (await api.post(`${url}/applications`, payload)).resource;
      secondApp = (await api.post(`${url}/applications`, payload)).resource;
      thirdApp = (await api.post(`${url}/applications`, payload)).resource;

      await publishApp(firstApp.id);
      await publishApp(secondApp.id);

    });

    it("should list published applications", async () => {
      const response = await api.get(`${url}/applications`);
      expect(response.statusCode).toBe(200);

      const published = response.resources.filter(a => a.publication.published).length;
      const unpublished = response.resources.filter(a => a.publication.unpublished).length;

      expect(published).toBeGreaterThanOrEqual(2);
      expect(unpublished).toEqual(0);

      expect(response.resources.map(a => a.id)).toEqual(
        expect.arrayContaining([firstApp.id, secondApp.id]),
      );

    });

    it("should return public object for published application to any user", async () => {
      const response = await api.get(`${url}/applications/${firstApp.id}`, uuidv1());
      expect(response.statusCode).toBe(200);
      expect(response.resource.id).toEqual(firstApp.id);
      expect(response.resource.api).toBeFalsy();
    });

    it("should return public object for unpublished application to any user", async () => {
      const response = await api.get(`${url}/applications/${thirdApp.id}`, uuidv1());
      expect(response.statusCode).toBe(200);
      expect(response.resource.id).toEqual(thirdApp.id);
      expect(response.resource.api).toBeFalsy();
    });

    it("should return whole object for published application to admin", async () => {
      const response = await api.get(`${url}/applications/${firstApp.id}`);
      expect(response.statusCode).toBe(200);
      expect(response.resource.id).toEqual(firstApp.id);
      expect(response.resource.api).toBeTruthy();

    });

    it("should return whole object for unpublished application to admin", async () => {
      const response = await api.get(`${url}/applications/${thirdApp.id}`);
      expect(response.statusCode).toBe(200);
      expect(response.resource.id).toEqual(thirdApp.id);
      expect(response.resource.api).toBeTruthy();
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
    hooks_url: "hooks_url",
    allowed_ips: "allowed_ips",
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
