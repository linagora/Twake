import { Button } from 'app/atoms/button/button';
import { Modal, ModalContent } from 'app/atoms/modal';
import { Base, BaseSmall, Title } from 'app/atoms/text';
import UploadZone from 'app/components/uploads/upload-zone';
import { useDriveActions } from 'app/features/drive/hooks/use-drive-actions';
import { useDriveItem } from 'app/features/drive/hooks/use-drive-item';
import { useDriveUpload } from 'app/features/drive/hooks/use-drive-upload';
import { formatBytes } from 'app/features/drive/utils';
import { formatDate } from 'app/features/global/utils/format-date';
import { useEffect, useRef } from 'react';
import { atom, useRecoilState } from 'recoil';
import { DocumentRow } from '../../item-row/document-row';

export type VersionsModalType = {
  open: boolean;
  id: string;
};

export const VersionsModalAtom = atom<VersionsModalType>({
  key: 'VersionsModalAtom',
  default: {
    open: false,
    id: '',
  },
});

export const VersionsModal = () => {
  const [state, setState] = useRecoilState(VersionsModalAtom);

  return (
    <Modal open={state.open} onClose={() => setState({ ...state, open: false })}>
      {!!state.id && <VersionModalContent id={state.id} />}
    </Modal>
  );
};

const VersionModalContent = ({ id }: { id: string }) => {
  const { item, versions, refresh, loading, uploadVersion } = useDriveItem(id);
  const { download } = useDriveActions();

  const uploadZone = 'drive_versions_' + id;
  const uploadZoneRef = useRef<UploadZone | null>(null);

  useEffect(() => {
    refresh(id);
  }, []);

  if (!item?.last_version_cache) return <></>;

  return (
    <ModalContent title={'Versions of ' + item?.name}>
      <UploadZone
        overClassName={'!m-4'}
        disableClick
        parent={''}
        multiple={false}
        allowPaste={false}
        ref={uploadZoneRef}
        driveCollectionKey={uploadZone}
        disabled={loading}
        onAddFiles={async (files: File[]) => {
          const file = files[0];
          await uploadVersion(file);
          await refresh(id);
        }}
      >
        <div className={'flex flex-row items-center bg-slate-100 rounded-md mb-4 p-4'}>
          <div className="flex flex-row">
            <div className="grow flex items-center">
              <Base>
                Manage your document version here: Download older version of this document or upload
                a new version now.
              </Base>
            </div>
            <div className="shrink-0 ml-4 flex items-center">
              <Button
                theme="primary"
                onClick={() => uploadZoneRef.current?.open()}
                loading={loading}
              >
                Create version
              </Button>
            </div>
          </div>
        </div>

        {[...(versions || [item.last_version_cache])].map((version, index) => (
          <div
            key={index}
            className={
              'flex flex-row items-center border -mt-px px-4 py-3 cursor-pointer hover:bg-zinc-500 hover:bg-opacity-10 ' +
              (index === 0 ? 'rounded-t-md ' : '') +
              (index === (versions || []).length ? 'rounded-b-md ' : '')
            }
          >
            <div className="grow text-ellipsis whitespace-nowrap overflow-hidden">
              <Base>{version.file_metadata.name}</Base>
            </div>
            <div className="shrink-0 ml-4">
              <BaseSmall>{formatDate(version.date_added || 0)}</BaseSmall>
            </div>
            <div className="shrink-0 ml-4">
              <BaseSmall>{formatBytes(version.file_metadata.size || 0)}</BaseSmall>
            </div>
            <div className="shrink-0 ml-4">
              <Button theme="outline" onClick={() => download(id, version.drive_item_id)}>
                Download
              </Button>
            </div>
          </div>
        ))}
      </UploadZone>
    </ModalContent>
  );
};
