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
import uuid from "node-uuid";

describe("The Messages Threads feature", () => {
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
        "pubsub",
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
        metadata: {
          source: "linshare",
          external_id: "1234",
          name: "My LinShare File",
          type: "image/png",
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
        metadata: {
          source: "linshare",
          external_id: "1234",
          name: "My LinShare File",
          type: "image/png",
          thumbnails: [],
        },
      };

      const file2: MessageFile = {
        metadata: {
          source: "linshare2",
          external_id: "5678",
          name: "My LinShare 2 File",
          type: "image/png",
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

  it("should not return downloaded files yet", async done => {
    const jwtToken = await platform.auth.getJWTToken();
    const response = await platform.app.inject({
      method: "GET",
      url: `${messagesUrl}/companies/${platform.workspace.company_id}/files?type=user_download`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });

    expect(response.statusCode).toBe(501); // not implemented

    done();
  });

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

      const resource = uploadedFile.json().resource;

      const messageFile: MessageFile = {
        id: uuid.v1(),
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
        user_id: expect.any(String),
        updated_at: expect.any(Number),
        created_at: expect.any(Number),
        metadata: expect.any(Object),
        thumbnails: expect.any(Array),
        upload_data: expect.any(Object),
      });
    }

    let response = await platform.app.inject({
      method: "GET",
      url: `${messagesUrl}/companies/${platform.workspace.company_id}/files?type=user_upload&limit=3`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    console.log(response.json());

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

    expect(response.statusCode).toBe(200);

    resources = response.json().resources;
    expect(resources.length).toBe(2);

    resources.forEach(checkResource);

    done();
  });
});

function getContext(platform: TestPlatform) {
  return {
    company: { id: platform.workspace.company_id },
    user: { id: platform.currentUser.id },
  };
}
