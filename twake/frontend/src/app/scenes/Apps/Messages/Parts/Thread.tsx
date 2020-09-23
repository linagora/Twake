import React from 'react';
import './Threads.scss';
import Draggable from 'components/Draggable/Draggable.js';
import UploadZone from 'components/Uploads/UploadZone.js';
import DriveService from 'services/Apps/Drive/Drive.js';
import Workspaces from 'services/workspaces/workspaces.js';

type Props = {
  collectionKey?: string;
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
  onUploadFile?: (file: any) => void;
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
      ref={node => {}}
      disableClick
      parent={''}
      driveCollectionKey={props.collectionKey}
      uploadOptions={{ workspace_id: Workspaces.currentWorkspaceId, detached: true }}
      onUploaded={(file: any) => {
        props.onUploadFile
          ? props.onUploadFile(file)
          : DriveService.sendAsMessage(props.message.channel_id, props.message.id, file);
      }}
      multiple={false}
      allowPaste={true}
      disabled={!(props.onUploadFile || (props.message && props.collectionKey))}
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
