import { userObjectSchema } from "../../user/web/schemas";

export const filesSchema = {
  type: "object",
  properties: {
    preferences: {
      type: "object",
    },
    id: { type: "string" },
    name: { type: "string" },
    size: { type: "number" },
    width: { type: "number" },
    height: { type: "number" },
  },
};
