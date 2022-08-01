import { describe, expect, it, jest, beforeEach, afterEach, afterAll } from "@jest/globals";
import { generateImageUrlPreview } from "../../../../../../../src/services/previews/services/links/processing/image";

import getFavicons from "get-website-favicon";
import imageProbe from "probe-image-size";

jest.mock("get-website-favicon");
jest.mock("probe-image-size");

beforeEach(() => {
  (imageProbe as any).mockImplementation(() => ({
    width: 320,
    height: 240,
  }));

  (getFavicons as any).mockImplementation(() => ({
    icons: [
      {
        src: "http://foo.bar/favicon.ico",
      },
    ],
  }));
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("the generateImageUrlPreview function", () => {
  it("should return a promise", () => {
    const result = generateImageUrlPreview("http://foo.bar");
    expect(result).toBeInstanceOf(Promise);
  });

  it("should generate a preview for a given image url", async () => {
    const result = await generateImageUrlPreview("https://foo.bar/image.jpg");
    expect(result).toEqual({
      title: "image.jpg", // title should be the file name
      domain: "foo.bar",
      favicon: "http://foo.bar/favicon.ico",
      url: "https://foo.bar/image.jpg",
      img_height: 240,
      img_width: 320,
      description: null,
      img: "https://foo.bar/image.jpg",
    });
  });

  it("should return nothing in case of error", async () => {
    (imageProbe as any).mockImplementation(() => {
      throw new Error("failed to probe image");
    });

    const result = await generateImageUrlPreview("https://foo.bar/image.jpg");
    expect(result).toBeUndefined();
  });
});
