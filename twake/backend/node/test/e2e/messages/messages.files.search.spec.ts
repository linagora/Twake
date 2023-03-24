import "reflect-metadata";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { createMessage, createParticipant, e2e_createThread } from "./utils";
import { MessageFile } from "../../../src/services/messages/entities/message-files";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import fs from "fs";
import formAutoContent from "form-auto-content";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import uuid, { v1 } from "node-uuid";
import { ChannelUtils, get as getChannelUtils } from "../channels/utils";
import gr from "../../../src/services/global-resolver";
import User from "../../../src/services/user/entities/user";
import { WorkspaceExecutionContext } from "../../../src/services/channels/types";

describe("Search files", () => {
  const filesUrl = "/internal/services/files/v1";
  const messagesUrl = "/internal/services/messages/v1";
  let platform: TestPlatform;
  let channelUtils: ChannelUtils;

  beforeAll(async () => {
    platform = await init({
      services: ["webserver", "database", "storage", "message-queue", "files", "previews"],
    });
    await platform.database.getConnector().drop();
    channelUtils = getChannelUtils(platform);
  });

  afterAll(async done => {
    await platform?.tearDown();
    platform = null;
    done();
  });

  const files = [
    "../files/assets/sample.png",
    "../files/assets/sample.gif",
    "../files/assets/sample.pdf",
    "../files/assets/sample.doc",
    "../files/assets/sample.zip",
  ].map(p => `${__dirname}/${p}`);

  function getContext(user?: User): WorkspaceExecutionContext {
    return {
      workspace: platform.workspace,
      user: user || platform.currentUser,
    };
  }

  it("should return uploaded files", async done => {
    let channel = channelUtils.getChannel();
    channel = (await gr.services.channels.channels.save(channel, {}, getContext())).entity;
    const channelId = channel.id;

    const uploadedFiles = [];
    for (const i in files) {
      const file = files[i];

      const form = formAutoContent({ file: fs.createReadStream(file) });
      form.headers["authorization"] = `Bearer ${await platform.auth.getJWTToken()}`;

      const uploadedFile = await platform.app.inject({
        method: "POST",
        url: `${filesUrl}/companies/${platform.workspace.company_id}/files?thumbnail_sync=1`,
        ...form,
      });

      const resource = uploadedFile.json().resource;

      const messageFile: Partial<MessageFile> = {
        id: uuid.v1(),
        company_id: platform.workspace.company_id,
        metadata: {
          source: "internal",
          external_id: {
            company_id: platform.workspace.company_id,
            id: resource.id,
          },
          ...resource.metadata,
        },
      };

      await e2e_createThread(
        platform,
        [
          createParticipant(
            {
              type: "channel",
              id: channelId,
            },
            platform,
          ),
        ],
        createMessage({ text: "Some message", files: [messageFile] }),
      );

      uploadedFiles.push(uploadedFile.json().resource);
    }

    await new Promise(r => setTimeout(r, 2000));

    let resources = await search("sample");
    expect(resources.length).toEqual(5);

    resources = await search("sample", { extension: "png" });
    expect(resources.length).toEqual(1);

    resources = await search("sample", { is_file: true });
    expect(resources.length).toEqual(3);

    resources = await search("sample", { is_media: true });
    expect(resources.length).toEqual(2);

    resources = await search("sam");
    expect(resources.length).toEqual(5);

    done();
  });

  async function search(
    searchString: string,
    options?: {
      company_id?: string;
      workspace_id?: string;
      channel_id?: string;
      limit?: number;
      sender?: string;
      is_file?: boolean;
      is_media?: boolean;
      extension?: string;
    },
  ): Promise<any[]> {
    const jwtToken = await platform.auth.getJWTToken();

    const query: any = options || {};

    const response = await platform.app.inject({
      method: "GET",
      url: `${messagesUrl}/companies/${platform.workspace.company_id}/files/search`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
      query: {
        ...query,
        q: searchString,
      },
    });

    expect(response.statusCode).toBe(200);
    const json = response.json();
    expect(json).toMatchObject({ resources: expect.any(Array) });
    const resources = json.resources;
    return resources;
  }
});

function getContext(platform: TestPlatform) {
  return {
    company: { id: platform.workspace.company_id },
    user: { id: platform.currentUser.id },
  };
}
