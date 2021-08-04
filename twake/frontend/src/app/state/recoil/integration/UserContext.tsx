// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from "react";

import { useTwakeContext } from "./context";

export default (): JSX.Element => {
  useTwakeContext();

  return <></>;
};
