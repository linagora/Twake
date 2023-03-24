import { FindOptions } from "../../../core/platform/services/database/services/orm/repository/repository";
import {
  CreateResult,
  Pagination,
  UpdateResult,
} from "../../../core/platform/framework/api/crud-service";
import { Message } from "../entities/messages";
import { MessageLocalEvent, SpecialMention, ThreadExecutionContext } from "../types";
import User from "../../../services/user/entities/user";
import { RealtimeEntityActionType } from "../../../core/platform/services/realtime/types";
import { getThreadMessagePath } from "../web/realtime";
import { ResourcePath } from "../../../core/platform/services/realtime/types";
import { RealtimeLocalBusEvent } from "../../../core/platform/services/realtime/types";
import { localEventBus } from "../../../core/platform/framework/event-bus";
import { ParticipantObject } from "../entities/threads";

export const buildMessageListPagination = (
  pagination: Pagination,
  messageIdKey: string,
): FindOptions => {
  const offset = pagination.page_token;
  pagination = { ...pagination, page_token: null };
  return {
    pagination,
    ...(!!offset && pagination.reversed && { $gte: [[messageIdKey, offset]] }),
    ...(!!offset && !pagination.reversed && { $lte: [[messageIdKey, offset]] }),
  };
};

export const getMentions = async (
  messageResource: Message,
  findByUsername: (username: string) => Promise<User>,
) => {
  const idsFromUsernames = [];
  try {
    const usersNoIdOutput = (messageResource.text || "").match(/( |^)@[a-zA-Z0-9-_.]+/gm);
    const usernames = (usersNoIdOutput || []).map(u => (u || "").trim().split("@").pop());
    for (const username of usernames) {
      if (!"all|here|channel|everyone".split("|").includes(username)) {
        const user = await findByUsername(username);
        if (user) idsFromUsernames.push(user.id);
      }
    }
  } catch (err) {
    console.log(err);
  }

  const usersOutput = (messageResource.text || "").match(/@[^: ]+:([0-f-]{36})/gm);
  const globalOutput = (messageResource.text || "").match(
    /(^| )@(all|here|channel|everyone)([^a-z]|$)/gm,
  );

  return {
    users: [
      ...(usersOutput || []).map(u => (u || "").trim().split(":").pop()),
      ...idsFromUsernames,
    ],
    specials: (globalOutput || []).map(g => (g || "").trim().split("@").pop()) as SpecialMention[],
  };
};

/**
 * extracts the links from a message
 *
 * @param {Message} messageResource - The message to be parsed
 * @returns {String} - links found in the message
 */
export const getLinks = (messageResource: Message): string[] => {
  const cleanText = messageResource.text.replace(/\n+/gm, " ");
  const links = (cleanText || "").match(/https?:\/\/[^ ]+/gm);

  return links || [];
};

/**
 * Publish a message to the realtime bus
 *
 * @param {MessageLocalEvent} message - The event to be published
 * @param {ParticipantObject} participant - The participant
 */
export const publishMessageInRealtime = (
  message: MessageLocalEvent,
  participant: ParticipantObject,
): void => {
  if (participant.type !== "channel") return;

  const room = `/companies/${participant.company_id}/workspaces/${participant.workspace_id}/channels/${participant.id}/feed`;
  const type = "message";
  const entity = message.resource;
  const context = message.context;

  localEventBus.publish("realtime:publish", {
    topic: message.created ? RealtimeEntityActionType.Created : RealtimeEntityActionType.Updated,
    event: {
      type,
      room: ResourcePath.get(room),
      resourcePath: getThreadMessagePath(context as ThreadExecutionContext) + "/" + entity.id,
      entity,
      result: message.created
        ? new CreateResult<Message>(type, entity)
        : new UpdateResult<Message>(type, entity),
    },
  } as RealtimeLocalBusEvent<Message>);
};
