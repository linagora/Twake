import { OpenDesktopPopup } from 'app/components/open-desktop-popup/open-desktop-popup';
import { useGlobalEffect } from 'app/features/global/hooks/use-global-effect';
import { useWebState } from 'app/features/global/state/atoms/use-web';
import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { detectDesktopAppPresence } from 'src/utils/browser-detect';

type PropsType = {
  children: React.ReactNode;
};

export default ({ children }: PropsType): React.ReactElement => {
  const [useWeb, setUseWeb] = useRecoilState(useWebState);

  useGlobalEffect(
    'desktopRedirect',
    () => {
      try {
        const path = window.location.href.replace(window.location.origin, '');
        detectDesktopAppPresence(`twake://${path}`).then(isDesktopAppPresent => {
          if (isDesktopAppPresent) {
            setUseWeb(false);
            return;
          }
        });
      } catch (e) {
        setUseWeb(true);
      }
    },
    [],
  );

  return (
    <>
      {children}
      {!useWeb && (
        <div className="bg-white h-full overflow-hidden fixed top-0 left-0 w-full z-50">
          <OpenDesktopPopup />
        </div>
      )}
    </>
  );
};
