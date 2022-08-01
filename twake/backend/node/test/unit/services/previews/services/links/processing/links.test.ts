import { describe, expect, it, jest, beforeEach, afterEach, afterAll } from "@jest/globals";
import { generateLinkPreview } from "../../../../../../../src/services/previews/services/links/processing/link";
import { parser } from "html-metadata-parser";
import getFavicons from "get-website-favicon";
import imageProbe from "probe-image-size";

jest.mock("html-metadata-parser");
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

  (parser as any).mockImplementation(() => ({
    og: {
      title: "Foo",
      description: "Bar",
      image: "http://foo.bar/image.jpg",
    },
    meta: {
      title: "Foo",
      description: "Bar",
      image: "http://foo.bar/image1.jpg",
    },
    images: ["http://foo.bar/image2.jpg"],
  }));
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("the generateLinkPreview service", () => {
  it("should return a promise", () => {
    const result = generateLinkPreview("http://foo.bar");
    expect(result).toBeInstanceOf(Promise);
  });

  it("should return a promise that resolves to a preview", async () => {
    const result = await generateLinkPreview("https://foo.bar");
    expect(result).toEqual({
      title: "Foo",
      description: "Bar",
      img: "http://foo.bar/image.jpg",
      favicon: "http://foo.bar/favicon.ico",
      img_width: 320,
      img_height: 240,
      domain: "foo.bar",
      url: "https://foo.bar",
    });
  });

  it("should return a promise that resolves to undefined if no previews are found", async () => {
    (parser as any).mockImplementation(() => {
      throw new Error("failed to parse");
    });
    (getFavicons as any).mockImplementation(() => []);
    (imageProbe as any).mockImplementation(() => ({}));

    const result = await generateLinkPreview("https://foo.bar");
    expect(result).toBeUndefined();
  });

  it("should use og information as first choice", async () => {
    (parser as any).mockImplementation(() => ({
      og: {
        title: "test",
        description: "test",
        image: "http://foo.bar/test.jpg",
      },
      meta: {
        title: "test2",
        description: "test2",
        image: "http://foo.bar/test2.jpg",
      },
      images: ["http://foo.bar/test3.jpg"],
    }));

    const result = await generateLinkPreview("https://foo.bar");
    expect(result).toEqual({
      title: "test",
      description: "test",
      img: "http://foo.bar/test.jpg",
      favicon: "http://foo.bar/favicon.ico",
      img_width: 320,
      img_height: 240,
      domain: "foo.bar",
      url: "https://foo.bar",
    });
  });

  it("should use meta information as second choice", async () => {
    (parser as any).mockImplementation(() => ({
      meta: {
        title: "test2",
        description: "test2",
        image: "http://foo.bar/test2.jpg",
      },
      images: [],
    }));

    const result = await generateLinkPreview("https://foo.bar");
    expect(result).toEqual({
      title: "test2",
      description: "test2",
      img: "http://foo.bar/test2.jpg",
      favicon: "http://foo.bar/favicon.ico",
      img_width: 320,
      img_height: 240,
      domain: "foo.bar",
      url: "https://foo.bar",
    });
  });

  it("should use the first image found in the url when none are present in the og or meta information", async () => {
    (parser as any).mockImplementation(() => ({
      og: {
        title: "test",
        description: "test",
      },
      meta: {
        title: "test2",
        description: "test2",
      },
      images: ["http://foo.bar/test3.jpg", "http://foo.bar/test4.jpg"],
    }));

    const result = await generateLinkPreview("https://foo.bar");
    expect(result).toEqual({
      title: "test",
      description: "test",
      img: "http://foo.bar/test3.jpg",
      favicon: "http://foo.bar/favicon.ico",
      img_width: 320,
      img_height: 240,
      domain: "foo.bar",
      url: "https://foo.bar",
    });
  });

  it("shouldn't attempt to probe for image size when none are found", async () => {
    (parser as any).mockImplementation(() => ({
      og: {
        title: "test",
        description: "test",
      },
      meta: {
        title: "test2",
        description: "test2",
      },
      images: [],
    }));

    await generateLinkPreview("https://foo.bar");
    expect(imageProbe).not.toHaveBeenCalled();
  });

  it("should strip www from the domain", async () => {
    const result = await generateLinkPreview("https://www.foo.bar");
    expect(result).toEqual({
      title: "Foo",
      description: "Bar",
      img: "http://foo.bar/image.jpg",
      favicon: "http://foo.bar/favicon.ico",
      img_width: 320,
      img_height: 240,
      domain: "foo.bar",
      url: "https://www.foo.bar",
    });
  });
});
