import React, { useState } from 'react';
import Twacode from 'components/Twacode/Twacode.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import 'moment-timezone';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import Reactions from './Reactions';
import Options from './Options';
import MessageHeader from './MessageHeader';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';

type Props = {
  message: Message;
  collectionKey: string;
  linkToThread?: boolean;
};

export default (props: Props) => {
  const [active, setActive] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  let loading_interaction_timeout: any = 0;

  const onInteractiveMessageAction = (action_id: string, context: any, passives: any, evt: any) => {
    var app_id = props.message.application_id;
    var type = 'interactive_message_action';
    var event = action_id;
    var data = {
      interactive_context: context,
      form: passives,
      message: props.message,
    };
    WorkspacesApps.notifyApp(app_id, type, event, data);
  };

  const onAction = (type: string, id: string, context: any, passives: any, evt: any) => {
    if (type == 'interactive_action') {
      setLoadingAction(true);
      clearTimeout(loading_interaction_timeout);
      loading_interaction_timeout = setTimeout(() => {
        setLoadingAction(false);
      }, 5000);
      onInteractiveMessageAction(id, context, passives, evt);
    }
  };

  return (
    <div
      className={
        'message-content ' +
        (active ? 'active ' : '') +
        (loadingAction ? 'loading-interaction ' : '') +
        (props.linkToThread ? 'link-to-thread ' : '')
      }
      onClick={() => setActive(false)}
    >
      <MessageHeader
        message={props.message}
        collectionKey={props.collectionKey}
        linkToThread={props.linkToThread}
      />
      <div className="content-parent dont-break-out">
        <Twacode
          className="content allow_selection"
          onDoubleClick={(evt: any) => {
            evt.preventDefault();
            evt.stopPropagation();
          }}
          content={MessagesService.prepareContent(
            props.message.content,
            props.message.user_specific_content,
          )}
          id={props.message.front_id}
          isApp={props.message.message_type == 1}
          after={
            props.message.edited &&
            props.message.message_type == 0 && <div className="edited">(edited)</div>
          }
          onAction={(type: string, id: string, context: any, passives: any, evt: any) =>
            onAction(type, id, context, passives, evt)
          }
        />
        <Reactions message={props.message} collectionKey={props.collectionKey} />
      </div>
      <Options
        message={props.message}
        collectionKey={props.collectionKey}
        onOpen={() => setActive(true)}
        onClose={() => setActive(false)}
      />
    </div>
  );
};
