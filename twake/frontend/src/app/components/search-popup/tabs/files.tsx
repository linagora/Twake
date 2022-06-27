import * as Text from '@atoms/text';
import Languages from 'app/features/global/services/languages-service';
import { useSearchMessagesFiles } from 'app/features/search/hooks/use-search-files-or-medias';
import { SearchInputState } from 'app/features/search/state/search-input';
import { useRecoilValue } from 'recoil';
import NothingFound from '../parts/nothing-found';
import FileUploadAPIClient from '@features/files/api/file-upload-api-client';
import { onFilePreviewClick } from '../common';

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

      <div className="-mx-2">
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
      {files
        .slice(0, props.max || files.length)
        .map(file => {
          const url = FileUploadAPIClient.getFileThumbnailUrlFromMessageFile(file);
          const type = FileUploadAPIClient.mimeToType(file?.metadata?.mime || '');
          if (url)
            return (
              <div
                className="cursor-pointer hover:opacity-75 inline-block m-2"
                onClick={() => onFilePreviewClick(file)}
              >
                TODO
              </div>
            );
        })
        .filter(a => a)}
    </>
  );
};
