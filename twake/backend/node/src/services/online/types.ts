export type OnlineTuple = [string, boolean];

export type UsersOnlineMessage = Array<OnlineTuple>;

export type OnlineGetRequest = {
  /* Array of ids to get status */
  data: Array<string>;
};

export type OnlineGetResponse = {
  data: UsersOnlineMessage;
};
