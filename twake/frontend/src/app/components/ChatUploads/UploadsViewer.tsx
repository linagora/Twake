import React from 'react';
import { useUploadHook } from 'app/state/recoil/hooks/useChatUploadService';
import PendingFilesList from './PendingFileComponents/PendingFilesList';

const ChatUploadsViewer = (): JSX.Element => {
  const { currentTaskFiles, tasksEnded } = useUploadHook();

  return !!currentTaskFiles && currentTaskFiles?.length > 0 && !tasksEnded ? (
    <PendingFilesList pendingFilesState={currentTaskFiles} />
  ) : (
    <></>
  );
};

export default ChatUploadsViewer;
