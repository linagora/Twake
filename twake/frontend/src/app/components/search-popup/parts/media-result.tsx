import React from 'react';
import { FileSearchResult } from 'features/messages/types/message';
import { Thumbnail } from 'components/search-popup/parts/thumbnail';

type PropsType = {
  fileSearchResult: FileSearchResult;
  onClick: () => void;
};

export default ({ fileSearchResult, onClick }: PropsType): JSX.Element => {
  const thumbnail = Thumbnail({
    fileSearchResult,
    className:
      'object-cover cursor-pointer w-24 h-24 rounded-md shadow-md transition-transform hover:scale-105',
  });

  if (!thumbnail) {
    return <div />;
  }

  return (
    <div className="p-1" onClick={onClick}>
      {thumbnail}
    </div>
  );
};
