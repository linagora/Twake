import React, { Suspense, useContext, useEffect, useState } from 'react';
import 'moment-timezone';
import classNames from 'classnames';
import Reactions from './Reactions';
import Options from './Options';
import MessageHeader from './MessageHeader';
import WorkspacesApps from 'app/deprecated/workspaces/workspaces_apps.js';
import MessageEdition from './MessageEdition';
import DeletedContent from './DeletedContent';
import RetryButtons from './RetryButtons';
import FileComponent from 'app/components/file/file-component';
import { Row } from 'antd';
import Globals from 'app/features/global/services/globals-twake-app-service';
import { MessageContext } from '../message-with-replies';
import { useMessage } from 'app/features/messages/hooks/use-message';
import Blocks from './Blocks';
import { useVisibleMessagesEditorLocation } from 'app/features/messages/hooks/use-message-editor';
import { ViewContext } from 'app/views/client/main-view/MainContent';
import PossiblyPendingAttachment from './PossiblyPendingAttachment';
import MessageAttachments from './MessageAttachments';
import PseudoMarkdownCompiler from 'app/features/global/services/pseudo-markdown-compiler-service';
import LinkPreview from './LinkPreview';

type Props = {
  linkToThread?: boolean;
  threadHeader?: string;
};

let loadingInteractionTimeout: any = 0;

export default (props: Props) => {
  const [active, setActive] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [didMouseOver, setDidMouseOver] = useState(false);

  const context = useContext(MessageContext);
  const { message } = useMessage(context);

  const onInteractiveMessageAction = (action_id: string, context: any, passives: any, evt: any) => {
    const app_id = message.application_id;
    const type = 'interactive_message_action';
    const event = action_id;
    const data = {
      interactive_context: context,
      form: passives,
      message: message,
    };
    WorkspacesApps.notifyApp(app_id, type, event, data);
  };

  const onAction = (type: string, id: string, context: any, passives: any, evt: any) => {
    if (type === 'interactive_action') {
      setLoadingAction(true);
      clearTimeout(loadingInteractionTimeout);
      loadingInteractionTimeout = setTimeout(() => {
        setLoadingAction(false);
      }, 5000);
      onInteractiveMessageAction(id, context, passives, evt);
    }
  };

  useEffect(() => {
    setLoadingAction(false);
  }, [JSON.stringify(message.blocks)]);

  const deleted = message.subtype === 'deleted';

  const location = `message-${message.id}`;
  const { active: editorIsActive } = useVisibleMessagesEditorLocation(
    location,
    useContext(ViewContext).type,
  );

  const showEdition = !props.linkToThread && editorIsActive;
  const messageIsLoading = (message as any)._status === 'sending';
  const messageSaveFailed = (message as any)._status === 'failed';

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
          <MessageEdition />
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
              <div
                className={classNames('content allow_selection', {
                  message_is_loading: messageIsLoading,
                  'message-not-sent': messageSaveFailed,
                })}
              >
                {!!props.linkToThread && message.text}
                {!props.linkToThread && (
                  <>
                    <Blocks
                      blocks={message.blocks}
                      fallback={PseudoMarkdownCompiler.transformBackChannelsUsers(message.text)}
                      onAction={(
                        type: string,
                        id: string,
                        context: any,
                        passives: any,
                        evt: any,
                      ) => {
                        onAction(type, id, context, passives, evt);
                      }}
                      allowAdvancedBlocks={message.subtype === 'application'}
                    />
                  </>
                )}
              </div>

              {message?.files && (message?.files?.length || 0) > 0 && <MessageAttachments />}
              {message?.links &&
                (message?.links?.length || 0) > 0 &&
                message.links.map((preview, i) => <LinkPreview key={i} preview={preview} />)}
              {!messageSaveFailed && <Reactions />}
              {messageSaveFailed && !messageIsLoading && <RetryButtons />}
            </>
          )}
        </div>
      )}
      {!showEdition && !deleted && !messageSaveFailed && didMouseOver && !messageIsLoading && (
        <Options
          onOpen={() => setActive(true)}
          onClose={() => setActive(false)}
          threadHeader={props.threadHeader}
        />
      )}
    </div>
  );
};
