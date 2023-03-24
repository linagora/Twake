import { describe, expect, it, jest, beforeEach, afterEach, afterAll } from "@jest/globals";
import { generateVideoPreview } from "../../../../../../../src/services/previews/services/files/processing/video";
import ffmpeg, { ffprobe } from "fluent-ffmpeg";
import { cleanFiles, getTmpFile } from "../../../../../../../src/services/previews/utils";
import fs from "fs";

jest.mock("fluent-ffmpeg");
jest.mock("../../../../../../../src/services/previews/utils");

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
  (ffprobe as any).mockImplementation((i, cb) => {
    cb(null, {
      streams: [
        {
          width: 320,
          height: 240,
        },
      ],
    });
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("the generateVideoPreview function", () => {
  it("should return a promise", () => {
    const result = generateVideoPreview([]);
    expect(result).toBeInstanceOf(Promise);
  });

  it("should attempt to create a screenshot using ffmpeg", async () => {
    await generateVideoPreview(["/foo/bar"]);
    expect(ffmpeg as any).toBeCalledWith("/foo/bar");
  });

  it("should call ffmpeg screenshot method with the original video dimentions", async () => {
    (getTmpFile as any).mockImplementation(() => "/tmp/some-random-file");
    (ffprobe as any).mockImplementation((i, cb) => {
      cb(null, {
        streams: [
          {
            width: 500,
            height: 500,
          },
        ],
      });
    });

    await generateVideoPreview(["/foo/bar"]);
    expect(ffmpegMock.screenshot).toBeCalledWith({
      count: 1,
      filename: "some-random-file.jpg",
      folder: "/tmp",
      timemarks: ["0"],
      size: "500x500",
    });
  });

  it("should attempt to generate a temporary file", async () => {
    await generateVideoPreview(["/foo/bar"]);

    expect(getTmpFile).toBeCalled();
  });

  it("should attempt to clean up the temporary file in case of errors", async () => {
    const expectedError = new Error("failed to generate video preview: Error: foo");
    (ffmpeg as any).mockImplementation(() => {
      throw new Error("foo");
    });

    (ffprobe as any).mockImplementation((i, cb) => {
      cb(null, {
        streams: [
          {
            width: 500,
            height: 500,
          },
        ],
      });
    });

    await expect(generateVideoPreview(["/foo/bar"])).rejects.toThrow(expectedError);

    expect(cleanFiles).toBeCalledWith(["/tmp/file.jpg"]);
  });

  it("should return the thumbnail information", async () => {
    const result = await generateVideoPreview(["/foo/bar"]);
    expect(result).toEqual([
      {
        width: 320,
        height: 240,
        type: "image/jpg",
        size: 1,
        path: "/tmp/file.jpg",
      },
    ]);
  });

  it("should generate thumbnails for multiple files", async () => {
    const result = await generateVideoPreview(["/foo/bar", "/foo/baz", "/foo/tar"]);
    expect(result).toHaveLength(3);
  });

  it("should use ffprobe to get the video dimensions", async () => {
    await generateVideoPreview(["/foo/bar"]);
    expect(ffprobe).toBeCalledWith("/foo/bar", expect.any(Function));
  });

  it("should use 1080p as the maximum video dimensions", async () => {
    (ffprobe as any).mockImplementation((i, cb) => {
      cb(null, {
        streams: [
          {
            width: 5000,
            height: 5000,
          },
        ],
      });
    });

    const result = await generateVideoPreview(["/foo/bar"]);
    expect(result).toEqual([
      {
        width: 1920,
        height: 1080,
        type: "image/jpg",
        size: 1,
        path: "/tmp/file.jpg",
      },
    ]);
  });

  it("should use 320x240 as the minimum video dimensions", async () => {
    (ffprobe as any).mockImplementation((i, cb) => {
      cb(null, {
        streams: [
          {
            width: 320,
            height: 180,
          },
        ],
      });
    });

    const result = await generateVideoPreview(["/foo/bar"]);
    expect(result).toEqual([
      {
        width: 320,
        height: 240,
        type: "image/jpg",
        size: 1,
        path: "/tmp/file.jpg",
      },
    ]);
  });
});
