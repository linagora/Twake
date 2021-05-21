import { Languages, ServerConfiguration } from "./types";

export const languages: Languages = {
  default: "en",
  availables: ["en", "fr", "es", "vn", "ru"],
};

export const version: ServerConfiguration["version"] = {
  current: /* @VERSION_DETAIL */ "2021.Q2.505",
  minimal: {
    web: /* @MIN_VERSION_WEB */ "2021.Q1.481",
    mobile: /* @MIN_VERSION_MOBILE */ "2021.Q1.385",
  },
};
