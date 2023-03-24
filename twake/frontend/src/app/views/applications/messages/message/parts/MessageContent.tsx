import React, { useContext, useEffect, useState } from 'react';
import 'moment-timezone';
import classNames from 'classnames';
import Reactions from './Reactions';
import Options from './Options';
import MessageHeader from './MessageHeader';
import WorkspacesApps from 'app/deprecated/workspaces/workspaces_apps.js';
import MessageEdition from './MessageEdition';
import DeletedContent from './DeletedContent';
import RetryButtons from './RetryButtons';
import { MessageContext } from '../message-with-replies';
import { useMessage } from 'app/features/messages/hooks/use-message';
import Blocks from './Blocks';
import { useVisibleMessagesEditorLocation } from 'app/features/messages/hooks/use-message-editor';
import { ViewContext } from 'app/views/client/main-view/MainContent';
import MessageAttachments from './MessageAttachments';
import PseudoMarkdownCompiler from 'app/features/global/services/pseudo-markdown-compiler-service';
import LinkPreview from './LinkPreview';
import { useChannel, useIsChannelMember } from 'app/features/channels/hooks/use-channel';
import MessageQuote from 'app/molecules/message-quote';
import { useUser } from 'app/features/users/hooks/use-user';
import User from 'app/features/users/services/current-user-service';
import { gotoMessage } from 'src/utils/messages';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import QuotedContent from 'app/molecules/quoted-content';
import MessageStatus from 'app/molecules/message-status';

type Props = {
  linkToThread?: boolean;
  threadHeader?: string;
};

let loadingInteractionTimeout = 0;

export default (props: Props) => {
  const [active, setActive] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [didMouseOver, setDidMouseOver] = useState(false);

  const context = useContext(MessageContext);
  const channelId = context.channelId;
  const { message } = useMessage(context);
  const quotedMessage = useMessage({
    ...context,
    threadId: message.quote_message?.thread_id as string,
    id: message.quote_message?.id as string,
  }).message;

  const { channel } = useChannel(channelId);
  const showQuotedMessage =
    quotedMessage && quotedMessage.thread_id && channel.visibility === 'direct';
  let authorName = '';
  const currentRouterWorkspace = useRouterWorkspace();
  const workspaceId =
    context.workspaceId === 'direct' ? currentRouterWorkspace : context.workspaceId;
  const deletedQuotedMessage = quotedMessage && quotedMessage.subtype === 'deleted';

  if (showQuotedMessage) {
    const author = useUser(quotedMessage.user_id);
    authorName = author ? User.getFullName(author) : 'Anonymous';
  }

  const onInteractiveMessageAction = (action_id: string, context: unknown, passives: unknown) => {
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

  const onAction = (type: string, id: string, context: unknown, passives: unknown) => {
    if (type === 'interactive_action') {
      setLoadingAction(true);
      clearTimeout(loadingInteractionTimeout);
      loadingInteractionTimeout = window.setTimeout(() => {
        setLoadingAction(false);
      }, 5000);
      onInteractiveMessageAction(id, context, passives);
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
  const messageIsLoading = message._status === 'sending';
  const messageSaveFailed = message._status === 'failed';

  const isChannelMember = useIsChannelMember(channelId);
  const quotedContent = <QuotedContent message={quotedMessage} />;
  const showMessageStatus = message.user_id === User.getCurrentUserId();

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
      key={`message_container_${message.id}`}
    >
      <MessageHeader linkToThread={props.linkToThread} />
      {showQuotedMessage && !showEdition && (
        <MessageQuote
          className="mb-1"
          author={authorName}
          message={quotedContent}
          closable={false}
          deleted={deletedQuotedMessage}
          goToMessage={() =>
            gotoMessage(quotedMessage, context.companyId, context.channelId, workspaceId)
          }
        />
      )}
      {!!showEdition && !deleted && (
        <div className="content-parent pt-1">
          <MessageEdition />
        </div>
      )}
      {!showEdition && (
        <div className="content-parent dont-break-out">
          {deleted === true ? (
            <div className="deleted-message">
              <DeletedContent userId={message.user_id || ''} key={`deleted_${message.thread_id}`} />
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
                      onAction={(type: string, id: string, context: unknown, passives: unknown) => {
                        if (isChannelMember) onAction(type, id, context, passives);
                      }}
                      allowAdvancedBlocks={message.subtype === 'application'}
                    />
                  </>
                )}
              </div>

              {message?.files && (message?.files?.length || 0) > 0 && <MessageAttachments />}
              {message?.links &&
                (message?.links?.length || 0) > 0 &&
                message.links
                  .filter(link => link && (link.title || link.description || link.img))
                  .map((preview, i) => <LinkPreview key={i} preview={preview} />)}
              {!messageSaveFailed && <Reactions />}
              {messageSaveFailed && !messageIsLoading && <RetryButtons />}
            </>
          )}
        </div>
      )}
      {isChannelMember &&
        !showEdition &&
        !deleted &&
        !messageSaveFailed &&
        didMouseOver &&
        !messageIsLoading && (
          <Options
            onOpen={() => setActive(true)}
            onClose={() => setActive(false)}
            threadHeader={props.threadHeader}
            key={`options_${message.id}`}
          />
        )}
      {showMessageStatus && !showEdition && (
        <MessageStatus key={`message_status_${message.id}`} status={message.status} />
      )}
    </div>
  );
};
