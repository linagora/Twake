import React, { PureComponent, useEffect, useState } from 'react';
import './Threads.scss';
import Draggable from 'components/Draggable/Draggable.js';
import UploadZone from 'components/Uploads/UploadZone.js';
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

export default (props: PropsType) => {
  const disabledUpload = !(
    props.allowUpload ||
    (props.message && !props.message?.parent_message_id && props.collectionKey)
  );

  const messageEditorService = MessageEditorsManager.get(
    props.message?.channel_id || props.channelId || '',
  );
  const setUploadZoneRef = (node: UploadZone): void =>
    messageEditorService.setUploadZone(props.message?.id || '', node);

  const onDragEnter = (): void =>
    messageEditorService.openEditor(
      props.threadId || '',
      '',
      props.threadId ? '' : props.threadMain ? 'main' : '',
    );

  const onUploaded = (file: FileType) =>
    messageEditorService.onAddAttachment(props.message?.id || '', file);

  return (
    <div
      className={classNames(
        'thread-container',
        { loading: props.loading, hidden: props.hidden, highlighted: props.highlighted },
        props.className,
      )}
      onClick={props.onClick}
    >
      {!props.loading ? (
        <UploadZone
          className="thread-centerer"
          ref={setUploadZoneRef}
          disableClick
          parent={''}
          driveCollectionKey={props.collectionKey}
          uploadOptions={{ workspace_id: Workspaces.currentWorkspaceId, detached: true }}
          onUploaded={onUploaded}
          onDragEnter={onDragEnter}
          multiple={true}
          allowPaste={true}
          disabled={disabledUpload}
        >
          <Draggable
            className={classNames('thread', { 'with-block': props.withBlock })}
            dragHandler="js-drag-handler-message"
            data={{ type: 'message', data: props.message }}
            parentClassOnDrag="dragged"
            minMove={10}
            deactivated={!(props.canDrag && props.message)}
          >
            {props.children}
          </Draggable>
        </UploadZone>
      ) : (
        LoadingComponent
      )}
    </div>
  );
};
