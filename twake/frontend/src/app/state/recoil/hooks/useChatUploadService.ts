import ChatUploadService from 'app/components/ChatUploads/ChatUploadService';
import { PendingFileStateType } from 'app/models/File';
import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { PendingFilesListState } from '../atoms/PendingFilesList';

/**
 * Fixme: Must be used only once by the main upload manager react component.
 *        If not the useEffect could be triggered when other compoentns are destroyed...
 */
export const useChatUploadService = (): [PendingFileStateType[] | undefined] => {
  const [pendingFilesListState, setPendingFilesListState] = useRecoilState(PendingFilesListState);

  useEffect(() => {
    let chatUploadService = ChatUploadService;
    chatUploadService.setHandler(setPendingFilesListState);
    return chatUploadService.destroy.bind(chatUploadService);
  }, [setPendingFilesListState]);

  return [pendingFilesListState];
};
