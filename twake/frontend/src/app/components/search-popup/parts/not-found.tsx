import React from 'react';

type PropsType = {
  searchString: string;
};
export default ({ searchString }: PropsType) => {
  return (
    <div className="flex flex-col items-center">
      <div className="p-4">
        <img src="/public/icons/not-found.svg" alt="Not found" />
      </div>
      <div className="p-2">
        There were no results for “<span className="font-semibold">{searchString}</span>”. Try a new
        search
      </div>
    </div>
  );
};
