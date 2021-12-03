import { MessageFileType } from 'app/models/Message';
import { atom } from 'recoil';

export const PendingUploadZonesListState = atom<Map<string, MessageFileType[]> | undefined>({
  key: 'PendingUploadZonesListState',
  default: undefined,
});
