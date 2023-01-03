import { describe, it, expect } from "@jest/globals";
import { hasAccessLevel } from "../../../../src/services/documents/utils";

describe("the Drive feature utility functions", () => {
  describe("the hasAccessLevel function", () => {
    it("should return true if the required level and actual level are the same", () => {
      expect(hasAccessLevel("manage", "manage")).toBeTruthy();
      expect(hasAccessLevel("write", "write")).toBeTruthy();
      expect(hasAccessLevel("read", "read")).toBeTruthy();
    });

    it("should return true if the possessed level surpasses the required level", () => {
      expect(hasAccessLevel("write", "manage")).toBeTruthy();
      expect(hasAccessLevel("read", "write")).toBeTruthy();
      expect(hasAccessLevel("none", "manage")).toBeTruthy();
    });

    it("should return false if the possessed level does not qualify to the required level", () => {
      expect(hasAccessLevel("manage", "write")).toBeFalsy();
      expect(hasAccessLevel("write", "read")).toBeFalsy();
      expect(hasAccessLevel("manage", "read")).toBeFalsy();
    });
  });
});
