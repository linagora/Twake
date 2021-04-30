import { CompanyExecutionContext, ThreadExecutionContext } from "../types";

export const getUserBookmarksWebsocketRoom = (context: CompanyExecutionContext): string => {
  return "/companies/" + context.company.id + "/messages/bookmarks";
};

export const getThreadMessageWebsocketRoom = (context: ThreadExecutionContext): string => {
  return "/companies/" + context.thread.company_id + "/threads/" + context.thread.id;
};

export const getThreadMessagePath = (context: ThreadExecutionContext): string => {
  return "/companies/" + context.thread.company_id + "/threads/" + context.thread.id;
};
