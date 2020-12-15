import React, { useEffect, useRef } from 'react';
import HiddenNotificationService from 'components/ScrollHiddenComponents/HiddenNotificationService';

type PropsType = {
  tag: string;
};

export default ({ tag }: PropsType) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const instance = HiddenNotificationService.get(tag);
    instance.addBeacon(ref);
    return () => instance.removeBeacon(ref);
  }, [tag, ref]);

  return <div ref={ref} />;
};
