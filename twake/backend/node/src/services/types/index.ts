/**
 * User in platform:
 *
 * {
 *    id: "uuid",
 *    org: {
 *      "company-uuid": {
 *        role: "something",
 *        wks: {
 *          "workspace-id1": {
 *            adm: true
 *          },
 *          "workspace-id2": {
 *            adm: false
 *          }
 *        }
 *      }
 *    }
 * }
 */
export interface User {
  // unique user id
  id: string;
  // Organisation properties
  org?: {
    [companyId: string]: {
      role: string; //Not implemented
      wks: {
        [workspaceId: string]: {
          adm: boolean;
        };
      };
    };
  };
}

export interface Workspace {
  company_id: string;
  workspace_id: string;
}

export interface Channel extends Workspace {
  id: string;
}

export interface WebsocketMetadata {
  room: string;
  name?: string;
  encryption_key?: string;
}
