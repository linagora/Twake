import { MessageFileType } from 'app/models/Message';
import { atomFamily } from 'recoil';

export const PendingUploadZonesListState = atomFamily<MessageFileType[], string>({
  key: 'PendingUploadZonesListState',
  default: id => [],
});
