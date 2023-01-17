import { ChevronDownIcon } from '@heroicons/react/outline';
import { Button } from 'app/atoms/button/button';
import { Base, BaseSmall, Subtitle, Title } from 'app/atoms/text';
import { getFilesTree } from 'app/components/uploads/file-tree-utils';
import UploadZone from 'app/components/uploads/upload-zone';
import { useDriveChildren } from 'app/features/drive/hooks/use-drive-children';
import { useDriveItem } from 'app/features/drive/hooks/use-drive-item';
import { useDriveUpload } from 'app/features/drive/hooks/use-drive-upload';
import { formatBytes } from 'app/features/drive/utils';
import { useUploadZones } from 'app/features/files/hooks/use-upload-zones';
import { FileType } from 'app/features/files/types/file';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { DriveItem } from './drive-item';
import { DocumentRow } from './item-row/document-row';
import { FolderRow } from './item-row/folder-row';
import { CreateModal, CreateModalAtom } from './modals/create-modal';

export default () => {
  const companyId = useRouterCompany();

  const { children, refresh, create } = useDriveChildren('root');
  const { item } = useDriveItem('root');
  const { item: trash, refresh: refreshTrash } = useDriveItem('trash');
  const { uploadTree } = useDriveUpload();
  const [checked, setChecked] = useState<{ [key: string]: boolean }>({});

  const uploadZone = 'drive_' + companyId;
  const uploadZoneRef = useRef<UploadZone | null>(null);

  const setCreationModalState = useSetRecoilState(CreateModalAtom);

  useEffect(() => {
    refresh();
    refreshTrash();
  }, []);

  const openItemModal = useCallback(() => {
    if (item?.id) setCreationModalState({ open: true, parent_id: item.id });
  }, [item?.id, setCreationModalState]);

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
      uploadOptions={{ parent: 'root' }}
      onAddFiles={async (_, event) => {
        const tree = await getFilesTree(event);
        setCreationModalState({ parent_id: '', open: false });
        uploadTree(tree, {
          companyId,
          parentId: 'root',
        });
      }}
    >
      <CreateModal selectFromDevice={() => uploadZoneRef.current?.open()} />

      <div className="flex flex-col p-4 grow h-full overflow-auto">
        <div className="flex flex-row shrink-0 items-center">
          <Title>Home</Title>
          <div className="grow" />
          <BaseSmall>{formatBytes(item?.size || 0)} used in this folder</BaseSmall>
          <Button theme="outline" className="ml-4 flex flex-row items-center">
            <span>{selectedCount > 1 ? `${selectedCount} items` : 'More'} </span>
            <ChevronDownIcon className="h-4 w-4 ml-2 -mr-1" />
          </Button>
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
                  onClick={() => {}}
                  checked={checked[item.id] || false}
                  onCheck={v => setChecked({ ...checked, [item.id]: v })}
                />
              ))}
              <div className="my-6" />
            </>
          )}

          <Title className="mb-2 block">Documents</Title>

          {documents.length === 0 && (
            <div className="mt-4 text-center border-2 border-dashed rounded-md p-8">
              <Subtitle className="block mb-2">Nothing here.</Subtitle>
              <Base>Drag and drop files to upload them or click on the 'Add document' button.</Base>
              <br />
              <Button onClick={() => openItemModal()} theme="primary" className="mt-4">
                Add document or folder
              </Button>
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
              checked={checked[item.id] || false}
              onCheck={v => setChecked({ ...checked, [item.id]: v })}
            />
          ))}
        </div>
      </div>
    </UploadZone>
  );
};
