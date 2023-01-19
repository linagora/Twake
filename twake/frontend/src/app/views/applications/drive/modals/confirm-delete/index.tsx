import { Button } from 'app/atoms/button/button';
import { Modal, ModalContent } from 'app/atoms/modal';
import { Base } from 'app/atoms/text';
import { useDriveActions } from 'app/features/drive/hooks/use-drive-actions';
import { useDriveItem } from 'app/features/drive/hooks/use-drive-item';
import { DriveItem } from 'app/features/drive/types';
import { useEffect, useState } from 'react';
import { atom, useRecoilState } from 'recoil';

export type ConfirmDeleteModalType = {
  open: boolean;
  items: DriveItem[];
};

export const ConfirmDeleteModalAtom = atom<ConfirmDeleteModalType>({
  key: 'ConfirmDeleteModalAtom',
  default: {
    open: false,
    items: [],
  },
});

export const ConfirmDeleteModal = () => {
  const [state, setState] = useRecoilState(ConfirmDeleteModalAtom);

  return (
    <Modal open={state.open} onClose={() => setState({ ...state, open: false })}>
      {!!state.items.length && <ConfirmDeleteModalContent items={state.items} />}
    </Modal>
  );
};

const ConfirmDeleteModalContent = ({ items }: { items: DriveItem[] }) => {
  const { item, refresh } = useDriveItem(items[0].id);
  const { remove } = useDriveActions();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh(items[0].id);
  }, []);

  return (
    <ModalContent
      title={
        items.length === 1
          ? `Definitively delete ${item?.name}`
          : `Definitively delete ${items.length} items`
      }
    >
      <Base>
        Click 'Delete' to definitively remove the selected items. You can't restore them later.
      </Base>
      <Button
        theme="danger"
        loading={loading}
        onClick={async () => {
          setLoading(true);
          for (const item of items) {
            await remove(item.id, item.parent_id);
          }
          setLoading(false);
        }}
      >
        Delete
      </Button>
    </ModalContent>
  );
};
