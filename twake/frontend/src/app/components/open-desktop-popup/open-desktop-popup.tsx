import React, { useState, useEffect } from 'react';
import { Logo } from 'app/atoms/logo';
import { Subtitle } from 'app/atoms/text';
import A from 'app/atoms/link';
import { useRecoilState } from 'recoil';
import { useWebState } from 'app/features/global/state/atoms/use-web';

export const OpenDesktopPopup = (): React.ReactElement => {
  const [showLink, setShowLink] = useState(false);
  const [, setUseWeb] = useRecoilState(useWebState);

  useEffect(() => {
    setTimeout(() => {
      setShowLink(true);
    }, 5000);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full overflow-hidden space-y-2">
      <Logo />
      <Subtitle>Opened in Twake app</Subtitle>
      {showLink && <A onClick={() => setUseWeb(true)}>open here instead</A>}
    </div>
  );
};
