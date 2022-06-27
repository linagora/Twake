import FileUploadAPIClient from '@features/files/api/file-upload-api-client';
import { Message, MessageFileType } from 'app/features/messages/types/message';
import * as Text from '@atoms/text';
import { useRecoilValue } from 'recoil';
import { SearchInputState } from 'app/features/search/state/search-input';
import Highlighter from 'react-highlight-words';
import { formatSize } from 'app/features/global/utils/format-file-size';
import { formatDate } from 'app/features/global/utils/format-date';
import ResultContext from './result-context';

export default (props: { file: MessageFileType & { message?: Message } }) => {
  const input = useRecoilValue(SearchInputState);
  const file = props.file;
  const type = FileUploadAPIClient.mimeToType(file?.metadata?.mime || '');
  const name = file?.metadata?.name;
  const extension = name?.split('.').pop();

  return (
    <div className="flex items-center">
      <div className="w-14 h-14 bg-zinc-100 mr-3 overflow-hidden rounded-md">T</div>
      <div className="grow mr-3">
        <Text.Base className="block">
          <Highlighter
            highlightClassName="text-blue-500 font-semibold p-0 bg-blue-50"
            searchWords={input?.query?.split(' ')}
            autoEscape={true}
            textToHighlight={name}
          />
        </Text.Base>
        <Text.Info className="block">
          {extension?.toLocaleUpperCase()} • {formatDate(file?.message?.created_at)} •{' '}
          {formatSize(file?.metadata?.size)}
        </Text.Info>
        <ResultContext context={{}} />
      </div>
      <div>Actions todo</div>
    </div>
  );
};
