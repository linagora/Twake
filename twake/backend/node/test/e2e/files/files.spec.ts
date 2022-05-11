import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { ResourceUpdateResponse } from "../../../src/utils/types";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import fs from "fs";
import { File } from "../../../src/services/files/entities/file";
import { deserialize } from "class-transformer";
import formAutoContent from "form-auto-content";
import { MessageFile } from "../../../src/services/messages/entities/message-files";
import { createMessage, e2e_createThread } from "../messages/utils";

describe("The Files feature", () => {
  const url = "/internal/services/files/v1";
  let platform: TestPlatform;

  beforeAll(async () => {
    platform = await init({
      services: ["webserver", "database", "storage", "pubsub", "files", "previews"],
    });
  });

  afterAll(async done => {
    await platform?.tearDown();
    platform = null;
    done();
  });

  describe("On user send files", () => {
    const files = [
      "assets/sample.png",
      "assets/sample.gif",
      "assets/sample.pdf",
      "assets/sample.doc",
      "assets/sample.zip",
    ].map(p => `${__dirname}/${p}`);
    const thumbnails = [1, 1, 2, 5, 0];

    it("should save file and generate previews", async done => {
      for (const i in files) {
        const file = files[i];

        const form = formAutoContent({ file: fs.createReadStream(file) });
        form.headers["authorization"] = `Bearer ${await platform.auth.getJWTToken()}`;

        const filesUploadRaw = await platform.app.inject({
          method: "POST",
          url: `${url}/companies/${platform.workspace.company_id}/files?thumbnail_sync=1`,
          ...form,
        });
        const filesUpload: ResourceUpdateResponse<File> = deserialize(
          ResourceUpdateResponse,
          filesUploadRaw.body,
        );

        expect(filesUpload.resource.id).not.toBeFalsy();
        expect(filesUpload.resource.encryption_key).toBeFalsy(); //This must not be disclosed
        expect(filesUpload.resource.thumbnails.length).toBe(thumbnails[i]);

        for (const thumb of filesUpload.resource.thumbnails) {
          const thumbnails = await platform.app.inject({
            method: "GET",
            url: `${url}/companies/${platform.workspace.company_id}/files/${filesUpload.resource.id}/thumbnails/${thumb.index}`,
          });
          expect(thumbnails.statusCode).toBe(200);
        }
      }

      done();
    }, 120000);
  });

  describe("List user files", () => {
    const files = [
      "assets/sample.png",
      "assets/sample.gif",
      "assets/sample.pdf",
      "assets/sample.doc",
      "assets/sample.zip",
    ].map(p => `${__dirname}/${p}`);

    it("should not return downloaded files yet", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/files?type=user_download`,
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
          url: `${url}/companies/${platform.workspace.company_id}/files?thumbnail_sync=1`,
          ...form,
        });

        const resource = uploadedFile.json().resource;

        const messageFile: MessageFile = {
          id: resource.id,
          metadata: resource.metadata,
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
        url: `${url}/companies/${platform.workspace.company_id}/files?type=user_upload&limit=3`,
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
        url: `${url}/companies/${platform.workspace.company_id}/files?type=user_upload&page_token=${nextPageToken}limit=100`,
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
});
