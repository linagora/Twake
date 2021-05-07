import { describe, expect, it } from "@jest/globals";
import * as workspaceUtils from "../../../src/utils/workspace";

describe("The workspace utils", () => {
  describe("The isWorkspaceAdmin function", () => {
    it("should return false if user is undefined", () => {
      const result = workspaceUtils.isWorkspaceAdmin();

      expect(result).toBeFalsy;
    });

    it("should return false if workspace is undefined", () => {
      const result = workspaceUtils.isWorkspaceAdmin({ id: "1" });

      expect(result).toBeFalsy;
    });

    it("should return false if user.org is undefined", () => {
      const result = workspaceUtils.isWorkspaceAdmin(
        { id: "1" },
        { company_id: "1", workspace_id: "2" },
      );

      expect(result).toBeFalsy;
    });

    it("should return false if user.org workspace is empty", () => {
      const result = workspaceUtils.isWorkspaceAdmin(
        { id: "1", org: {} },
        { company_id: "1", workspace_id: "2" },
      );

      expect(result).toBeFalsy;
    });

    it("should return false if user.org company is not found", () => {
      const result = workspaceUtils.isWorkspaceAdmin(
        {
          id: "1",
          org: {
            someCompany: {
              role: "",
              wks: {
                someWorkspace: { adm: false },
              },
            },
          },
        },
        { company_id: "1", workspace_id: "2" },
      );

      expect(result).toBeFalsy;
    });

    it("should return false if user.org workspace is not found", () => {
      const result = workspaceUtils.isWorkspaceAdmin(
        {
          id: "1",
          org: {
            1: {
              role: "",
              wks: {
                someWorkspace: { adm: false },
              },
            },
          },
        },
        { company_id: "1", workspace_id: "2" },
      );

      expect(result).toBeFalsy;
    });

    it("should return false if user is not admin in workspace", () => {
      const result = workspaceUtils.isWorkspaceAdmin(
        {
          id: "1",
          org: {
            1: {
              role: "",
              wks: {
                2: { adm: false },
              },
            },
          },
        },
        { company_id: "1", workspace_id: "2" },
      );

      expect(result).toBeFalsy;
    });

    it("should return true if user is admin in workspace", () => {
      const result = workspaceUtils.isWorkspaceAdmin(
        {
          id: "1",
          org: {
            1: {
              role: "",
              wks: {
                2: { adm: true },
              },
            },
          },
        },
        { company_id: "1", workspace_id: "2" },
      );

      expect(result).toBeTruthy;
    });
  });
});
