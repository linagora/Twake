import { PendingFilesListState } from 'app/state/recoil/atoms/PendingFilesList';
import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import ChatUploadService from './ChatUploadService';

import PendingFilesList from 'app/components/FileComponents/PendingFilesList';

let chatUploadService: ChatUploadService;

export default (): JSX.Element => {
  const [pendingFilesList, setPendingFilesList] = useRecoilState(PendingFilesListState);

  useEffect(() => {
    chatUploadService = new ChatUploadService();
    chatUploadService.setHandler(setPendingFilesList);

    return chatUploadService.destroy.bind(chatUploadService);
  }, [setPendingFilesList]);

  return pendingFilesList && pendingFilesList?.length > 0 ? (
    <PendingFilesList files={pendingFilesList} />
  ) : (
    <></>
  );
};
