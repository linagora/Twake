import { ChevronDownIcon } from '@heroicons/react/outline';
import { Button } from 'app/atoms/button/button';
import { Base, BaseSmall, Subtitle, Title } from 'app/atoms/text';
import Menu from 'app/components/menus/menu';
import { getFilesTree } from 'app/components/uploads/file-tree-utils';
import UploadZone from 'app/components/uploads/upload-zone';
import { useDriveActions } from 'app/features/drive/hooks/use-drive-actions';
import { useDriveItem } from 'app/features/drive/hooks/use-drive-item';
import { useDriveUpload } from 'app/features/drive/hooks/use-drive-upload';
import { formatBytes } from 'app/features/drive/utils';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import _ from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';
import HeaderPath from './header-path';
import { DocumentRow } from './item-row/document-row';
import { FolderRow } from './item-row/folder-row';
import { CreateModal, CreateModalAtom } from './modals/create-modal';
import { SelectorModal, SelectorModalAtom } from './modals/selector';
import { VersionsModal } from './modals/versions';

export const DriveCurrentFolderAtom = atom<string>({
  key: 'DriveCurrentFolderAtom',
  default: 'root',
});

export default () => {
  const companyId = useRouterCompany();

  const [parentId, setParentId] = useRecoilState(DriveCurrentFolderAtom);

  const { download, downloadZip, update } = useDriveActions();
  const { item, inTrash, refresh, children, loading } = useDriveItem(parentId);
  const { item: trash, refresh: refreshTrash } = useDriveItem('trash');
  const { uploadTree } = useDriveUpload();
  const [checked, setChecked] = useState<{ [key: string]: boolean }>({});

  const uploadZone = 'drive_' + companyId;
  const uploadZoneRef = useRef<UploadZone | null>(null);

  const setCreationModalState = useSetRecoilState(CreateModalAtom);
  const setSelectorModalState = useSetRecoilState(SelectorModalAtom);

  useEffect(() => {
    setChecked({});
    refresh(parentId);
    if (parentId === 'root' || parentId === 'trash') refreshTrash(parentId);
  }, [parentId, refresh, refreshTrash]);

  const openItemModal = useCallback(() => {
    if (item?.id) setCreationModalState({ open: true, parent_id: item.id });
  }, [item?.id, setCreationModalState]);

  const canWrite = true; // TODO get write permission from backend

  const selectedCount = Object.values(checked).filter(v => v).length;
  const folders = children.filter(i => i.is_directory);
  const documents = children.filter(i => !i.is_directory);
  return (
    <UploadZone
      overClassName={'!m-4'}
      disableClick
      parent={''}
      multiple={true}
      allowPaste={true}
      ref={uploadZoneRef}
      driveCollectionKey={uploadZone}
      onAddFiles={async (_, event) => {
        const tree = await getFilesTree(event);
        setCreationModalState({ parent_id: '', open: false });
        uploadTree(tree, {
          companyId,
          parentId,
        });
      }}
    >
      <CreateModal selectFromDevice={() => uploadZoneRef.current?.open()} />
      <VersionsModal />
      <SelectorModal />

      <div
        className={
          'flex flex-col p-4 grow h-full overflow-auto ' +
          (loading && !children?.length ? 'opacity-50 ' : '')
        }
      >
        <div className="flex flex-row shrink-0 items-center">
          <HeaderPath />
          <div className="grow" />
          <BaseSmall>{formatBytes(item?.size || 0)} used in this folder</BaseSmall>
          <Menu
            menu={
              selectedCount
                ? [
                    {
                      type: 'menu',
                      text: 'Download ' + selectedCount + ' items',
                      onClick: () =>
                        selectedCount === 1
                          ? download(Object.keys(checked)[0])
                          : downloadZip(Object.keys(checked)),
                    },
                    {
                      type: 'menu',
                      text: 'Move ' + selectedCount + ' items',
                      onClick: () =>
                        setSelectorModalState({
                          open: true,
                          parent_id: parentId,
                          title: 'Move ' + selectedCount + ' items',
                          mode: 'move',
                          onSelected: async ids => {
                            for (const item of children.filter(c => checked[c.id])) {
                              await update(
                                {
                                  parent_id: ids[0],
                                },
                                item.id,
                                item.parent_id,
                              );
                            }
                          },
                        }),
                    },
                    { type: 'separator' },
                    {
                      type: 'menu',
                      text: 'Delete ' + selectedCount + ' items',
                      hide: !inTrash,
                      className: 'error',
                      onClick: () => {
                        console.log('Delete ' + selectedCount + ' items');
                      },
                    },
                    {
                      type: 'menu',
                      text: 'Move ' + selectedCount + ' items to trash',
                      hide: inTrash,
                      className: 'error',
                      onClick: async () => {
                        //TODO add an alert to say that this document may become accessible by not authored users
                        for (const item of children.filter(c => checked[c.id])) {
                          await update(
                            {
                              parent_id: 'trash',
                            },
                            item.id,
                            item.parent_id,
                          );
                        }
                      },
                    },
                  ]
                : inTrash
                ? [
                    {
                      type: 'menu',
                      text: 'Exit trash',
                      onClick: () => setParentId('root'),
                    },
                    { type: 'separator' },
                    {
                      type: 'menu',
                      text: 'Empty trash',
                      className: 'error',
                      onClick: () => console.log('Empty trash'),
                    },
                  ]
                : [
                    {
                      type: 'menu',
                      text: 'Download folder',
                      hide: inTrash,
                      onClick: () => downloadZip([parentId]),
                    },
                    {
                      type: 'menu',
                      text: 'Add document or folder',
                      hide: inTrash,
                      onClick: () => openItemModal(),
                    },
                    { type: 'separator' },
                    {
                      type: 'menu',
                      text: 'Go to trash',
                      hide: inTrash,
                      onClick: () => setParentId('trash'),
                    },
                  ]
            }
          >
            {' '}
            <Button theme="outline" className="ml-4 flex flex-row items-center">
              <span>{selectedCount > 1 ? `${selectedCount} items` : 'More'} </span>

              <ChevronDownIcon className="h-4 w-4 ml-2 -mr-1" />
            </Button>
          </Menu>
        </div>

        {item?.id === 'root' && (
          <div className="bg-zinc-500 bg-opacity-10 rounded-md p-4 my-4 w-auto max-w-md">
            <BaseSmall>Welcome to your company drive.</BaseSmall>
            <div className="w-full">
              <Title>
                {formatBytes(item?.size || 0)}
                <Base> used, </Base> <Base>{formatBytes(trash?.size || 0)} in trash</Base>
              </Title>
            </div>
          </div>
        )}
        {item?.id !== 'root' && <div className="mt-4" />}

        <div className="grow">
          {folders.length > 0 && (
            <>
              <Title className="mb-2 block">Folders</Title>

              {folders.map((item, index) => (
                <FolderRow
                  key={index}
                  className={
                    (index === 0 ? 'rounded-t-md ' : '') +
                    (index === folders.length - 1 ? 'rounded-b-md ' : '')
                  }
                  item={item}
                  onClick={() => {
                    return setParentId(item.id);
                  }}
                  checked={checked[item.id] || false}
                  onCheck={v => setChecked(_.pickBy({ ...checked, [item.id]: v }, _.identity))}
                />
              ))}
              <div className="my-6" />
            </>
          )}

          <Title className="mb-2 block">Documents</Title>

          {documents.length === 0 && !loading && (
            <div className="mt-4 text-center border-2 border-dashed rounded-md p-8">
              <Subtitle className="block mb-2">Nothing here.</Subtitle>
              {!inTrash && canWrite && (
                <>
                  <Base>
                    Drag and drop files to upload them or click on the 'Add document' button.
                  </Base>
                  <br />
                  <Button onClick={() => openItemModal()} theme="primary" className="mt-4">
                    Add document or folder
                  </Button>
                </>
              )}
            </div>
          )}

          {documents.map((item, index) => (
            <DocumentRow
              key={index}
              className={
                (index === 0 ? 'rounded-t-md ' : '') +
                (index === documents.length - 1 ? 'rounded-b-md ' : '')
              }
              onClick={() => {}}
              item={item}
              checked={checked[item.id] || false}
              onCheck={v => setChecked(_.pickBy({ ...checked, [item.id]: v }, _.identity))}
            />
          ))}
        </div>
      </div>
    </UploadZone>
  );
};
