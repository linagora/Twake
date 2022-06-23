import React from 'react';
import { FileSearchResult } from 'features/messages/types/message';
import { Thumbnail } from 'components/search-popup/parts/thumbnail';

type PropsType = {
  fileSearchResult: FileSearchResult;
  onClick: () => void;
};

export default ({ fileSearchResult, onClick }: PropsType): JSX.Element => {
  if (!fileSearchResult.thumbnail_url) {
    return <div />;
  }

  return (
    <div className="p-1 cursor-pointer" onClick={onClick}>
      <div className="rounded-sm border border-zinc-200 overflow-hidden">
        <Thumbnail
          fileSearchResult={fileSearchResult}
          className="object-cover w-32 h-32 transition-transform hover:scale-105"
        />
      </div>
    </div>
  );
};
