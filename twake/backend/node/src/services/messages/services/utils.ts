import { FindOptions } from "../../../core/platform/services/database/services/orm/repository/repository";
import { Pagination } from "../../../core/platform/framework/api/crud-service";
import { Message } from "../entities/messages";
import { specialMention } from "../types";
import User from "../../../services/user/entities/user";

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
    specials: (globalOutput || []).map(g => (g || "").trim().split("@").pop()) as specialMention[],
  };
};

/**
 * extracts the links from a message
 *
 * @param {Message} messageResource - The message to be parsed
 * @returns {String} - links found in the message
 */
export const getLinks = (messageResource: Message): string[] => {
  const links = (messageResource.text || "").match(/https?:\/\/[^ ]+/gm);
  return links || [];
};
