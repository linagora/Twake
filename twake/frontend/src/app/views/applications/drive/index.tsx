import { ChevronDownIcon } from '@heroicons/react/outline';
import { Button } from 'app/atoms/button/button';
import { Base, BaseSmall, Subtitle, Title } from 'app/atoms/text';
import UploadZone from 'app/components/uploads/upload-zone';
import { useDriveChildren } from 'app/features/drive/hooks/use-drive-children';
import { useEffect, useState } from 'react';
import { DriveItem } from './drive-item';
import { DocumentRow } from './item-row/document-row';
import { FolderRow } from './item-row/folder-row';

export default () => {
  const [checked, setChecked] = useState<{ [key: string]: boolean }>({});

  const { children, refresh } = useDriveChildren('root');

  useEffect(() => {
    refresh();
  }, []);

  const selectedCount = Object.values(checked).filter(v => v).length;
  const drives = [1, 2];
  const folders = [1, 2, 3];
  const documents = [10, 20, 30];
  return (
    <UploadZone overClassName={'!m-4'} disableClick parent={''}>
      <div className="flex flex-col p-4 grow h-full overflow-auto">
        <div className="flex flex-row shrink-0 items-center">
          <Title>Home</Title>
          <div className="grow" />
          <BaseSmall>1.8 TB used in this folder</BaseSmall>
          <Button theme="outline" className="ml-4 flex flex-row items-center">
            <span>{selectedCount > 1 ? `${selectedCount} items` : 'More'} </span>
            <ChevronDownIcon className="h-4 w-4 ml-2 -mr-1" />
          </Button>
        </div>

        <div className="bg-zinc-500 bg-opacity-10 rounded-md p-4 my-4 w-auto max-w-md">
          <BaseSmall>Welcome to your company drive.</BaseSmall>
          <div className="w-full">
            <Title>
              1.8 <Base>TB used, </Base> <Base>823 MB in trash</Base>
            </Title>
          </div>
        </div>

        <div className="grow">
          {drives.length > 0 && (
            <>
              <Title className="mb-2 block">Devices</Title>

              <div className="-m-1">
                {drives.map((i, index) => (
                  <DriveItem key={index} onClick={() => {}} />
                ))}
              </div>
              <div className="my-6" />
            </>
          )}

          {folders.length > 0 && (
            <>
              <Title className="mb-2 block">Folders</Title>

              {folders.map((i, index) => (
                <FolderRow
                  key={index}
                  className={
                    (index === 0 ? 'rounded-t-md ' : '') +
                    (index === folders.length - 1 ? 'rounded-b-md ' : '')
                  }
                  onClick={() => {}}
                  checked={checked[i] || false}
                  onCheck={v => setChecked({ ...checked, [i]: v })}
                />
              ))}
              <div className="my-6" />
            </>
          )}

          <Title className="mb-2 block">Documents</Title>

          {documents.length === 0 && (
            <div className=" text-center border-2 border-dashed rounded-md p-8">
              <Subtitle className="block mb-2">Nothing here.</Subtitle>
              <Base>Drag and drop files to upload them or click on the 'Add document' button.</Base>
              <br />
              <Button theme="primary" className="mt-4">
                Add document
              </Button>
            </div>
          )}

          {documents.map((i, index) => (
            <DocumentRow
              key={index}
              className={
                (index === 0 ? 'rounded-t-md ' : '') +
                (index === documents.length - 1 ? 'rounded-b-md ' : '')
              }
              onClick={() => {}}
              checked={checked[i] || false}
              onCheck={v => setChecked({ ...checked, [i]: v })}
            />
          ))}
        </div>
      </div>
    </UploadZone>
  );
};
