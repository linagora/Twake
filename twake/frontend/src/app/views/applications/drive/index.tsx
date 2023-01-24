import { ChevronDownIcon } from '@heroicons/react/outline';
import { Button } from 'app/atoms/button/button';
import { Base, BaseSmall, Subtitle, Title } from 'app/atoms/text';
import Menu from 'app/components/menus/menu';
import { getFilesTree } from 'app/components/uploads/file-tree-utils';
import UploadZone from 'app/components/uploads/upload-zone';
import { setPublicLinkToken } from 'app/features/drive/api-client/api-client';
import { useDriveActions } from 'app/features/drive/hooks/use-drive-actions';
import { useDriveItem } from 'app/features/drive/hooks/use-drive-item';
import { useDriveRealtime } from 'app/features/drive/hooks/use-drive-realtime';
import { useDriveUpload } from 'app/features/drive/hooks/use-drive-upload';
import { formatBytes } from 'app/features/drive/utils';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import _ from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { atom, atomFamily, useRecoilState, useSetRecoilState } from 'recoil';
import HeaderPath from './header-path';
import { DocumentRow } from './item-row/document-row';
import { FolderRow } from './item-row/folder-row';
import { ConfirmDeleteModal, ConfirmDeleteModalAtom } from './modals/confirm-delete';
import { ConfirmTrashModal, ConfirmTrashModalAtom } from './modals/confirm-trash';
import { CreateModal, CreateModalAtom } from './modals/create';
import { PropertiesModal } from './modals/properties';
import { SelectorModal, SelectorModalAtom } from './modals/selector';
import { AccessModal } from './modals/update-access';
import { VersionsModal } from './modals/versions';

export const DriveCurrentFolderAtom = atomFamily<string, string>({
  key: 'DriveCurrentFolderAtom',
  default: startingParentId => startingParentId || 'root',
});

export default () => {
  const companyId = useRouterCompany();

  //Public link section
  const { token, documentId } = useParams() as { token?: string; documentId?: string };
  setPublicLinkToken(token || null);

  const [parentId, setParentId] = useRecoilState(DriveCurrentFolderAtom(documentId || 'root'));

  const { download, downloadZip, update } = useDriveActions();
  const { item, inTrash, refresh, children, loading } = useDriveItem(parentId);
  const { item: trash, refresh: refreshTrash } = useDriveItem('trash');
  const { uploadTree } = useDriveUpload();
  useDriveRealtime(parentId);

  const uploadZone = 'drive_' + companyId;
  const uploadZoneRef = useRef<UploadZone | null>(null);
  const [checked, setChecked] = useState<{ [key: string]: boolean }>({});

  const setCreationModalState = useSetRecoilState(CreateModalAtom);
  const setSelectorModalState = useSetRecoilState(SelectorModalAtom);
  const setConfirmDeleteModalState = useSetRecoilState(ConfirmDeleteModalAtom);
  const setConfirmTrashModalState = useSetRecoilState(ConfirmTrashModalAtom);

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
  const folders = children.filter(i => i.is_directory).sort((a, b) => a.name.localeCompare(b.name));
  const documents = (
    item?.is_directory === false
      ? //We use this hack for public shared single file
        item
        ? [item]
        : []
      : children
  )
    .filter(i => !i.is_directory)
    .sort((a, b) => a.name.localeCompare(b.name));
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
      <AccessModal />
      <PropertiesModal />
      <ConfirmDeleteModal />
      <ConfirmTrashModal />

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
                          parent_id: inTrash ? 'root' : parentId,
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
                        setConfirmDeleteModalState({
                          open: true,
                          items: children.filter(a => checked[a.id]),
                        });
                      },
                    },
                    {
                      type: 'menu',
                      text: 'Move ' + selectedCount + ' items to trash',
                      hide: inTrash,
                      className: 'error',
                      onClick: async () =>
                        setConfirmTrashModalState({
                          open: true,
                          items: children.filter(a => checked[a.id]),
                        }),
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
                      hide: parentId != 'trash',
                      onClick: () => {
                        setConfirmDeleteModalState({
                          open: true,
                          items: children, //Fixme: Here it works because this menu is displayed only in the trash root folder
                        });
                      },
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

        {item?.id === 'trash' && (
          <div className="bg-zinc-500 bg-opacity-10 rounded-md p-4 my-4 w-auto max-w-md">
            <BaseSmall>You are in the trash</BaseSmall>
            <div className="w-full mt-2">
              <Button theme="outline" onClick={() => setParentId('root')}>
                Exit trash
              </Button>
            </div>
          </div>
        )}
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
        {item?.id !== 'root' && item?.id !== 'trash' && <div className="mt-4" />}

        <div className="grow">
          {folders.length > 0 && (
            <>
              <Title className="mb-2 block">Folders</Title>

              {folders.map((item, index) => (
                <FolderRow
                  key={index}
                  inTrash={inTrash}
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
              inTrash={inTrash}
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
