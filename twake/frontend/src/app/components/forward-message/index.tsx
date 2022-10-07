import { Modal, ModalContent } from 'app/atoms/modal';
import { atom, useRecoilState } from 'recoil';

export const ForwardMessageAtom = atom<null | {
  id: string;
  thread_id: string;
  channel_id: string;
  workspace_id: string;
  company_id: string;
}>({
  key: 'ForwardMessageAtom',
  default: null,
});

export const ForwardMessage = () => {
  const [message, setMessage] = useRecoilState(ForwardMessageAtom);

  return (
    <Modal open={!!message} onClose={() => setMessage(null)}>
      <ModalContent title="Forward message">TODO</ModalContent>
    </Modal>
  );
};
