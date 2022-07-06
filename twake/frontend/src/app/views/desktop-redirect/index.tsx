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
  url = url || '';
  const base = url.split('?')[0] || '';
  const search = url.split('?')[1] || '';
  return base + '?' + [...search.split('&').filter(a => a), 'try_desktop'].join('&');
};

const initialPath = document.location.pathname;
const initialParams = new URLSearchParams(document.location.search);

export default ({ children }: PropsType): React.ReactElement => {
  const [useWeb, setUseWeb] = useRecoilState(useWebState);
  const { user } = useCurrentUser();

  const shouldTryDesktop =
    user?.id && (initialPath.length <= 1 || initialParams.get('try_desktop') !== null);

  useGlobalEffect(
    'desktopRedirect',
    () => {
      if (Electron.isElectron()) return;
      if (!shouldTryDesktop) return;
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
