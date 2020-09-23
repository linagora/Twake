import React from 'react';
import './Threads.scss';
import Draggable from 'components/Draggable/Draggable.js';

type Props = {
  message?: any;
  loading?: boolean;
  highlighted?: boolean;
  children?: any | any[];
  hidden?: boolean;
  withBlock?: boolean;
  className?: string;
  onClick?: (event: any) => void;
  refDom?: (node: any) => void;
  canDrag?: boolean;
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
      <Draggable
        dragHandler="js-drag-handler-all-thread"
        data={{ type: 'message', data: props.message }}
        parentClassOnDrag="dragged"
        onDragStart={(evt: any) => {
          console.log(evt);
        }}
        minMove={10}
        className={'thread ' + (props.withBlock ? 'with-block ' : '')}
        deactivated={!(props.canDrag && props.message)}
      >
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
      </Draggable>
    </div>
  </div>
);
