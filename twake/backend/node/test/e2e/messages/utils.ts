import {
  getInstance as getMessageInstance,
  Message,
} from "../../../src/services/messages/entities/messages";
import { ParticipantObject } from "../../../src/services/messages/entities/threads";
import { TestPlatform } from "../setup";

const url = "/internal/services/messages/v1";

export const e2e_createThread = async (
  platform: TestPlatform,
  participants: ParticipantObject[],
  message: Message,
) => {
  const jwtToken = await platform.auth.getJWTToken();
  const res = await platform.app.inject({
    method: "POST",
    url: `${url}/companies/${platform.workspace.company_id}/threads`,
    headers: {
      authorization: `Bearer ${jwtToken}`,
    },
    payload: {
      resource: {
        participants: participants || [],
      },
      options: {
        message: message,
      },
    },
  });
  await new Promise(resolve => setTimeout(resolve, 200));
  return res;
};

export const e2e_createMessage = async (
  platform: TestPlatform,
  threadId: string,
  message: Message,
) => {
  const jwtToken = await platform.auth.getJWTToken(
    message.user_id ? { sub: message.user_id } : undefined,
  );
  const res = await platform.app.inject({
    method: "POST",
    url: `${url}/companies/${platform.workspace.company_id}/threads/${threadId}/messages`,
    headers: {
      authorization: `Bearer ${jwtToken}`,
    },
    payload: {
      resource: message,
    },
  });
  await new Promise(resolve => setTimeout(resolve, 200));
  return res;
};

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
