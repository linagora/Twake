// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from "react";
import { useOnlineUsers } from "app/services/OnlineUser/useOnlineUsers";
import { useTwakeContext } from "./context";

export default (): JSX.Element => {
  useTwakeContext();
  useOnlineUsers();

  return <></>;
};
