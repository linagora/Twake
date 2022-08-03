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

describe("The Messages Files feature", () => {
  const url = "/internal/services/messages/v1";
  let platform: TestPlatform;

  beforeEach(async () => {
    platform = await init({
      services: [
        "webserver",
        "database",
        "applications",
        "search",
        "storage",
        "message-queue",
        "user",
        "search",
        "files",
        "websocket",
        "messages",
        "auth",
        "realtime",
        "channels",
        "counter",
        "statistics",
        "platform-services",
      ],
    });
  });

  afterEach(async () => {
    await platform.tearDown();
  });

  describe("On user send files", () => {
    it("did add the files when full information is given (external source)", async done => {
      const file: MessageFile = {
        cache: { channel_id: "", company_id: "", user_id: "", workspace_id: "" },
        company_id: "",
        created_at: 0,
        id: "",
        metadata: {
          source: "linshare",
          external_id: "1234",
          name: "My LinShare File",
          thumbnails: [],
        },
      };

      const response = await e2e_createThread(
        platform,
        [],
        createMessage({ text: "Some message", files: [file] }),
      );
      const result: ResourceUpdateResponse<Thread & { message: Message }> = deserialize(
        ResourceUpdateResponse,
        response.body,
      );

      expect(result.resource.message.files.length).toBe(1);
      expect(result.resource.message.files[0].id).not.toBeFalsy();
      expect(result.resource.message.files[0].message_id).not.toBeFalsy();
      expect(result.resource.message.files[0].metadata.external_id).toBe("1234");
      expect(result.resource.message.files[0].metadata.source).toBe("linshare");

      done();
    });

    it("did not deduplicate files", async done => {
      const file: MessageFile = {
        cache: { channel_id: "", company_id: "", user_id: "", workspace_id: "" },
        company_id: "",
        created_at: 0,
        id: "",
        metadata: {
          source: "linshare",
          external_id: "1234",
          name: "My LinShare File",
          thumbnails: [],
        },
      };

      const file2: MessageFile = {
        cache: { channel_id: "", company_id: "", user_id: "", workspace_id: "" },
        company_id: "",
        created_at: 0,
        id: "",
        metadata: {
          source: "linshare2",
          external_id: "5678",
          name: "My LinShare 2 File",
          thumbnails: [],
        },
      };

      const response = await e2e_createThread(
        platform,
        [],
        createMessage({ text: "Some message", files: [file] }),
      );
      const result: ResourceUpdateResponse<Thread & { message: Message }> = deserialize(
        ResourceUpdateResponse,
        response.body,
      );

      const message = result.resource.message;
      const firstFileId = message.files[0].id;

      message.files.push(file2);

      const messageUpdatedRaw = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/threads/${message.thread_id}/messages/${message.id}`,
        headers: {
          authorization: `Bearer ${await platform.auth.getJWTToken()}`,
        },
        payload: {
          resource: message,
        },
      });
      const messageUpdated: ResourceUpdateResponse<Message> = deserialize(
        ResourceUpdateResponse,
        messageUpdatedRaw.body,
      );

      expect(messageUpdated.resource.files.length).toBe(2);
      expect(messageUpdated.resource.files.filter(f => f.id === firstFileId).length).toBe(1);

      done();
    });
  });
});

describe("List user files", () => {
  const filesUrl = "/internal/services/files/v1";
  const messagesUrl = "/internal/services/messages/v1";
  let platform: TestPlatform;

  beforeAll(async () => {
    platform = await init({
      services: ["webserver", "database", "storage", "message-queue", "files", "previews"],
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
    const jwtToken = await platform.auth.getJWTToken();

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

      expect(uploadedFile.statusCode).toBe(200);

      const resource = uploadedFile.json().resource;

      const messageFile: MessageFile = {
        cache: { channel_id: "", company_id: "", user_id: "", workspace_id: "" },
        created_at: 0,
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
        [],
        createMessage({ text: "Some message", files: [messageFile] }),
      );

      uploadedFiles.push(uploadedFile.json().resource);
    }

    function checkResource(resource) {
      expect(resource).toMatchObject({
        company_id: expect.any(String),
        id: expect.any(String),
        created_at: expect.any(Number),
        metadata: expect.any(Object),
      });
    }

    let response = await platform.app.inject({
      method: "GET",
      url: `${messagesUrl}/companies/${platform.workspace.company_id}/files?type=user_upload&limit=3`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(response.statusCode).toBe(200);

    let resources = response.json().resources;
    expect(resources.length).toBe(3);

    resources.forEach(checkResource);

    const nextPageToken = response.json().next_page_token;

    response = await platform.app.inject({
      method: "GET",
      url: `${messagesUrl}/companies/${platform.workspace.company_id}/files?type=user_upload&page_token=${nextPageToken}limit=100`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(response.statusCode).toBe(200);

    resources = response.json().resources;
    expect(resources.length).toBe(5);

    expect(response.json().resources[0]).toMatchObject({
      company_id: expect.any(String),
      id: expect.any(String),
      created_at: expect.any(Number),
      metadata: expect.any(Object),
      user: expect.any(Object),
      context: expect.any(Object),
    });

    resources.forEach(checkResource);

    done();
  });

  it("should return downloaded files", async done => {
    const jwtToken = await platform.auth.getJWTToken({ sub: v1() });
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

      const messageFile: MessageFile = {
        cache: { channel_id: "", company_id: "", user_id: "", workspace_id: "" },
        created_at: 0,
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

      const thread = await e2e_createThread(
        platform,
        [],
        createMessage({ text: "Some message", files: [messageFile] }),
      );

      uploadedFiles.push(uploadedFile.json().resource);

      await platform.app.inject({
        method: "POST",
        url: `${messagesUrl}/companies/${platform.workspace.company_id}/threads/${
          thread.json().resource.message.thread_id
        }/messages/${thread.json().resource.message.id}/download/${
          thread.json().resource.message.files[0].id
        }`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await platform.app.inject({
      method: "GET",
      url: `${messagesUrl}/companies/${platform.workspace.company_id}/files?type=user_download`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(response.statusCode).toBe(200);

    expect(response.json().resources.length).toBe(5);

    expect(response.json().resources[0]).toMatchObject({
      company_id: expect.any(String),
      id: expect.any(String),
      created_at: expect.any(Number),
      metadata: expect.any(Object),
      user: expect.any(Object),
      context: expect.any(Object),
    });

    done();
  });
});

function getContext(platform: TestPlatform) {
  return {
    company: { id: platform.workspace.company_id },
    user: { id: platform.currentUser.id },
  };
}
