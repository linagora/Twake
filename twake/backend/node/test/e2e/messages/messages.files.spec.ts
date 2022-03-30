import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { ResourceUpdateResponse } from "../../../src/utils/types";
import { deserialize } from "class-transformer";
import { Thread } from "../../../src/services/messages/entities/threads";
import { createMessage, e2e_createThread } from "./utils";
import { MessageFile } from "../../../src/services/messages/entities/message-files";
import { Message } from "../../../src/services/messages/entities/messages";

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

function getContext(platform: TestPlatform) {
  return {
    company: { id: platform.workspace.company_id },
    user: { id: platform.currentUser.id },
  };
}
