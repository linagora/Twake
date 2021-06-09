import _ from "lodash";
import { getInstance, Message, MessageReaction } from "../../entities/messages";
import { ThreadExecutionContext } from "../../types";

export function getSubtype(
  item: Pick<Message, "subtype">,
  context?: ThreadExecutionContext,
): null | "application" | "deleted" | "system" {
  //Application request
  if (context?.user?.application_id) {
    return item.subtype === "application" ? "application" : null;
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
  let reactions: { [key: string]: MessageReaction } = {};
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
    thread_id: context.thread.id,
    type: context?.user?.server_request && item.type === "event" ? "event" : "message",
    subtype: getSubtype({ subtype: item?.subtype || null }, context),
    created_at: new Date().getTime(),
    user_id: context.user.id,
    application_id: context?.user?.application_id || null,
    text: item.text || "",
    blocks: item.blocks || [],
    files: item.files || null,
    context: item.context || null,
    edited: null, //Message cannot be created with edition status
    pinned_info: item.pinned_info
      ? {
          pinned_at: new Date().getTime(),
          pinned_by: context.user.id,
        }
      : null,
    reactions: null, // Reactions cannot be set on creation
    bookmarks: null,
    override:
      (context?.user?.application_id || context?.user?.server_request) && item.override
        ? {
            title: item.override.title,
            picture: item.override.picture,
          }
        : null, // Only apps and server can set an override on a message
  });

  if (context.user.server_request) {
    instance = _.assign(
      instance,
      _.pickBy(item, v => v !== undefined),
    );
  }

  return instance;
}
