import { FindOptions } from "../../../core/platform/services/database/services/orm/repository/repository";
import { Pagination } from "../../../core/platform/framework/api/crud-service";
import { Message } from "../entities/messages";
import { specialMention } from "../types";

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

export const getMentions = (messageResource: Message) => {
  const usersOutput = (messageResource.text || "").match(/@[^: ]+:([0-f-]{36})/gm);
  const globalOutput = (messageResource.text || "").match(
    /(^| )@(all|here|channel|everyone)([^a-z]|$)/gm,
  );

  return {
    users: (usersOutput || []).map(u => (u || "").trim().split(":").pop()),
    specials: (globalOutput || []).map(g => (g || "").trim().split("@").pop()) as specialMention[],
  };
};
