import { CompanyExecutionContext } from "../types";

export const getUserBookmarksWebsocketRoom = (context: CompanyExecutionContext): string => {
  return "/companies/" + context.company.id + "/messages/bookmarks";
};
