import React, { ReactNode } from 'react';
import 'moment-timezone';
import './Threads.scss';
import ThreadAvatar from './ThreadAvatar';

type Props = {
  compact?: boolean;
  gradient?: boolean;
  small?: boolean;
  head?: boolean;
  alinea?: boolean;
  children?: ReactNode;
  noSenderSpace?: boolean;
  withAvatar?: boolean;
  pinned?: boolean;
  className?: string;
};

export default (props: Props) => {
  return (
    <div
      className={
        'thread-section ' +
        (props.compact ? 'compact ' : '') +
        (props.gradient ? 'gradient ' : '') +
        (props.small ? 'small-section ' : '') +
        (props.alinea ? 'alinea ' : '') +
        (props.head ? 'head-section ' : '') +
        (props.pinned ? 'pinned-section ' : '') +
        (props.className ? props.className + ' ' : '')
      }
    >
      <div className="message">
        {!props.noSenderSpace && (
          <div className="sender-space">
            {props.withAvatar && <ThreadAvatar small={props.small} />}
          </div>
        )}
        {props.children}
      </div>
    </div>
  );
};
