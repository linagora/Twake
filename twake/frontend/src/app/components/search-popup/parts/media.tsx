import { onFilePreviewClick } from 'components/search-popup/parts/common';
import React from 'react';
import MediaResult from 'components/search-popup/parts/media-result';
import { FileSearchResult } from 'features/messages/types/message';

type PropsType = {
  title: string;
  files: FileSearchResult[];
  limit: number;
  splitByDates?: boolean;
};
const locale = navigator.languages[0];

export default ({ title, files, limit, splitByDates }: PropsType): JSX.Element => {
  if (!files || !files.length) {
    return <div />;
  }

  const simpleView = () =>
    files.slice(0, limit).map(file => (
      <MediaResult
        fileSearchResult={file}
        key={file.file_id}
        onClick={() => {
          onFilePreviewClick(file);
        }}
      />
    ));
  const dateView = () => {
    const dates = new Map<string, FileSearchResult[]>();

    files.forEach(f => {
      const date = new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
      }).format(new Date(f.created_at));

      if (!dates.has(date)) {
        dates.set(date, []);
      }

      dates.get(date)?.push(f);
    });

    const response = [];

    for (const date of dates.keys()) {
      const files = dates.get(date);
      response.push(<div className="text-slate-500">{date}</div>);

      const fileCont = [];
      for (const file of files || []) {
        fileCont.push(
          <MediaResult
            fileSearchResult={file}
            key={file.file_id}
            onClick={() => {
              onFilePreviewClick(file);
            }}
          />,
        );
      }

      response.push(<div className="flex flex-wrap mb-2">{fileCont}</div>);
    }

    return response;
  };

  return (
    <div className="results-group flex flex-col h-full">
      <div className="results-group-title">{title}</div>

      {splitByDates ? (
        <div className="flex flex-col overflow-y-auto">{dateView()}</div>
      ) : (
        <div className="flex flex-wrap overflow-y-auto">{simpleView()} </div>
      )}
    </div>
  );
};
