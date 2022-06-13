import React from 'react';
import { useDebugRecoilState } from 'app/features/debug/hooks/use-debug-recoil-state';

export default (): React.ReactElement => {
  useDebugRecoilState();

  return <></>;
};
