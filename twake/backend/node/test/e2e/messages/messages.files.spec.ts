import "reflect-metadata";
import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { TestPlatform, init } from "../setup";
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
    /*
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

      const response = await e2e_createThread(
        platform,
        [],
        createMessage({ text: "Some message", files: [file] }),
      );
      const result: ResourceUpdateResponse<Thread & { message: Message }> = deserialize(
        ResourceUpdateResponse,
        response.body,
      );

      done();
    });*/
  });
});

function getContext(platform: TestPlatform) {
  return {
    company: { id: platform.workspace.company_id },
    user: { id: platform.currentUser.id },
  };
}
