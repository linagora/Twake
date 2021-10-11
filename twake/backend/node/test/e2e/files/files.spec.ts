import "reflect-metadata";
import { describe, it, beforeEach, afterEach, expect } from "@jest/globals";
import { TestPlatform, init } from "../setup";
import { ResourceUpdateResponse } from "../../../src/utils/types";
import fs from "fs";
import { File } from "../../../src/services/files/entities/file";
import { deserialize } from "class-transformer";
import formAutoContent from "form-auto-content";

describe("The Files feature", () => {
  const url = "/internal/services/files/v1";
  let platform: TestPlatform;

  console.log("nothing");

  beforeEach(async () => {
    platform = await init({
      services: ["webserver", "database", "storage", "pubsub", "files", "previews"],
    });
  });

  afterEach(async done => {
    await platform?.tearDown();
    platform = null;
    done();
  });

  describe("On user send files", () => {
    return;

    const files = [
      "assets/sample.png",
      "assets/sample.gif",
      "assets/sample.pdf",
      "assets/sample.doc",
    ].map(p => `${__dirname}/${p}`);
    const thumbnails = [1, 1, 2, 5];

    it(`should save file and generate previews`, async done => {
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

        console.log(`Testing file ${file}`);
        expect(filesUpload.resource.id).not.toBeFalsy();
        expect(filesUpload.resource.encryption_key).toBeFalsy(); //This must not be disclosed
        expect(filesUpload.resource.thumbnails.length).toBe(thumbnails[i]);
        console.log(`Finished testing file ${file}`);
      }

      done();
    }, 120000);
  });
});
