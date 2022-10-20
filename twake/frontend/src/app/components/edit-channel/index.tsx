import { Transition } from '@headlessui/react';
import { Loader } from 'app/atoms/loader';
import { Modal, ModalContent } from 'app/atoms/modal';
import { useChannel } from 'app/features/channels/hooks/use-channel';
import { ChannelType } from 'app/features/channels/types/channel';
import { useEffect, useState } from 'react';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';
import { slideXTransitionReverted, slideXTransition } from 'src/utils/transitions';
import { ChannelAccessForm } from './channel-access';
import { ChannelInformationForm } from './channel-information';
import { ChannelSettingsMenu } from './channel-settings-menu';

const EditChannelModalAtom = atom({
  key: 'EditChannelModalAtom',
  default: {
    open: false,
    channelId: '',
  },
});

export const useOpenChannelModal = () => {
  const setModal = useSetRecoilState(EditChannelModalAtom);
  return (channelId: string) => setModal({ open: true, channelId });
};

export const EditChannelModal = () => {
  const [channelModal, setChannelModal] = useRecoilState(EditChannelModalAtom);

  return (
    <Modal
      open={channelModal.open}
      onClose={() => setChannelModal({ ...channelModal, open: false })}
    >
      {!channelModal.channelId && <CreateChannelForm />}
      {!!channelModal.channelId && <EditChannelForm />}
    </Modal>
  );
};

const EditChannelForm = () => {
  const [channelModal, setChannelModal] = useRecoilState(EditChannelModalAtom);
  const [page, setPage] = useState<'information' | 'access' | 'menu'>('menu');

  const { channel } = useChannel(channelModal.channelId);

  return (
    <ModalContent title="Channel settings">
      <hr className="my-1 -mx-4" />

      <div
        style={{
          display: 'grid',
          gridTemplate: '1fr / 1fr',
          placeItems: 'center',
        }}
      >
        <Transition
          style={{
            gridColumn: '1 / 1',
            gridRow: '1 / 1',
          }}
          show={page === 'menu'}
          as="div"
          {...(page === 'menu' ? slideXTransitionReverted : slideXTransition)}
        >
          <ChannelSettingsMenu
            onEditChannel={() => setPage('information')}
            onAccess={() => setPage('access')}
            channel={channel}
          />
        </Transition>
        <Transition
          style={{
            gridColumn: '1 / 1',
            gridRow: '1 / 1',
          }}
          show={page === 'information'}
          as="div"
          {...(page === 'menu' ? slideXTransitionReverted : slideXTransition)}
        >
          <ChannelInformationForm onChange={() => setPage('menu')} channel={channel} />
        </Transition>
        <Transition
          style={{
            gridColumn: '1 / 1',
            gridRow: '1 / 1',
          }}
          show={page === 'access'}
          as="div"
          {...(page === 'menu' ? slideXTransitionReverted : slideXTransition)}
        >
          <ChannelAccessForm onChange={() => setPage('menu')} channel={channel} />
        </Transition>
      </div>
    </ModalContent>
  );
};

const CreateChannelForm = () => {
  const setChannelModal = useSetRecoilState(EditChannelModalAtom);

  const [step, setStep] = useState(0);

  const [channel, setChannel] = useState<Partial<ChannelType>>({});

  useEffect(() => {
    if (step === 2) {
      //TODO: Create the channel
      //TODO: refresh channel list
      //TODO: open the channel
      setChannelModal({ open: false, channelId: '' });
    }
  }, [step]);

  return (
    <ModalContent title="New channel">
      <hr className="my-1 -mx-4" />

      <div
        style={{
          display: 'grid',
          gridTemplate: '1fr / 1fr',
          placeItems: 'center',
        }}
      >
        <Transition
          style={{
            gridColumn: '1 / 1',
            gridRow: '1 / 1',
          }}
          show={step === 0}
          as="div"
          {...slideXTransition}
        >
          <ChannelInformationForm
            onChange={changes => {
              setStep(1);
              setChannel({ ...channel, ...changes });
            }}
          />
        </Transition>

        <Transition
          style={{
            gridColumn: '1 / 1',
            gridRow: '1 / 1',
          }}
          show={step === 1}
          as="div"
          {...slideXTransition}
        >
          <ChannelAccessForm
            onChange={changes => {
              setStep(2);
              setChannel({ ...channel, ...changes });
            }}
          />
        </Transition>

        <Transition
          style={{
            gridColumn: '1 / 1',
            gridRow: '1 / 1',
          }}
          show={step === 2}
          as="div"
          {...slideXTransition}
        >
          <div className="flex items-center justify-center w-screen max-w-md h-screen max-h-96">
            <Loader className="w-6 h-6" />
          </div>
        </Transition>
      </div>
    </ModalContent>
  );
};
