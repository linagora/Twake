import React, { useContext, useState } from 'react';
import 'moment-timezone';
import classNames from 'classnames';
import Twacode from 'components/Twacode/Twacode';
import MessagesService from 'services/Apps/Messages/Messages';
import Reactions from './Reactions';
import Options from './Options';
import MessageHeader from './MessageHeader';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import MessageEdition from './MessageEdition';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import { Message } from 'app/models/Message';
import DeletedContent from './DeletedContent';
import RetryButtons from './RetryButtons';
import FileComponent from 'app/components/File/FileComponent';
import { Row } from 'antd';
import Globals from 'services/Globals';
import RouterService from 'app/services/RouterService';
import { MessageContext } from '../MessageWithReplies';
import { useMessage } from 'app/state/recoil/hooks/useMessage';

type Props = {
  linkToThread?: boolean;
  threadHeader?: string;
  edited?: boolean;
};

export default (props: Props) => {
  const [active, setActive] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [didMouseOver, setDidMouseOver] = useState(false);
  let loading_interaction_timeout: any = 0;

  const context = useContext(MessageContext);
  let { message } = useMessage(context);

  const companyId = context.companyId;

  const onInteractiveMessageAction = (action_id: string, context: any, passives: any, evt: any) => {
    var app_id = message.application_id;
    var type = 'interactive_message_action';
    var event = action_id;
    var data = {
      interactive_context: context,
      form: passives,
      message: message,
    };
    WorkspacesApps.notifyApp(app_id, type, event, data);
  };

  const onAction = (type: string, id: string, context: any, passives: any, evt: any) => {
    if (type === 'interactive_action') {
      setLoadingAction(true);
      clearTimeout(loading_interaction_timeout);
      loading_interaction_timeout = setTimeout(() => {
        setLoadingAction(false);
      }, 5000);
      onInteractiveMessageAction(id, context, passives, evt);
    }
  };

  const deleted = message.subtype === 'deleted';

  const showEdition = !props.linkToThread && props.edited;
  const messageIsLoading = (message as any)._creating || (message as any)._updating;
  const messageSaveFailed = (message as any)._failed;

  return (
    <div
      className={classNames('message-content', {
        active,
        'loading-interaction': loadingAction,
        'link-to-thread': props.linkToThread,
      })}
      onMouseEnter={() => {
        setDidMouseOver(true);
      }}
      onClick={() => setActive(false)}
    >
      <MessageHeader linkToThread={props.linkToThread} />
      {!!showEdition && !deleted && (
        <div className="content-parent">
          <MessageEdition
            onDeleted={() => console.log('Message has been deleted')}
            onEdited={() => console.log('Message has been edited')}
          />
        </div>
      )}
      {!showEdition && (
        <div className="content-parent dont-break-out">
          {deleted === true ? (
            <div className="deleted-message">
              <DeletedContent userId={message.user_id || ''} />
            </div>
          ) : (
            <>
              {/*<Twacode
                className={classNames('content allow_selection', {
                  message_is_loading: messageIsLoading,
                  'message-not-sent': messageSaveFailed,
                })}
                content={MessagesService.prepareContent(
                  message.content,
                  message.user_specific_content,
                )}
                isApp={message.subtype === 'application'}
                after={
                  message.edited?.edited_at &&
                  message.type === 'message' &&
                  !message.subtype && <div className="edited">(edited)</div>
                }
                simple={props.linkToThread}
                onAction={(type: string, id: string, context: any, passives: any, evt: any) =>
                  onAction(type, id, context, passives, evt)
                }
              />*/}
              {message?.files && message?.files?.length > 0 && (
                <Row justify="start" align="middle" className="small-top-margin" wrap>
                  {message.files.map((f, i) =>
                    f.metadata ? (
                      <FileComponent
                        key={i}
                        className="small-right-margin small-bottom-margin"
                        type="message"
                        file={{
                          id: f.metadata.external_id,
                          name: f.metadata.name || '',
                          size: f.metadata.size || 0,
                          company_id: f.company_id || companyId,
                          // TODO Get route using a service ?
                          thumbnail: f.metadata?.thumbnails?.[0]?.url
                            ? `${Globals.api_root_url}/internal/services/files/v1${f.metadata.thumbnails[0].url}`
                            : undefined,
                          type: f.metadata.type || '',
                        }}
                      />
                    ) : (
                      <></>
                    ),
                  )}
                </Row>
              )}
              {!messageSaveFailed && <Reactions />}
              {messageSaveFailed && !messageIsLoading && <RetryButtons />}
            </>
          )}
        </div>
      )}
      {!showEdition && !deleted && !messageSaveFailed && didMouseOver && (
        <Options
          onOpen={() => setActive(true)}
          onClose={() => setActive(false)}
          threadHeader={props.threadHeader}
        />
      )}
    </div>
  );
};
