import React from 'react';
import './Threads.scss';

type Props = {
  loading?: boolean;
  highlighted?: boolean;
  children?: any | any[];
  hidden?: boolean;
  withBlock?: boolean;
  className?: string;
  onClick?: (event: any) => void;
  refDom?: (node: any) => void;
};

export default (props: Props) => (
  <div
    className={
      'thread-container ' +
      (props.loading ? 'loading ' : '') +
      (props.hidden ? 'hidden ' : '') +
      (props.highlighted ? 'highlighted ' : '') +
      (props.className ? props.className + ' ' : '')
    }
    onClick={props.onClick}
    ref={props.refDom}
  >
    <div className="thread-centerer">
      <div className={'thread ' + (props.withBlock ? 'with-block ' : '')}>
        {!!props.loading && (
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
        )}
        {!props.loading && props.children}
      </div>
    </div>
  </div>
);
