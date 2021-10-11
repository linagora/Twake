import "reflect-metadata";
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
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

  beforeAll(async () => {
    console.log("ENTERED before all", new Date());
    platform = await init({
      services: ["webserver", "database", "storage", "pubsub", "files", "previews"],
    });
  });

  afterAll(async done => {
    console.log("ENTERED after all", new Date());
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

    it(`should save file and generate previews`, async done => {
      for (const i in files) {
        const file = files[i];

        console.log(`Testing file ${file}`, new Date());

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

        console.log(`Finished testing file ${file}`, new Date());
        console.log(`Result ${JSON.stringify(filesUpload.resource)}`);

        expect(filesUpload.resource.id).not.toBeFalsy();
        expect(filesUpload.resource.encryption_key).toBeFalsy(); //This must not be disclosed
        expect(filesUpload.resource.thumbnails.length).toBe(thumbnails[i]);

        for (const thumb of filesUpload.resource.thumbnails) {
          console.log(`Get thumbnail ${thumb.id}`, new Date());
          const thumbnails = await platform.app.inject({
            method: "GET",
            url: `${url}/companies/${platform.workspace.company_id}/files/${filesUpload.resource.id}/thumbnails/${thumb.index}`,
          });
          expect(thumbnails.statusCode).toBe(200);
          console.log(`Did get thumbnail ${thumb.id}`, new Date());
        }
      }

      console.log("DID finish");
      done();
    }, 120000);
  });
});
