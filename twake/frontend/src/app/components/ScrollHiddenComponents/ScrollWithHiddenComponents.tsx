import React, { FC, useEffect, useRef } from 'react';
import HiddenNotificationService from './HiddenNotificationService';

import './Notifications.scss';

type PropsType = {
  children: JSX.Element | any;
  scrollTopComponent?: JSX.Element;
  scrollBottomComponent?: JSX.Element;
  tag: string;
};

const ScrollWithHiddenComponents: FC<PropsType> = ({
  children,
  scrollTopComponent,
  scrollBottomComponent,
  tag,
}) => {
  const ref = useRef<any>(null);
  const service = HiddenNotificationService.get(tag);

  useEffect(() => {
    service.setScroller(ref.current.firstChild);
    return () => service.removeScroller();
  }, [tag, ref]);

  const beacon = service.useWatcher(() => [
    service.state.beaconTop.length,
    service.state.beaconBottom.length,
  ]);

  const previousBeacon = () => {
    return service.state.beaconTop
      .sort((a: any, b: any) => b.top - a.top)[0]
      .node.current.scrollIntoView({ block: 'center' });
  };

  const nextBeacon = () => {
    return service.state.beaconBottom
      .sort((a: any, b: any) => a.top - b.top)[0]
      .node.current.scrollIntoView({ block: 'center' });
  };

  return (
    <>
      {beacon[0] > 0 && (
        <div className="scroll-top-component" onClick={previousBeacon}>
          {scrollTopComponent}
        </div>
      )}
      <div ref={ref}>{children}</div>
      {beacon[1] > 0 && (
        <div className="scroll-bottom-component" onClick={nextBeacon}>
          {scrollBottomComponent}
        </div>
      )}
    </>
  );
};

export default ScrollWithHiddenComponents;
