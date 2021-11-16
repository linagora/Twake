import { ParticipantObject } from "../../entities/threads";
import { ThreadExecutionContext } from "../../types";

export * from "./threads";
export * from "./messages";
export * from "./views";
export * from "./user-bookmarks";

export const extendExecutionContentWithChannel = (
  participants: ParticipantObject[],
  context: ThreadExecutionContext,
): ThreadExecutionContext => {
  const channelInfo = participants.find(a => a.type === "channel");
  if (!channelInfo) {
    return context;
  }
  return Object.assign(context, {
    company: { id: channelInfo.company_id },
    workspace: { id: channelInfo.workspace_id },
    channel: { id: channelInfo.id },
  });
};
