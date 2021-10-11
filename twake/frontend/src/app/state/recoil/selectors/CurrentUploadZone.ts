import { selectorFamily } from 'recoil';
import { PendingUploadZonesListState } from '../atoms/PendingUploadZonesList';

export const CurrentUploadZoneSelector = selectorFamily<string[] | undefined, string>({
  key: 'CurrentUploadZoneSelector',
  get:
    id =>
    ({ get }) => {
      const list = get(PendingUploadZonesListState);

      return list?.get(id) ? list.get(id) : [];
    },
});
