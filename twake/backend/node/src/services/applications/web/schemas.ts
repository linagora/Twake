import { webSocketSchema } from "../../../utils/types";

export const applicationsSchema = {
  type: "object",
  properties: {},
};

const applicationIdentity = {
  type: "object",
  properties: {
    code: { type: "string" },
    name: { type: "string" },
    icon: { type: "string" },
    description: { type: "string" },
    website: { type: "string" },
    categories: { type: "array", items: { type: "string" } },
    compatibility: { type: "array", items: { type: "string" } },
  },
  required: ["code", "name", "icon", "description", "website", "categories", "compatibility"],
};

const applicationAccess = {
  type: "object",
  properties: {
    read: { type: "array", items: { type: "string" } },
    write: { type: "array", items: { type: "string" } },
    delete: { type: "array", items: { type: "string" } },
    hooks: { type: "array", items: { type: "string" } },
  },
  required: ["read", "write", "delete", "hooks"],
};

const applicationPublication = {
  type: "object",
  properties: {
    published: { type: "boolean" },
    requested: { type: "boolean" },
  },
  required: ["published", "requested"],
};

const applicationStats = {
  type: "object",
  properties: {
    createdAt: { type: "number" },
    updatedAt: { type: "number" },
    version: { type: "number" },
  },
  required: ["createdAt", "updatedAt", "version"],
};

const apiObject = {
  type: "object",
  properties: {
    hooksUrl: { type: "string" },
    allowedIps: { type: "string" },
    privateKey: { type: "string" },
  },
};

const requestApplicationObject = {
  type: "object",
  properties: {
    company_id: { type: "string" },
    identity: applicationIdentity,
    access: applicationAccess,
    display: {},
    api: apiObject,
    publication: applicationPublication,
  },
  required: ["company_id", "identity", "access", "display", "api", "publication"],
  additionalProperties: false,
};

const responseApplicationObject = {
  type: "object",
  properties: {
    id: { type: "string" },
    is_default: { type: "boolean" },
    company_id: { type: "string" },
    identity: applicationIdentity,
    access: applicationAccess,
    display: {},
    publication: applicationPublication,
    stats: applicationStats,
  },
  required: [
    "id",
    "is_default",
    "company_id",
    "identity",
    "access",
    "display",
    "publication",
    "stats",
  ],
  additionalProperties: false,
};

export const applicationPostSchema = {
  body: requestApplicationObject,
  response: {
    "2xx": {
      resource: responseApplicationObject,
    },
  },
};

// const postPayload = {
//   is_default: true,
//   identity: {
//     code: "code",
//     name: "name",
//     icon: "icon",
//     description: "description",
//     website: "website",
//     categories: [],
//     compatibility: [],
//   },
//   api: {
//     hooksUrl: "hooksUrl",
//     allowedIps: "allowedIps",
//     privateKey: "privateKey", // RO
//   },
//   access: {
//     read: ["messages"],
//     write: ["messages"],
//     delete: ["messages"],
//     hooks: ["messages"],
//   },
//   display: {
//     twake: {
//       version: 1,
//
//       files: {
//         editor: {
//           preview_url: "string", //Open a preview inline (iframe)
//           edition_url: "string", //Url to edit the file (full screen)
//           extensions: [], //Main extensions app can read
//           // if file was created by the app, then the app is able to edit with or without extension
//           empty_files: [
//             {
//               url: "string", // "https://[...]/empty.docx";
//               filename: "string", // "Untitled.docx";
//               name: "string", // "Word Document";
//             },
//           ],
//         },
//         actions: [
//           //List of action that can apply on a file
//           {
//             name: "string",
//             id: "string",
//           },
//         ],
//       },
//
//       //Chat plugin
//       chat: {
//         input: true,
//         commands: [
//           {
//             command: "string", // my_app mycommand
//             description: "string",
//           },
//         ],
//         actions: [
//           //List of action that can apply on a message
//           {
//             name: "string",
//             id: "string",
//           },
//         ],
//       },
//
//       //Allow app to appear as a bot user in direct chat
//       direct: false,
//
//       //Display app as a standalone application in a tab
//       tab: { url: "string" },
//
//       //Display app as a standalone application on the left bar
//       standalone: { url: "string" },
//
//       //Define where the app can be configured from
//       configuration: ["global", "channel"],
//     },
//   },
//   publication: {
//     published: false, //Publication accepted // RO
//     requested: false, //Publication requested
//   },
//
//   stats: {
//     createdAt: 0, // RO
//     updatedAt: 0, // RO
//     version: 0, // RO
//   },
// };
