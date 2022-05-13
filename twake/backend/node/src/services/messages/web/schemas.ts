const publicFileSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    user_id: { type: "string" },
    company_id: { type: "string" },
    application_id: { type: "string" },
    updated_at: { type: "number" },
    created_at: { type: "number" },
    metadata: { type: "object" },
    thumbnails: { type: "array" },
    upload_data: { type: "object" },
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
