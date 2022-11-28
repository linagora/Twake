import {
  FileTypeArchiveIcon,
  FileTypeDocumentIcon,
  FileTypePdfIcon,
  FileTypeSpreadsheetIcon,
  FileTypeUnknownIcon,
} from 'app/atoms/icons-colored';
import { Base } from 'app/atoms/text';
import fileUploadApiClient from 'app/features/files/api/file-upload-api-client';
import Languages from 'app/features/global/services/languages-service';
import { useMessage, useSetMessage } from 'app/features/messages/hooks/use-message';
import { NodeMessage } from 'app/features/messages/types/message';
import { MessageContext } from 'app/views/applications/messages/message/message-with-replies';
import MessageContent from 'app/views/applications/messages/message/parts/MessageContent';
import React, { useContext, useEffect } from 'react';

type PropsType = {
  message: NodeMessage['quote_message']
};

export const useQuotedMessage = (
  message: NodeMessage,
  context: {
    companyId: string;
    workspaceId: string;
    channelId: string;
    threadId: string;
    id: string;
  },
) => {
  const quotedMessageFromStore = useMessage({
    ...context,
    threadId: message.quote_message?.thread_id as string,
    id: message.quote_message?.id as string,
  }).message;

  const quotedMessage = {
    ...message.quote_message,
    ...(quotedMessageFromStore || message.quote_message),
  } as NodeMessage['quote_message'];

  const setMessage = useSetMessage(quotedMessage?.company_id || context.companyId);
  useEffect(() => {
    if (!quotedMessageFromStore?.id && quotedMessage?.id) {
      setMessage(quotedMessage);
    }
  }, []);

  return quotedMessage;
};

export default ({ message }: PropsType): React.ReactElement => {
  const context = useContext(MessageContext);

  if (!message) {
    return <></>;
  }

  const attachmentType = fileUploadApiClient.mimeToType(message.files?.[0]?.metadata?.mime || '');

  if (message.channel_id !== context.channelId) {
    return (
      <>
        <MessageContext.Provider
          value={{
            companyId: message.company_id,
            workspaceId: message.workspace_id,
            channelId: message.channel_id,
            threadId: message.thread_id,
            id: message.id || message.thread_id,
          }}
        >
          <MessageContent />
        </MessageContext.Provider>
      </>
    );
  }

  return (
    <>
      {message.text && message.text.length ? (
        <Base className="!text-sm overflow-hidden whitespace-nowrap text-ellipsis">
          {message.text}
        </Base>
      ) : (
        <div className="mb-1"></div>
      )}
      {!!message.files?.length &&
        (message.files?.length === 1 ? (
          <div className="flex flex-row align-items items-center mb-1">
            <>
              {attachmentType === 'archive' ? (
                <FileTypeArchiveIcon className="w-5 h-5 mr-1" />
              ) : attachmentType === 'pdf' ? (
                <FileTypePdfIcon className="w-5 h-5 mr-1" />
              ) : attachmentType === 'document' ? (
                <FileTypeDocumentIcon className="w-5 h-5 mr-1" />
              ) : attachmentType === 'spreadsheet' ? (
                <FileTypeSpreadsheetIcon className="w-5 h-5 mr-1" />
              ) : (
                <FileTypeUnknownIcon className="w-5 h-5 mr-1" />
              )}
            </>
            <Base className="!text-sm">{message.files?.[0].metadata?.name}</Base>
          </div>
        ) : (
          <div className="flex flex-row align-items items-center mb-1">
            <FileTypeUnknownIcon className="w-5 h-5 mr-1" />
            <Base className="!text-sm">
              {Languages.t('molecules.quoted_content.attachements', [message.files?.length])}
            </Base>
          </div>
        ))}
    </>
  );
};
