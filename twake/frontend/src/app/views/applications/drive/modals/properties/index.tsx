import { Button } from 'app/atoms/button/button';
import { InputLabel } from 'app/atoms/input/input-decoration-label';
import { Input } from 'app/atoms/input/input-text';
import { Modal, ModalContent } from 'app/atoms/modal';
import { Base, BaseSmall, Title } from 'app/atoms/text';
import UploadZone from 'app/components/uploads/upload-zone';
import { useDriveActions } from 'app/features/drive/hooks/use-drive-actions';
import { useDriveItem } from 'app/features/drive/hooks/use-drive-item';
import { formatBytes } from 'app/features/drive/utils';
import { formatDate } from 'app/features/global/utils/format-date';
import { useEffect, useRef, useState } from 'react';
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
  const { item, refresh } = useDriveItem(id);
  const { update } = useDriveActions();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    refresh(id);
  }, []);

  useEffect(() => {
    if (!name) setName(item?.name || '');
  }, [item?.name]);

  return (
    <ModalContent title={'Properties of ' + item?.name}>
      <InputLabel
        className="mt-4"
        label={'Name'}
        input={
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Document or folder name"
          />
        }
      />
      <br />
      <Button
        disabled={!name}
        className="float-right mt-4"
        theme="primary"
        loading={loading}
        onClick={async () => {
          setLoading(true);
          if (item) await update({ name }, id, item.parent_id);
          setLoading(false);
        }}
      >
        Update name
      </Button>
    </ModalContent>
  );
};
