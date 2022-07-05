import React, { useState, useEffect } from 'react';
import { Logo } from 'app/atoms/logo';
import { Subtitle } from 'app/atoms/text';
import A from 'app/atoms/link';
import { useRecoilState } from 'recoil';
import { useWebState, preferUserWeb } from 'app/features/global/state/atoms/use-web';
import Languages from 'app/features/global/services/languages-service';

export const OpenDesktopPopup = (): React.ReactElement => {
  const [showLink, setShowLink] = useState(true);
  const [, setUseWeb] = useRecoilState(useWebState);

  useEffect(() => {
    setTimeout(() => {
      setShowLink(true);
    }, 5000);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full overflow-hidden">
      <Logo />
      <Subtitle className="mt-4 mb-2 block">
        {Languages.t('components.open_desktop_popup.subtitle')}
      </Subtitle>
      {showLink && (
        <>
          <A
            className="mb-2 block"
            onClick={() => {
              preferUserWeb();
              setUseWeb(true);
            }}
          >
            {Languages.t('components.open_desktop_popup.open_here_link')}
          </A>
          <A
            className="mb-2 block opacity-50"
            onClick={() => {
              preferUserWeb(1000 * 60 * 60 * 24 * 90); //For 3 months
              setUseWeb(true);
            }}
          >
            {Languages.t('components.open_desktop_popup.open_here_link_forever')}
          </A>
        </>
      )}
    </div>
  );
};
