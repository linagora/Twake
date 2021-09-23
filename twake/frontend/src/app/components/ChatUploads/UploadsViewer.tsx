import React from 'react';

import PendingFilesList from 'app/components/FileComponents/PendingFilesList';
import { useChatUploadService } from 'app/state/recoil/hooks/useChatUploadService';
import ChatUploadService from './ChatUploadService';

const ChatUploadsViewer = (): JSX.Element => {
  const [pendingFilesListState] = useChatUploadService();

  const currentTaskFiles = (pendingFilesListState || []).filter(
    f =>
      ChatUploadService.getPendingFile(f.id).uploadTaskId === ChatUploadService.currentTaskId ||
      f.status === 'error',
  );

  const tasksEnded = currentTaskFiles.every(f => f.status === 'success');

  return !!currentTaskFiles && currentTaskFiles?.length > 0 && !tasksEnded ? (
    <PendingFilesList pendingFilesState={currentTaskFiles} />
  ) : (
    <></>
  );
};

export default ChatUploadsViewer;
