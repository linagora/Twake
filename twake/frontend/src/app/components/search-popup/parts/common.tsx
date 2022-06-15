import Strings from 'features/global/utils/strings';
import { FileSearchResult, MessageFileType } from 'features/messages/types/message';
import assert from 'assert';
import DriveService from 'deprecated/Apps/Drive/Drive';
import FileUploadService from 'features/files/services/file-upload-service';

export const highlightText = (text?: string, highlight?: string) => {
  if (!text) {
    return '';
  }
  if (!highlight) {
    return text;
  }
  const reg = new RegExp('(' + Strings.removeAccents(highlight) + ')', 'ig');
  return Strings.removeAccents(text).replace(reg, "<span class='highlight'>$1</span>");
};

export const getFileMessageDownloadRoute = (messageFile: MessageFileType): string => {
  assert(messageFile.metadata);
  const file = messageFile.metadata.external_id;
  return FileUploadService.getDownloadRoute({
    companyId: file.company_id || '',
    fileId: file.id,
  });
};

export const onFilePreviewClick = (fileSearchResult: FileSearchResult) => {
  const messageFile = getFileFromFileSearchResult(fileSearchResult);

  assert(messageFile.id);
  assert(messageFile.metadata?.name);

  const file = messageFile.metadata.external_id;

  DriveService.viewDocument(
    {
      id: file.id,
      name: file.metadata?.name,
      url: getFileMessageDownloadRoute(messageFile),
      extension: (messageFile.metadata?.name || file.metadata.name).split('.').pop(),
    },
    true,
  );
};

export const onFileDownloadClick = (fileSearchResult: FileSearchResult) => {
  const messageFile = getFileFromFileSearchResult(fileSearchResult);
  const url = getFileMessageDownloadRoute(messageFile);

  url && (window.location.href = url);
};

const getFileFromFileSearchResult = (fileSearchResult: FileSearchResult): MessageFileType => {
  return fileSearchResult?.message?.files?.[0] as MessageFileType;
};
