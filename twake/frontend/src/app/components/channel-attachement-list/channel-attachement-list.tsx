import { Modal, ModalContent } from 'app/atoms/modal';
import { channelAttachmentListState, activeChannelAttachementListTabState } from 'app/features/channels/state/channel-attachment-list';
import Languages from 'app/features/global/services/languages-service';
import Tabs from 'app/molecules/tabs';
import React from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useRecoilState } from 'recoil';

// TODO:
// - create enum for tabs

const tabs = [
  <div key="media">
    <div className="flex">
      Medias
      {/* TODO: translte */}
    </div>
  </div>,
  <div key="files">
    <div className="flex">
      Files
    {/* TODO: translte */}
    </div>
  </div>,
];

export default (): React.ReactElement => {
  const [ open, setOpen ] = useRecoilState(channelAttachmentListState);
  const [activeTab, setActiveTab] = useRecoilState(activeChannelAttachementListTabState);

  return (
    <Modal open={open} onClose={() => setOpen(false)} className="sm:w-[80vw] sm:max-w-4xl">
      <ModalContent textCenter title="Channel files and medias">
      {/* TODO: translte */}
        <Tabs tabs={tabs} selected={activeTab} onClick={index => setActiveTab(index)} />
        <>
          <PerfectScrollbar>
            {/* {activeTab === 0 && <MediaList />}
            TODO:
            - find what is the current active channel state
            - create a hook for media list in channel
            - create a hook for file list in channel
            - create molecules for media list and file list that use the hooks
            {activeTab === 1 && <FileList />} */}
          </PerfectScrollbar>
        </>
      </ModalContent>
    </Modal>
  );
};
