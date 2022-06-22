import Languages from 'features/global/services/languages-service';
import { useRecoilValue } from 'recoil';
import { HasSearchQuerySelector } from 'app/features/search/state/search-input';
import { useSearchMessagesFiles } from 'app/features/search/hooks/use-search-files-or-medias';
import FilesResult from '../../parts/recent/files-result';
import { onFileDownloadClick, onFilePreviewClick } from 'components/search-popup/parts/common';

export default (): JSX.Element => {
  const isSearchMode = useRecoilValue(HasSearchQuerySelector);
  const title = isSearchMode
    ? Languages.t('components.searchpopup.files')
    : Languages.t('components.searchpopup.recent_files');

  return (
    <div className="search-results tab-files h-full">
      <div className="results-group flex flex-col h-full">
        <div className="results-group-title">{title}</div>

        <FilesResults />
      </div>
    </div>
  );
};

export const FilesResults = () => {
  const { files } = useSearchMessagesFiles();

  console.log(files);

  return (
    <div className="result-items-files overflow-x-hidden overflow-y-auto">
      {files.map(file => (
        /*<FilesResult
          fileSearchResult={file}
          key={file.file_id}
          onPreviewClick={() => {
            onFilePreviewClick(file);
          }}
          onDownloadClick={() => {
            onFileDownloadClick(file);
          }}
          showThumbnails={false}
        />*/<></>
      ))}
    </div>
  );
};
