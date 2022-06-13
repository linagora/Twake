import Strings from 'features/global/utils/strings';
import { FileSearchResult, MessageFileType } from 'features/messages/types/message';
import assert from 'assert';
import DriveService from 'deprecated/Apps/Drive/Drive';
import FileUploadService from 'features/files/services/file-upload-service';

export const highlightText = (text?: string, highlight?: string) => {
  if (!text || !highlight) {
    return '';
  }
  const reg = new RegExp('(' + Strings.removeAccents(highlight) + ')', 'ig');
  return Strings.removeAccents(text).replace(reg, "<span class='highlight'>$1</span>");
};

export const onFilePreviewClick = (fileSearchResult: FileSearchResult) => {
  const file = getFileFromFileSearchResult(fileSearchResult);

  assert(file.id);
  assert(file.metadata?.name);

  DriveService.viewDocument(
    {
      id: file.id,
      name: file.metadata?.name,
      url: FileUploadService.getDownloadRoute({
        companyId: file.company_id || '',
        fileId: file.id,
      }),
      extension: file.metadata.name.split('.').pop(),
    },
    true,
  );
};

export const onFileDownloadClick = (fileSearchResult: FileSearchResult) => {
  const file = getFileFromFileSearchResult(fileSearchResult);

  assert(file.company_id);
  assert(file.id);

  const url = FileUploadService.getDownloadRoute({
    companyId: file.company_id,
    fileId: file.id,
  });

  url && (window.location.href = url);
};

const getFileFromFileSearchResult = (fileSearchResult: FileSearchResult): MessageFileType => {
  let file: MessageFileType;
  [file] = fileSearchResult.message.files;
  return file;
};
