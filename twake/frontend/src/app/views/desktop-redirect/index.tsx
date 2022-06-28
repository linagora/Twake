import { OpenDesktopPopup } from 'app/components/open-desktop-popup/open-desktop-popup';
import { useWebState } from 'app/features/global/state/atoms/use-web';
import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { detectDesktopAppPresence } from 'src/utils/browser-detect';

type PropsType = {
  children: React.ReactNode;
};

export default ({ children }: PropsType): React.ReactElement => {
  const [useWeb, setUseWeb] = useRecoilState(useWebState);

  useEffect(() => {
    detectDesktopAppPresence().then(isDesktopAppPresent => {
      if (!isDesktopAppPresent) {
        setUseWeb(true);
        return;
      }

      try {
        const path = window.location.href.replace(window.location.origin, '');
        window.location.replace(`twake://${path}`);
        setUseWeb(false);
      } catch (e) {
        setUseWeb(true);
      }
    });
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
