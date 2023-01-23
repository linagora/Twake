import { Button } from 'app/atoms/button/button';
import { InputLabel } from 'app/atoms/input/input-decoration-label';
import Select from 'app/atoms/input/input-select';
import A from 'app/atoms/link';
import { Modal, ModalContent } from 'app/atoms/modal';
import { Base, BaseSmall, Info, Title } from 'app/atoms/text';
import InputWithClipBoard from 'app/components/input-with-clip-board/input-with-clip-board';
import UploadZone from 'app/components/uploads/upload-zone';
import { useDriveActions } from 'app/features/drive/hooks/use-drive-actions';
import { useDriveItem } from 'app/features/drive/hooks/use-drive-item';
import { DriveFileAccessLevel } from 'app/features/drive/types';
import { formatBytes } from 'app/features/drive/utils';
import { ToasterService } from 'app/features/global/services/toaster-service';
import { copyToClipboard } from 'app/features/global/utils/CopyClipboard';
import { formatDate } from 'app/features/global/utils/format-date';
import { useEffect, useRef } from 'react';
import { atom, useRecoilState } from 'recoil';
import short, { Translator } from 'short-uuid';

export type AccessModalType = {
  open: boolean;
  id: string;
};

export const AccessModalAtom = atom<AccessModalType>({
  key: 'AccessModalAtom',
  default: {
    open: false,
    id: '',
  },
});

export const AccessModal = () => {
  const [state, setState] = useRecoilState(AccessModalAtom);

  return (
    <Modal open={state.open} onClose={() => setState({ ...state, open: false })}>
      {!!state.id && <AccessModalContent id={state.id} />}
    </Modal>
  );
};

const AccessModalContent = ({ id }: { id: string }) => {
  const { item, refresh, loading, update } = useDriveItem(id);

  useEffect(() => {
    refresh(id);
  }, []);

  return (
    <ModalContent title={'Manage access to ' + item?.name}>
      <PublicLinkManager id={id} />

      <Base className="block mt-4 mb-1">
        <b>Manage access</b>
      </Base>
    </ModalContent>
  );
};

const PublicLinkManager = ({ id }: { id: string }) => {
  const { item, loading, update } = useDriveItem(id);

  const translator = useRef(short()).current;
  const publicLink =
    `${document.location.protocol}//${document.location.host}` +
    `/shared/${translator.fromUUID(item?.company_id || '')}` +
    `/drive/${translator.fromUUID(item?.id || '')}` +
    `/t/${item?.access_info?.public?.token}`;

  return (
    <>
      <Base className="block mt-2 mb-1">
        <b>Public link access</b>
      </Base>
      <div className="flex flex-row">
        <div className="grow">
          {item?.access_info?.public?.level !== 'none' && (
            <Info>Anyone with this link will have access to this item.</Info>
          )}
          {item?.access_info?.public?.level === 'none' && (
            <Info>This item is not available by link.</Info>
          )}
          {item?.access_info?.public?.level !== 'none' && (
            <>
              <br />
              <A
                className="inline-block"
                onClick={() => {
                  copyToClipboard(publicLink);
                  ToasterService.success('Public link copied to clipboard');
                }}
              >
                Copy public link to clip board
              </A>
            </>
          )}
        </div>
        <div className="shrink-0">
          <AccessLevel
            disabled={loading}
            level={item?.access_info?.public?.level || null}
            onChange={level => {
              update({
                access_info: {
                  entities: item?.access_info.entities || [],
                  public: { ...(item?.access_info?.public || { token: '' }), level },
                },
              });
            }}
          />
        </div>
      </div>
    </>
  );
};

const AccessLevel = ({
  disabled,
  level,
  onChange,
}: {
  disabled: boolean;
  level: DriveFileAccessLevel | null;
  onChange: (level: DriveFileAccessLevel) => void;
}) => {
  return (
    <Select
      disabled={disabled}
      className="w-auto"
      value={level || 'none'}
      onChange={e => onChange(e.target.value as DriveFileAccessLevel)}
    >
      <option value={'none'}>No access</option>
      <option value={'read'}>Read</option>
      <option value={'write'}>Write</option>
      <option value={'manage'}>Manage</option>
    </Select>
  );
};
