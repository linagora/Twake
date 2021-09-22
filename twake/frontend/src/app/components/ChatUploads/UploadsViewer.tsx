import React, { useEffect } from 'react';
import { PendingFilesListState } from 'app/state/recoil/atoms/PendingFilesList';
import { useRecoilState } from 'recoil';
import ChatUploadServiceManager, { ChatUploadService } from './ChatUploadService';

import PendingFilesList from 'app/components/FileComponents/PendingFilesList';

let chatUploadService: ChatUploadService;
const ChatUploadsViewer = (): JSX.Element => {
  const [pendingFilesListState, setPendingFilesListState] = useRecoilState(PendingFilesListState);

  useEffect(() => {
    chatUploadService = ChatUploadServiceManager.get();
    chatUploadService.setHandler(setPendingFilesListState);

    return chatUploadService.destroy.bind(chatUploadService);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return pendingFilesListState && pendingFilesListState?.length > 0 ? (
    <PendingFilesList pendingFilesState={pendingFilesListState} />
  ) : (
    <></>
  );
};

export default ChatUploadsViewer;
