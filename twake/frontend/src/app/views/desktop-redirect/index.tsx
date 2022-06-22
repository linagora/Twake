import { OpenDesktopPopup } from 'app/components/open-desktop-popup/open-desktop-popup';
import { useWebState } from 'app/features/global/state/atoms/use-web';
import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import customProtocolCheck from 'custom-protocol-check';
import { getDevice } from 'app/features/global/utils/device';
import isElectron from 'is-electron';


type PropsType = {
  children: React.ReactNode;
};

export default ({ children }: PropsType): React.ReactElement => {
  const [useWeb, setUseWeb] = useRecoilState(useWebState);

  useEffect(() => {
    customProtocolCheck(
      'twake://',
      () => {
        setUseWeb(true);
      },
      () => {
        if (getDevice() !== 'other' || isElectron()) {
          return;
        }

        setUseWeb(false);
        const path = window.location.href.replace(window.location.origin, '');
        window.location.replace(`twake://${path}`);
      },
      undefined,
      () => {
        setUseWeb(true);
      },
    );
  }, []);

  return (
    <>
      {useWeb ? (
        children
      ) : (
        <div className="bg-white h-full overflow-hidden">
          <OpenDesktopPopup />
        </div>
      )}
    </>
  );
};
