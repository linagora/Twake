import { DotsHorizontalIcon } from '@heroicons/react/outline';
import { FolderIcon } from '@heroicons/react/solid';
import { Button } from 'app/atoms/button/button';
import { Base, BaseSmall } from 'app/atoms/text';
import Menu from 'app/components/menus/menu';
import { useDriveActions } from 'app/features/drive/hooks/use-drive-actions';
import { formatBytes } from 'app/features/drive/utils';
import { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { ConfirmTrashModalAtom } from '../modals/confirm-trash';
import { ConfirmDeleteModalAtom } from '../modals/confirm-delete';
import { PropertiesModalAtom } from '../modals/properties';
import { SelectorModalAtom } from '../modals/selector';
import { AccessModalAtom } from '../modals/update-access';
import { CheckableIcon, DriveItemProps } from './common';

export const FolderRow = ({
  item,
  inTrash,
  className,
  onCheck,
  checked,
  onClick,
}: DriveItemProps) => {
  const [hover, setHover] = useState(false);
  const { download, update } = useDriveActions();
  const setSelectorModalState = useSetRecoilState(SelectorModalAtom);
  const setAccessModalState = useSetRecoilState(AccessModalAtom);
  const setPropertiesModalState = useSetRecoilState(PropertiesModalAtom);
  const setConfirmDeleteModalState = useSetRecoilState(ConfirmDeleteModalAtom);
  const setConfirmTrashModalState = useSetRecoilState(ConfirmTrashModalAtom);

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
        else onClick();
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
        <BaseSmall>{formatBytes(item.size)}</BaseSmall>
      </div>
      <div className="shrink-0 ml-4">
        <Menu
          menu={[
            {
              type: 'menu',
              text: 'Download',
              onClick: () => download(item.id),
            },
            { type: 'separator' },
            {
              type: 'menu',
              text: 'Modify properties',
              onClick: () => setPropertiesModalState({ open: true, id: item.id }),
            },
            {
              type: 'menu',
              text: 'Manage access',
              onClick: () => setAccessModalState({ open: true, id: item.id }),
            },
            {
              type: 'menu',
              text: 'Move',
              onClick: () =>
                setSelectorModalState({
                  open: true,
                  parent_id: inTrash ? 'root' : item.parent_id,
                  mode: 'move',
                  title: `Move '${item.name}'`,
                  onSelected: async ids => {
                    await update(
                      {
                        parent_id: ids[0],
                      },
                      item.id,
                      item.parent_id,
                    );
                  },
                }),
            },
            { type: 'separator' },
            {
              type: 'menu',
              text: 'Move to trash',
              className: 'error',
              hide: inTrash,
              onClick: () => setConfirmTrashModalState({ open: true, items: [item] }),
            },
            {
              type: 'menu',
              text: 'Delete',
              className: 'error',
              hide: !inTrash,
              onClick: () => setConfirmDeleteModalState({ open: true, items: [item] }),
            },
          ]}
        >
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
