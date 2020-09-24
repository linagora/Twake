import React from 'react';
import './Threads.scss';
import Draggable from 'components/Draggable/Draggable.js';
import UploadZone from 'components/Uploads/UploadZone.js';
import Workspaces from 'services/workspaces/workspaces.js';
import MessageEditorsManager, { MessageEditors } from 'app/services/Apps/Messages/MessageEditors';

type Props = {
  collectionKey?: string;
  channelId?: string;
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
  allowUpload?: boolean;
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
    <UploadZone
      className="thread-centerer"
      ref={node => {
        MessageEditorsManager.get(props.message?.channel_id || props.channelId || '').setUploadZone(
          props.message?.id,
          node,
        );
      }}
      disableClick
      parent={''}
      driveCollectionKey={props.collectionKey}
      uploadOptions={{ workspace_id: Workspaces.currentWorkspaceId, detached: true }}
      onUploaded={(file: any) => {
        MessageEditorsManager.get(
          props.message?.channel_id || props.channelId || '',
        ).onAddAttachment(props.message?.id, file);
      }}
      multiple={false}
      allowPaste={true}
      disabled={!(props.allowUpload || (props.message && props.collectionKey))}
    >
      <Draggable
        dragHandler="js-drag-handler-message"
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
    </UploadZone>
  </div>
);
