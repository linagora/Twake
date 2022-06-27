import * as Text from '@atoms/text';
import Languages from '@features/global/services/languages-service';
import { useSearchMessagesMedias } from '@features/search/hooks/use-search-files-or-medias';
import { SearchInputState } from '@features/search/state/search-input';
import Media from '@molecules/media';
import { useRecoilValue } from 'recoil';
import FileUploadAPIClient from '@features/files/api/file-upload-api-client';
import { onFilePreviewClick } from '../common';
import NothingFound from '../parts/nothing-found';

export default () => {
  const input = useRecoilValue(SearchInputState);
  const isRecent = input?.query?.length === 0;

  return (
    <div>
      <Text.Subtitle className="block">
        {isRecent
          ? Languages.t('components.searchpopup.recent_media')
          : Languages.t('components.searchpopup.media')}
      </Text.Subtitle>

      <div className="-mx-2">
        <MediasResults />
      </div>
    </div>
  );
};

export const MediasResults = (props: { max?: number }) => {
  const { files, loading, loadMore } = useSearchMessagesMedias();

  if (files.length === 0 && !loading) return <NothingFound />;

  return (
    <>
      {files
        .slice(0, props?.max || files.length)
        .map(file => {
          const url = FileUploadAPIClient.getFileThumbnailUrlFromMessageFile(file);
          const type = FileUploadAPIClient.mimeToType(file?.metadata?.mime || '');
          if (url)
            return (
              <div
                className="cursor-pointer hover:opacity-75 inline-block m-2"
                onClick={() => onFilePreviewClick(file)}
              >
                <Media
                  key={file.id}
                  size="lg"
                  url={url}
                  duration={
                    type === 'video'
                      ? file?.metadata?.name?.split('.').slice(-1)?.[0]?.toLocaleUpperCase()
                      : undefined
                  }
                />
              </div>
            );
        })
        .filter(a => a)}
    </>
  );
};
