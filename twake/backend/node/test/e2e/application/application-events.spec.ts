import * as crypto from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { FastifyInstance, FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";

import { init, TestPlatform } from "../setup";
import { TestDbService } from "../utils.prepare.db";
import { Api } from "../utils.api";

import { logger as log } from "../../../src/core/platform/framework";

let signingSecret = "";

describe("Application events", () => {
  const url = "/internal/services/applications/v1";
  let platform: TestPlatform;
  let testDbService: TestDbService;
  let api: Api;
  let appId: string;

  beforeAll(async ends => {
    platform = await init(undefined, testAppHookRoute);

    await platform.database.getConnector().drop();

    testDbService = await TestDbService.getInstance(platform, true);
    api = new Api(platform);

    postPayload.company_id = platform.workspace.company_id;

    const createdApplication = await api.post("/internal/services/applications/v1/applications", {
      resource: postPayload,
    });

    appId = createdApplication.resource.id;
    signingSecret = createdApplication.resource.api.private_key;

    ends();

    afterAll(done => {
      platform.tearDown().then(() => done());
    });
  });

  it("Should 200 on sending well formed event", async done => {
    const payload = {
      company_id: platform.workspace.company_id,
      workspace_id: platform.workspace.workspace_id,
      type: "some type",
      name: "name",
      content: {},
    };

    const response = await api.post(`${url}/applications/${appId}/event`, payload);
    expect(response.statusCode).toBe(200);
    expect(response.resource).toMatchObject({ a: "b" });
    done();
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
    hooks_url: "http://localhost:3000/test/appHook",
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

const testAppHookRoute = (fastify: FastifyInstance) => {
  const routes: FastifyPluginCallback = (fastify: FastifyInstance, options, next) => {
    fastify.route({
      method: "POST",
      url: "/test/appHook",
      handler: (request: FastifyRequest, reply: FastifyReply): Promise<any> => {
        const signature = request.headers["x-twake-signature"];
        if (!signature) {
          reply.status(403);
          reply.send({ error: "Signature is missing" });
          return undefined;
        }

        const expectedSignature = crypto
          .createHmac("sha256", signingSecret)
          .update(JSON.stringify(request.body))
          .digest("hex");
        if (expectedSignature != signature) {
          reply.status(403);
          reply.send({ error: "Wrong signature" });
          return undefined;
        }

        log.debug({ signatureMatched: expectedSignature == signature });
        return Promise.resolve({ a: "b" });
      },
    });

    next();
  };
  fastify.register(routes);
};
