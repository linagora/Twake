import { Button } from 'app/atoms/button/button';
import { Modal, ModalContent } from 'app/atoms/modal';
import { Base, BaseSmall, Title } from 'app/atoms/text';
import UploadZone from 'app/components/uploads/upload-zone';
import { useDriveActions } from 'app/features/drive/hooks/use-drive-actions';
import { useDriveItem } from 'app/features/drive/hooks/use-drive-item';
import { formatBytes } from 'app/features/drive/utils';
import { formatDate } from 'app/features/global/utils/format-date';
import { useEffect, useRef } from 'react';
import { atom, useRecoilState } from 'recoil';

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
  const { item, refresh, loading } = useDriveItem(id);

  useEffect(() => {
    refresh(id);
  }, []);

  return <ModalContent title={'Manage access to ' + item?.name}>TODO</ModalContent>;
};
