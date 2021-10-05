import React from 'react';
import { useUploadHook } from 'app/state/recoil/hooks/useUploadHook';
import PendingFilesList from './PendingFileComponents/PendingFilesList';

const ChatUploadsViewer = (): JSX.Element => {
  const { currentTask } = useUploadHook();

  return !!currentTask && currentTask.files.length > 0 && !currentTask.completed ? (
    <PendingFilesList pendingFilesState={currentTask.files} />
  ) : (
    <></>
  );
};

export default ChatUploadsViewer;
