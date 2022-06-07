import "reflect-metadata";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { ResourceUpdateResponse } from "../../../src/utils/types";
import { deserialize } from "class-transformer";
import { Thread } from "../../../src/services/messages/entities/threads";
import { createMessage, e2e_createThread } from "./utils";
import { MessageFile } from "../../../src/services/messages/entities/message-files";
import { Message } from "../../../src/services/messages/entities/messages";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import fs from "fs";
import formAutoContent from "form-auto-content";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import uuid, { v1 } from "node-uuid";

describe("Search files", () => {
  const filesUrl = "/internal/services/files/v1";
  const messagesUrl = "/internal/services/messages/v1";
  let platform: TestPlatform;

  beforeAll(async () => {
    platform = await init({
      services: ["webserver", "database", "storage", "pubsub", "files", "previews"],
    });
    await platform.database.getConnector().drop();
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

  it("should return uploaded files", async done => {
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

      uploadedFiles.push(uploadedFile.json().resource);
    }

    let resources = await search("sample.png");
    expect(resources.length).toEqual(1);

    resources = await search("sample");
    expect(resources.length).toEqual(5);

    resources = await search("sam");
    expect(resources.length).toEqual(5);

    resources = await search("sample", { extension: "png" });
    expect(resources.length).toEqual(5);

    resources = await search("sample", { is_file: true });
    expect(resources.length).toEqual(3);

    resources = await search("sample", { is_media: true });
    expect(resources.length).toEqual(2);

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
