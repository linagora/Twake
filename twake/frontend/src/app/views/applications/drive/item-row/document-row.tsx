import { DotsHorizontalIcon } from '@heroicons/react/outline';
import { DocumentIcon } from '@heroicons/react/solid';
import { Button } from 'app/atoms/button/button';
import { Base, BaseSmall } from 'app/atoms/text';
import { useState } from 'react';
import { CheckableIcon, DriveItemProps } from './common';

export const DocumentRow = ({ className, onCheck, checked, onClick }: DriveItemProps) => {
  const [hover, setHover] = useState(false);

  return (
    <div
      className={
        'flex flex-row items-center border -mt-px px-4 py-3 cursor-pointer ' +
        (checked
          ? 'bg-blue-500 bg-opacity-10 hover:bg-opacity-25  '
          : 'hover:bg-zinc-500 hover:bg-opacity-10 ') +
        (className || '')
      }
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={e => {
        if (e.shiftKey || e.ctrlKey) onCheck(!checked);
        else onClick();
      }}
    >
      <CheckableIcon
        className="mr-2 -ml-1"
        show={hover || checked}
        checked={checked}
        onCheck={onCheck}
        fallback={<DocumentIcon className="h-5 w-5 shrink-0 text-gray-400" />}
      />
      <div className="grow text-ellipsis whitespace-nowrap overflow-hidden">
        <Base>My super document</Base>
      </div>
      <div className="shrink-0 ml-4">
        <BaseSmall>14mb</BaseSmall>
      </div>
      <div className="shrink-0 ml-4">
        <Button
          theme={'secondary'}
          size="sm"
          className={'!rounded-full '}
          icon={DotsHorizontalIcon}
        />
      </div>
    </div>
  );
};
