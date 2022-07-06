import { OpenDesktopPopup } from 'app/components/open-desktop-popup/open-desktop-popup';
import Electron from 'app/features/global/framework/electron-service';
import { useGlobalEffect } from 'app/features/global/hooks/use-global-effect';
import { useWebState } from 'app/features/global/state/atoms/use-web';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import React from 'react';
import { useRecoilState } from 'recoil';
import { detectDesktopAppPresence } from 'src/utils/browser-detect';

type PropsType = {
  children: React.ReactNode;
};

export const addUrlTryDesktop = (url: string) => {
  const base = url.split('?')[0];
  const search = url.split('?')[1];
  return base + '?' + [...search.split('&'), 'try_desktop'].join('&');
};

export default ({ children }: PropsType): React.ReactElement => {
  const [useWeb, setUseWeb] = useRecoilState(useWebState);
  const { user } = useCurrentUser();

  const params = new URLSearchParams(document.location.search);
  const shoudlTryDesktop =
    user?.id && (document.location.pathname.length <= 1 || params.get('try_desktop'));

  useGlobalEffect(
    'desktopRedirect',
    () => {
      if (Electron.isElectron()) return;
      if (shoudlTryDesktop) return;
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
    [user?.id],
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
