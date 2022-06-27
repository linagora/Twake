import Strings from 'features/global/utils/strings';
import { FileSearchResult, MessageFileType } from 'features/messages/types/message';
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

export const getFileMessageDownloadRoute = (file: MessageFileType): string => {
  if (file?.metadata?.source === 'internal')
    return FileUploadService.getDownloadRoute({
      companyId: file.metadata?.external_id?.company_id,
      fileId: file.metadata?.external_id?.id,
    });
  return '';
};

export const onFilePreviewClick = (file: MessageFileType) => {
  if (file?.metadata?.source === 'internal')
    DriveService.viewDocument(
      {
        id: file.metadata?.external_id?.id,
        name: file.metadata?.name,
        url: getFileMessageDownloadRoute(file),
        extension: (file.metadata?.name || '').split('.').pop(),
      },
      true,
    );
};

export const onFileDownloadClick = (fileSearchResult: FileSearchResult) => {
  const url = getFileMessageDownloadRoute(fileSearchResult);

  url && (window.location.href = url);
};
