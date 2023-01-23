import { DotsHorizontalIcon } from '@heroicons/react/outline';
import { Button } from 'app/atoms/button/button';
import {
  FileTypeArchiveIcon,
  FileTypeDocumentIcon,
  FileTypeMediaIcon,
  FileTypePdfIcon,
  FileTypeSlidesIcon,
  FileTypeSpreadsheetIcon,
  FileTypeUnknownIcon,
} from 'app/atoms/icons-colored';
import { Base, BaseSmall } from 'app/atoms/text';
import Menu from 'app/components/menus/menu';
import { useDriveActions } from 'app/features/drive/hooks/use-drive-actions';
import { formatBytes } from 'app/features/drive/utils';
import fileUploadApiClient from 'app/features/files/api/file-upload-api-client';
import { useFileViewerModal } from 'app/features/viewer/hooks/use-viewer';
import { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { PublicIcon } from '../components/public-icon';
import { ConfirmDeleteModalAtom } from '../modals/confirm-delete';
import { ConfirmTrashModalAtom } from '../modals/confirm-trash';
import { PropertiesModalAtom } from '../modals/properties';
import { SelectorModalAtom } from '../modals/selector';
import { AccessModalAtom } from '../modals/update-access';
import { VersionsModalAtom } from '../modals/versions';
import { CheckableIcon, DriveItemProps } from './common';

export const DocumentRow = ({
  item,
  className,
  inTrash,
  onCheck,
  checked,
  onClick,
}: DriveItemProps) => {
  const [hover, setHover] = useState(false);
  const { download, update } = useDriveActions();
  const { open } = useFileViewerModal();

  const setVersionModal = useSetRecoilState(VersionsModalAtom);
  const setSelectorModalState = useSetRecoilState(SelectorModalAtom);
  const setAccessModalState = useSetRecoilState(AccessModalAtom);
  const setPropertiesModalState = useSetRecoilState(PropertiesModalAtom);
  const setConfirmDeleteModalState = useSetRecoilState(ConfirmDeleteModalAtom);
  const setConfirmTrashModalState = useSetRecoilState(ConfirmTrashModalAtom);

  const fileType = fileUploadApiClient.mimeToType(
    item?.last_version_cache?.file_metadata?.mime || '',
  );

  const preview = () => {
    open({
      ...item.last_version_cache,
      metadata: item.last_version_cache.file_metadata,
    });
  };

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
      <div onClick={e => e.stopPropagation()}>
        <CheckableIcon
          className="mr-2 -ml-1"
          show={hover || checked}
          checked={checked}
          onCheck={onCheck}
          fallback={
            <>
              {fileType === 'image' || fileType === 'video' ? (
                <FileTypeMediaIcon className={'h-5 w-5 shrink-0 text-gray-400'} />
              ) : fileType === 'archive' ? (
                <FileTypeArchiveIcon className={'h-5 w-5 shrink-0 text-gray-400'} />
              ) : fileType === 'pdf' ? (
                <FileTypePdfIcon className={'h-5 w-5 shrink-0 text-gray-400'} />
              ) : fileType === 'document' ? (
                <FileTypeDocumentIcon className={'h-5 w-5 shrink-0 text-gray-400'} />
              ) : fileType === 'spreadsheet' ? (
                <FileTypeSpreadsheetIcon className={'h-5 w-5 shrink-0 text-gray-400'} />
              ) : fileType === 'slides' ? (
                <FileTypeSlidesIcon className={'h-5 w-5 shrink-0 text-gray-400'} />
              ) : (
                <FileTypeUnknownIcon className={'h-5 w-5 shrink-0 text-gray-400'} />
              )}
            </>
          }
        />
      </div>
      <div className="grow text-ellipsis whitespace-nowrap overflow-hidden">
        <Base>{item.name}</Base>
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
        <Menu
          menu={[
            {
              type: 'menu',
              text: 'Preview',
              onClick: () => preview(),
            },
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
              text: 'Versions',
              onClick: () => setVersionModal({ open: true, id: item.id }),
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
