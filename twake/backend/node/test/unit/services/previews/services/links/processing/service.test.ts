import {
  describe,
  expect,
  it,
  jest,
  beforeEach,
  afterEach,
  afterAll,
  beforeAll,
} from "@jest/globals";
import { LinkPreviewProcessService } from "../../../../../../../src/services/previews/services/links/processing/service";
import { generateLinkPreview } from "../../../../../../../src/services/previews/services/links/processing/link";
import { generateImageUrlPreview } from "../../../../../../../src/services/previews/services/links/processing/image";
import axios from "axios";

jest.mock("axios");
jest.mock("../../../../../../../src/services/previews/services/links/processing/link");
jest.mock("../../../../../../../src/services/previews/services/links/processing/image");

let service: LinkPreviewProcessService;

beforeEach(async () => {
  (axios as any).mockImplementation(() => ({
    headers: {
      "content-type": "text/html",
    },
  }));

  (generateLinkPreview as any).mockImplementation(() => ({
    title: "Foo",
    description: "Bar",
    img: "http://foo.bar/image.jpg",
    favicon: "http://foo.bar/favicon.ico",
  }));

  (generateImageUrlPreview as any).mockImplementation(() => ({
    title: "image.jpg",
    description: null,
    img: "http://foo.bar/image.jpg",
    favicon: "http://foo.bar/favicon.ico",
  }));
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

beforeAll(async () => {
  service = await new LinkPreviewProcessService().init();
});

describe("the LinkPreviewProcessService service", () => {
  it("should return a promise", () => {
    const result = service.generatePreviews(["http://foo.bar"]);
    expect(result).toBeInstanceOf(Promise);
  });

  it("should call generateLinkPreview when it's a html page", async () => {
    (axios as any).mockImplementation(() => ({
      headers: {
        "content-type": "text/html",
      },
    }));

    await service.generatePreviews(["http://foo.bar"]);
    expect(generateLinkPreview).toHaveBeenCalled();
  });

  it("should call generateImageUrlPreview when it's an image", async () => {
    (axios as any).mockImplementation(() => ({
      headers: {
        "content-type": "image/jpeg",
      },
    }));

    await service.generatePreviews(["http://foo.bar/image.jpg"]);
    expect(generateImageUrlPreview).toHaveBeenCalled();
  });

  it("should skip if the url content is not supported", async () => {
    (axios as any).mockImplementation(() => ({
      headers: {
        "content-type": "application/json",
      },
    }));

    await service.generatePreviews(["http://foo.bar"]);
    expect(generateLinkPreview).not.toHaveBeenCalled();
    expect(generateImageUrlPreview).not.toHaveBeenCalled();
  });

  // should filter null values
  it("should filter null values", async () => {
    (axios as any).mockImplementation(() => ({
      headers: {
        "content-type": "text/html",
      },
    }));

    (generateLinkPreview as any).mockImplementation(() => null);

    const result = await service.generatePreviews(["http://foo.bar", "http://foo.xyz"]);
    expect(result).toEqual([]);
  });
});
