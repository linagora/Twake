import React from 'react';

type Props = {
  loading?: boolean;
  highlighted?: boolean;
  children?: any | any[];
  refDom?: (node: any) => void;
};

export default (props: Props) => (
  <div
    className={
      'thread-container ' +
      (props.loading ? 'loading ' : '') +
      (props.highlighted ? 'highlighted ' : '')
    }
    ref={props.refDom}
  >
    <div className="thread with-block">
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
);
