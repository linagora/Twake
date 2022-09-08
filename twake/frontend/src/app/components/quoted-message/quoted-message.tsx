import React from 'react';
import { useMessage } from 'app/features/messages/hooks/use-message';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import MessageQuote from 'app/molecules/message-quote';
import { useUser } from 'app/features/users/hooks/use-user';
import { useMessageQuoteReply } from 'app/features/messages/hooks/use-message-quote-reply';
import useRouterChannel from 'app/features/router/hooks/use-router-channel';
import User from 'app/features/users/services/current-user-service';
import { gotoMessage } from 'src/utils/messages';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import QuotedContent from 'app/molecules/quoted-content';

type PropsType = {
  closable?: boolean;
  onClose?: () => void;
};

export default ({ closable = true, onClose }: PropsType): React.ReactElement => {
  const companyId = useRouterCompany();
  const channelId = useRouterChannel();
  const workspaceId = useRouterWorkspace();
  const { message: quotedMessageId } = useMessageQuoteReply(channelId);
  const quotedMessage = useMessage({
    companyId,
    threadId: quotedMessageId,
    id: quotedMessageId,
  });

  if (!quotedMessage.message) {
    return <></>;
  }

  const { message } = quotedMessage;
  const author = useUser(message.user_id);
  const authorName = author ? User.getFullName(author) : 'Anonymous';
  const deleted = message.subtype === 'deleted';
  const quotedContent = <QuotedContent message={message} />;

  return (
    <MessageQuote
      className="mx-1"
      message={quotedContent}
      author={authorName}
      closable={closable}
      onClose={onClose}
      deleted={deleted}
      goToMessage={() => gotoMessage(message, companyId, channelId, workspaceId)}
    />
  );
};
