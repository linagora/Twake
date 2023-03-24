import React, { ReactNode, Suspense } from 'react';
import 'moment-timezone';
import './threads.scss';
import ThreadAvatar from './thread-avatar';

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
  onClick?: () => void;
};

export default (props: Props) => {
  return (
    <div
      onClick={props.onClick}
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
            {props.withAvatar && (
              <Suspense fallback={''}>
                <ThreadAvatar small={props.small} />
              </Suspense>
            )}
          </div>
        )}
        {props.children}
      </div>
    </div>
  );
};
