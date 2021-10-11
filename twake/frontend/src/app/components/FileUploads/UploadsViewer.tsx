import React from 'react';
import { useUpload } from 'app/state/recoil/hooks/useUpload';
import PendingFilesList from './PendingFileComponents/PendingFilesList';

const ChatUploadsViewer = (): JSX.Element => {
  const { currentTask } = useUpload();

  return !!currentTask && currentTask.files.length > 0 && !currentTask.completed ? (
    <PendingFilesList pendingFilesState={currentTask.files} />
  ) : (
    <></>
  );
};

export default ChatUploadsViewer;
