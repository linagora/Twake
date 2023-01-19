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

export type PropertiesModalType = {
  open: boolean;
  id: string;
};

export const PropertiesModalAtom = atom<PropertiesModalType>({
  key: 'PropertiesModalAtom',
  default: {
    open: false,
    id: '',
  },
});

export const PropertiesModal = () => {
  const [state, setState] = useRecoilState(PropertiesModalAtom);

  return (
    <Modal open={state.open} onClose={() => setState({ ...state, open: false })}>
      {!!state.id && <PropertiesModalContent id={state.id} />}
    </Modal>
  );
};

const PropertiesModalContent = ({ id }: { id: string }) => {
  const { item, refresh, loading } = useDriveItem(id);
  const { download } = useDriveActions();

  useEffect(() => {
    refresh(id);
  }, []);

  return <ModalContent title={'Properties of ' + item?.name}>TODO</ModalContent>;
};
