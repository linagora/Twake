import { DotsHorizontalIcon } from '@heroicons/react/outline';
import { FolderIcon } from '@heroicons/react/solid';
import { Button } from 'app/atoms/button/button';
import { Base, BaseSmall } from 'app/atoms/text';
import Menu from 'app/components/menus/menu';
import { formatBytes } from 'app/features/drive/utils';
import { useState } from 'react';
import { PublicIcon } from '../components/public-icon';
import { CheckableIcon, DriveItemProps } from './common';

export const FolderRow = ({
  item,
  className,
  onCheck,
  checked,
  onClick,
  onBuildContextMenu,
}: DriveItemProps) => {
  const [hover, setHover] = useState(false);

  return (
    <div
      className={
        'flex flex-row items-center border -mt-px px-4 py-3 cursor-pointer ' +
        (className || '') +
        (checked
          ? 'bg-blue-500 bg-opacity-10 hover:bg-opacity-25 '
          : 'hover:bg-zinc-500 hover:bg-opacity-10 ') +
        (className || '')
      }
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={e => {
        if (e.shiftKey || e.ctrlKey) onCheck(!checked);
        else if (onClick) onClick();
      }}
    >
      <div onClick={e => e.stopPropagation()}>
        <CheckableIcon
          className="mr-2 -ml-1"
          show={hover || checked}
          checked={checked}
          onCheck={onCheck}
          fallback={<FolderIcon className="h-5 w-5 shrink-0 text-blue-500" />}
        />
      </div>
      <div className="grow text-ellipsis whitespace-nowrap overflow-hidden">
        <Base className="!font-semibold">{item.name}</Base>
      </div>
      <div className="shrink-0 ml-4">
        {item?.access_info?.public?.level !== 'none' && (
          <PublicIcon className="h-5 w-5 text-blue-500" />
        )}
      </div>
      <div className="shrink-0 ml-4 text-right" style={{ minWidth: 80 }}>
        <BaseSmall>{formatBytes(item.size)}</BaseSmall>
      </div>
      <div className="shrink-0 ml-4">
        <Menu menu={onBuildContextMenu}>
          <Button
            theme={'secondary'}
            size="sm"
            className={'!rounded-full '}
            icon={DotsHorizontalIcon}
          />
        </Menu>
      </div>
    </div>
  );
};
