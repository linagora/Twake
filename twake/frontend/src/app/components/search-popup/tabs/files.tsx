import * as Text from '@atoms/text';
import Languages from 'app/features/global/services/languages-service';
import { useSearchMessagesFiles } from 'app/features/search/hooks/use-search-files-or-medias';
import { SearchInputState } from 'app/features/search/state/search-input';
import { useRecoilValue } from 'recoil';
import NothingFound from '../parts/nothing-found';
import FileUploadAPIClient from '@features/files/api/file-upload-api-client';
import { onFilePreviewClick } from '../common';
import FileResult from '../parts/file-result';

export default () => {
  const input = useRecoilValue(SearchInputState);
  const isRecent = input?.query?.length === 0;
  const { files, loading, loadMore } = useSearchMessagesFiles();

  if (files.length === 0 && !loading) return <NothingFound />;

  return (
    <div>
      <Text.Subtitle className="block">
        {isRecent
          ? Languages.t('components.searchpopup.recent_files')
          : Languages.t('components.searchpopup.files')}
      </Text.Subtitle>

      <div className="">
        <FilesResults />
      </div>
    </div>
  );
};

export const FilesResults = (props: { max?: number }) => {
  const { files, loading, loadMore } = useSearchMessagesFiles();

  if (files.length === 0 && !loading) return <NothingFound />;

  return (
    <>
      {files.slice(0, props?.max || files.length).map(file => (
        <FileResult key={file.id} file={file} />
      ))}
    </>
  );
};
