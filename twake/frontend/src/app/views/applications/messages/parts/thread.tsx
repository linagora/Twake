import React, { ReactNode } from 'react';
import './threads.scss';
import classNames from 'classnames';

export const LoadingThread = (
  <div className="thread-section">
    <div className="message">
      <div className="sender-space">
        <div className="sender-head" />
      </div>
      <div className="message-content">
        <div className="message-content-header">
          <span className="sender-name"></span>
        </div>
        <div className="content-parent"></div>
        <div className="content-parent" style={{ width: '40%' }}></div>
      </div>
    </div>
  </div>
);

type Props = {
  hidden?: boolean;
  highlighted?: boolean;
  withBlock?: boolean;
  className?: string;
  children: ReactNode;
};

export default ({ hidden, highlighted, className, withBlock, children }: Props) => (
  <div className={classNames('thread-container', { hidden, highlighted }, className)}>
    <div className="thread-centerer">
      <div className={classNames('thread', { 'with-block': withBlock })}>{children}</div>
    </div>
  </div>
);
