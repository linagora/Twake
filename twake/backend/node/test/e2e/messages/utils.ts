import { v4 as uuidv4 } from "uuid";
import { ChannelMember } from "../../../src/services/channels/entities";
import { Channel } from "../../../src/services/channels/entities/channel";
import {
  ChannelExecutionContext,
  ChannelVisibility,
  WorkspaceExecutionContext,
} from "../../../src/services/channels/types";
import {
  getInstance as getMessageInstance,
  Message,
} from "../../../src/services/messages/entities/messages";
import { ParticipantObject } from "../../../src/services/messages/entities/threads";
import { User } from "../../../src/services/types";
import { TestPlatform } from "../setup";

const url = "/internal/services/messages/v1";

export const e2e_createThread = async (
  platform: TestPlatform,
  participants: ParticipantObject[],
  message: Message,
) => {
  const jwtToken = await platform.auth.getJWTToken();
  return await platform.app.inject({
    method: "POST",
    url: `${url}/companies/${platform.workspace.company_id}/threads`,
    headers: {
      authorization: `Bearer ${jwtToken}`,
    },
    payload: {
      resource: {
        participants: participants,
      },
      options: {
        message: message,
      },
    },
  });
};

export const e2e_createMessage = async (threadId: string, message: Message) => {};

export const createMessage = (message: Partial<Message>, platform?: TestPlatform): Message => {
  return getMessageInstance({
    //Default values
    created_at: new Date().getTime(),
    user_id: platform?.currentUser.id || undefined,

    ...message,
  });
};

export const createParticipant = (
  participant: Partial<ParticipantObject>,
  platform?: TestPlatform,
): ParticipantObject => {
  return {
    //Default values:
    created_at: new Date().getTime(),
    created_by: platform?.currentUser.id || "",
    company_id: platform?.workspace.company_id || "",
    workspace_id: platform?.workspace.workspace_id || "",
    id: platform?.currentUser.id || "",
    type: "user",

    ...participant,
  };
};
