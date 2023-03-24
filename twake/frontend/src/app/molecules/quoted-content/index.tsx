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
import { MessageWithReplies } from 'app/features/messages/types/message';
import PossiblyPendingAttachment from 'app/views/applications/messages/message/parts/PossiblyPendingAttachment';
import React from 'react';
import { Image } from 'react-feather';

type PropsType = {
  message: MessageWithReplies;
};

export default ({ message }: PropsType): React.ReactElement => {
  const attachmentType = fileUploadApiClient.mimeToType(message.files?.[0]?.metadata?.mime || '');

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
