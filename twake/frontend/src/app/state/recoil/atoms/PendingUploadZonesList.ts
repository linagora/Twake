import { atom } from 'recoil';

export const PendingUploadZonesListState = atom<Map<string, string[]> | undefined>({
  key: 'PendingUploadZonesListState',
  default: undefined,
});
