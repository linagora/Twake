const publicFileSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    user_id: { type: "string" },
    company_id: { type: "string" },
    application_id: { type: "string" },
    updated_at: { type: "number" },
    created_at: { type: "number" },
    metadata: { type: "object", additionalProperties: true },
    thumbnails: { type: "array" },
    upload_data: { type: "object", additionalProperties: true },
    user: { type: "object", additionalProperties: true, nullable: true },
    context: { type: "object", additionalProperties: true, nullable: true },
  },
};

export const listUserFiles = {
  request: {
    properties: {
      type: { type: "string", enum: ["user_upload", "user_download"] },
      page_token: { type: "string" },
      limit: { type: "number" },
    },
    required: ["type"],
  },
  response: {
    "2xx": {
      type: "object",
      properties: {
        resources: { type: "array", items: publicFileSchema },
        next_page_token: { type: "string" },
      },
      required: ["resources"],
    },
  },
};
