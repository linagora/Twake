import { describe, expect, it, jest, beforeEach, afterEach, afterAll } from "@jest/globals";
import { generateVideoPreview } from "../../../../../../src/services/previews/services/processing/video";
import ffmpeg from "fluent-ffmpeg";
import { cleanFiles, getTmpFile } from "../../../../../../src/services/previews/utils";
import fs from "fs";

jest.mock("fluent-ffmpeg");
jest.mock("../../../../../../src/services/previews/utils");

const ffmpegMock = {
  screenshot: jest.fn().mockReturnValue({
    on: function (e, cb) {
      cb();
      return this;
    },
  }),
};

beforeEach(() => {
  jest.spyOn(fs, "statSync").mockReturnValue({ size: 1 } as any);
  (ffmpeg as any).mockImplementation(() => ffmpegMock);
  (cleanFiles as any).mockImplementation(() => jest.fn());
  (getTmpFile as any).mockImplementation(() => "/tmp/file");
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("the generateVideoPreview function", () => {
  it("should return a promise", () => {
    const result = generateVideoPreview([], { provider: "local", path: "foo" });
    expect(result).toBeInstanceOf(Promise);
  });

  it("should attempt to create a screenshot using ffmpeg", async () => {
    await generateVideoPreview(["/foo/bar"], { provider: "local", path: "foo" });
    expect(ffmpeg as any).toBeCalledWith("/foo/bar");
  });

  it("should call ffmpeg screenshot method with the correct arguments", async () => {
    (getTmpFile as any).mockImplementation(() => "/tmp/some-random-file");

    await generateVideoPreview(["/foo/bar"], {
      provider: "local",
      path: "foo",
      width: 500,
      height: 500,
    });
    expect(ffmpegMock.screenshot).toBeCalledWith({
      count: 1,
      filename: "some-random-file.png",
      folder: "/tmp",
      timemarks: ["0"],
      size: "500x500",
    });
  });

  it("should attempt to generate a temporary file", async () => {
    await generateVideoPreview(["/foo/bar"], { provider: "local", path: "foo" });

    expect(getTmpFile).toBeCalled();
  });

  it("should attempt to clean up the temporary file in case of errors", async () => {
    const error = new Error("foo");
    const expectedError = new Error("failed to generate video preview: Error: foo");
    (ffmpeg as any).mockImplementation(() => {
      throw error;
    });

    await expect(
      generateVideoPreview(["/foo/bar"], { provider: "local", path: "foo" }),
    ).rejects.toThrow(expectedError);

    expect(cleanFiles).toBeCalledWith(["/tmp/file.png"]);
  });

  it("should return the thumbnail information", async () => {
    const result = await generateVideoPreview(["/foo/bar"], { provider: "local", path: "foo" });
    expect(result).toEqual([
      {
        width: 320,
        height: 240,
        type: "image/png",
        size: 1,
        path: "/tmp/file.png",
      },
    ]);
  });

  it("should return the thumbnail information with the supplied dimensions", async () => {
    const result = await generateVideoPreview(["/foo/bar"], {
      provider: "local",
      path: "foo",
      width: 500,
      height: 500,
    });
    expect(result).toEqual([
      {
        width: 500,
        height: 500,
        type: "image/png",
        size: 1,
        path: "/tmp/file.png",
      },
    ]);
  });

  it("should generate thumbnails for multiple files", async () => {
    const result = await generateVideoPreview(["/foo/bar", "/foo/baz", "/foo/tar"], {
      provider: "local",
      path: "foo",
    });
    expect(result).toHaveLength(3);
  });
});
