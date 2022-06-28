import * as Text from '@atoms/text';
import FileUploadAPIClient from '@features/files/api/file-upload-api-client';
import {
  FileTypeArchiveIcon,
  FileTypeDocumentIcon,
  FileTypePdfIcon,
  FileTypeSpreadsheetIcon,
  FileTypeUnknownIcon,
} from 'app/atoms/icons-colored';
import { formatDate } from 'app/features/global/utils/format-date';
import { formatSize } from 'app/features/global/utils/format-file-size';
import { Message, MessageFileType } from 'app/features/messages/types/message';
import { SearchInputState } from 'app/features/search/state/search-input';
import { UserType } from 'app/features/users/types/user';
import Media from 'app/molecules/media';
import Highlighter from 'react-highlight-words';
import { useRecoilValue } from 'recoil';
import { onFilePreviewClick } from '../common';
import ResultContext from './result-context';

export default (props: { file: MessageFileType & { message?: Message } & { user?: UserType } }) => {
  const input = useRecoilValue(SearchInputState);
  const file = props.file;
  const type = FileUploadAPIClient.mimeToType(file?.metadata?.mime || '');
  const name = file?.metadata?.name;
  const extension = name?.split('.').pop();
  const url = FileUploadAPIClient.getFileThumbnailUrlFromMessageFile(file);

  let iconClassName = 'absolute left-0 top-0 bottom-0 right-0 m-auto w-8 h-8';
  if (url) iconClassName = 'absolute bottom-1 left-1 w-6 h-6';

  return (
    <div
      className="flex items-center p-2 hover:bg-zinc-50 rounded-md cursor-pointer"
      onClick={() => onFilePreviewClick(file)}
    >
      <div className="relative flex w-16 h-16 bg-zinc-200 mr-3 rounded-md">
        <Media size="md" url={url} duration={type === 'video' ? extension : undefined} />
        {!['image', 'video'].includes(type) && (
          <>
            {type === 'archive' ? (
              <FileTypeArchiveIcon className={iconClassName} />
            ) : type === 'pdf' ? (
              <FileTypePdfIcon className={iconClassName} />
            ) : type === 'document' ? (
              <FileTypeDocumentIcon className={iconClassName} />
            ) : type === 'slides' ? (
              <FileTypeSpreadsheetIcon className={iconClassName} />
            ) : (
              <FileTypeUnknownIcon className={iconClassName} />
            )}
          </>
        )}
      </div>
      <div className="grow mr-3">
        <Text.Base className="block">
          <Highlighter
            highlightClassName="text-blue-500 p-0 bg-blue-50"
            searchWords={input?.query?.split(' ')}
            autoEscape={true}
            textToHighlight={name}
          />
        </Text.Base>
        <Text.Info className="block">
          {extension?.toLocaleUpperCase()} • {formatDate(file?.message?.created_at)} •{' '}
          {formatSize(file?.metadata?.size)}
        </Text.Info>
        <ResultContext
          user={file.user}
          context={{
            channelId: file.message?.cache?.channel_id,
            workspaceId: file.message?.cache?.workspace_id,
            companyId: file.message?.cache?.company_id,
          }}
        />
      </div>
      <div>Actions todo</div>
    </div>
  );
};
