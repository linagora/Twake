import React from 'react';
import './Threads.scss';
import Draggable from 'components/Draggable/Draggable';
import UploadZone from 'components/Uploads/UploadZone';
import Workspaces from 'services/workspaces/workspaces.js';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditorServiceFactory';
import { Message } from 'app/models/Message';
import classNames from 'classnames';

// FIX ME use real File type instead
type FileType = { [key: string]: any };

type PropsType = {
  collectionKey?: string;
  channelId?: string;
  threadId?: string;
  threadMain?: boolean;
  message?: Message;
  loading?: boolean;
  highlighted?: boolean;
  children?: any | any[];
  hidden?: boolean;
  withBlock?: boolean;
  className?: string;
  onClick?: (event: any) => void;
  canDrag?: boolean;
  allowUpload?: boolean;
};

const LoadingComponent = (
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

export default ({
  message,
  loading,
  highlighted,
  children,
  hidden,
  withBlock,
  className,
  onClick,
  canDrag,
}: PropsType) => (
  <div
    className={classNames('thread-container', { loading, hidden, highlighted }, className)}
    onClick={onClick}
  >
    {!loading ? (
      <div className="thread-centerer">
        <Draggable
          className={classNames('thread', { 'with-block': withBlock })}
          dragHandler="js-drag-handler-message"
          data={{ type: 'message', data: message }}
          parentClassOnDrag="dragged"
          minMove={10}
          deactivated={!(canDrag && message)}
        >
          {children}
        </Draggable>
      </div>
    ) : (
      LoadingComponent
    )}
  </div>
);
