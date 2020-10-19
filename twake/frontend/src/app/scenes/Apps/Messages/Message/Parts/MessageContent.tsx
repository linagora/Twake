import React, { useState } from 'react';
import Twacode from 'components/Twacode/Twacode';
import MessagesService from 'services/Apps/Messages/Messages.js';
import 'moment-timezone';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import Reactions from './Reactions';
import Options from './Options';
import MessageHeader from './MessageHeader';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import MessageEditorsManager, { MessageEditors } from 'app/services/Apps/Messages/MessageEditors';
import MessageEdition from './MessageEdition';
import Collections from 'services/Collections/Collections.js';

type Props = {
  message: Message;
  collectionKey: string;
  linkToThread?: boolean;
  edited?: boolean;
};

export default (props: Props) => {
  const [active, setActive] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  let loading_interaction_timeout: any = 0;

  Collections.get('messages').useListener(useState, [
    props.message?.id,
    props.message?.front_id,
    'msgcontent',
  ]);

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

  const showEdition = !props.linkToThread && props.edited;

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
      {!!showEdition && (
        <div className="content-parent">
          <MessageEdition message={props.message} collectionKey={props.collectionKey} />
        </div>
      )}
      {!showEdition && (
        <div className="content-parent dont-break-out">
          <Twacode
            className="content allow_selection"
            content={MessagesService.prepareContent(
              props.message.content,
              props.message.user_specific_content,
            )}
            isApp={props.message.message_type == 1}
            after={
              props.message.edited &&
              props.message.message_type == 0 && <div className="edited">(edited)</div>
            }
            simple={props.linkToThread}
            onAction={(type: string, id: string, context: any, passives: any, evt: any) =>
              onAction(type, id, context, passives, evt)
            }
          />
          <Reactions message={props.message} collectionKey={props.collectionKey} />
        </div>
      )}
      {!showEdition && (
        <Options
          message={props.message}
          collectionKey={props.collectionKey}
          onOpen={() => setActive(true)}
          onClose={() => setActive(false)}
        />
      )}
    </div>
  );
};
