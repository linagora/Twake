import _ from "lodash";
import { ThreadExecutionContext } from "../services/messages/types";
import { getInstance, Message, MessageReaction } from "../services/messages/entities/messages";

export function getSubtype(
  item: Pick<Message, "subtype">,
  context?: ThreadExecutionContext,
): null | "application" | "deleted" | "system" {
  //Application request
  if (context?.user?.application_id) {
    return item.subtype === "application" || item.subtype === "deleted" ? item.subtype : null;
  }
  //System request
  else if (context?.user?.server_request) {
    return item.subtype;
  }

  //User cannot set a subtype itself
  return null;
}

export function updateMessageReactions(
  message: Message,
  selectedReactions: string[],
  userId: string,
) {
  const reactions: { [key: string]: MessageReaction } = {};
  for (const reaction of message.reactions || []) {
    reactions[reaction.name] = reaction;
  }
  for (const reaction of selectedReactions) {
    reactions[reaction] = reactions[reaction] || { name: reaction, count: 0, users: [] };
  }
  for (const key in reactions) {
    if (reactions[key].users.includes(userId)) {
      reactions[key].count--;
      reactions[key].users = reactions[key].users.filter(u => u != userId);
    }
    if (selectedReactions.includes(key)) {
      reactions[key].count++;
      reactions[key].users.push(userId);
    }
    if (reactions[key].count === 0) {
      delete reactions[key];
    }
  }

  message.reactions = Object.values(reactions);
}

export function getDefaultMessageInstance(item: Partial<Message>, context: ThreadExecutionContext) {
  let instance = getInstance({
    id: undefined,
    ephemeral:
      (context?.user?.application_id || context?.user?.server_request) && item.ephemeral
        ? item.ephemeral
        : null,
    thread_id: (context?.user?.server_request ? item.thread_id : null) || context.thread.id,
    type: context?.user?.server_request && item.type === "event" ? "event" : "message",
    subtype: getSubtype({ subtype: item?.subtype || null }, context),
    created_at: (context?.user?.server_request ? item.created_at : null) || new Date().getTime(),
    user_id:
      (context?.user?.server_request || context?.user?.application_id ? item.user_id : null) ||
      context.user.id,
    application_id:
      (context?.user?.server_request ? item.application_id : null) ||
      context?.user?.application_id ||
      null,
    text: item.text || "",
    blocks: item.blocks || [],
    files: item.files || null,
    context: item.context || null,
    edited: (context?.user?.server_request ? item.edited : null) || null, //Message cannot be created with edition status
    pinned_info: item.pinned_info
      ? {
          pinned_at: new Date().getTime(),
          pinned_by: context.user.id,
        }
      : null,
    quote_message: item.quote_message || null,
    reactions: (context?.user?.server_request ? item.reactions : null) || null, // Reactions cannot be set on creation
    bookmarks: (context?.user?.server_request ? item.bookmarks : null) || null,
    override:
      (context?.user?.application_id || context?.user?.server_request) && item.override
        ? {
            title: item.override.title,
            picture: item.override.picture,
          }
        : null, // Only apps and server can set an override on a message
    status: item.status || "sent",
  });

  if (context.user.server_request) {
    instance = _.assign(
      instance,
      _.pickBy(item, v => v !== undefined),
    );
  }

  return instance;
}
