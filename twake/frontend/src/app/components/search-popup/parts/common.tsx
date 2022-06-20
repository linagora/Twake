import Strings from 'features/global/utils/strings';
import { FileSearchResult } from 'features/messages/types/message';
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

export const getFileMessageDownloadRoute = (fileSearchResult: FileSearchResult): string => {
  return FileUploadService.getDownloadRoute({
    companyId: fileSearchResult.company_id,
    fileId: fileSearchResult.file_id,
  });
};

export const onFilePreviewClick = (fileSearchResult: FileSearchResult) => {
  DriveService.viewDocument(
    {
      id: fileSearchResult.file_id,
      name: fileSearchResult.filename,
      url: getFileMessageDownloadRoute(fileSearchResult),
      extension: fileSearchResult.filename.split('.').pop(),
    },
    true,
  );
};

export const onFileDownloadClick = (fileSearchResult: FileSearchResult) => {
  const url = getFileMessageDownloadRoute(fileSearchResult);

  url && (window.location.href = url);
};
