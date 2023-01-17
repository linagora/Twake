import { atomFamily } from 'recoil';
import { DriveItem, DriveItemDetails } from '../types';

export const DriveItemChildrenAtom = atomFamily<DriveItem[], string>({
  key: 'DriveItemChildrenAtom',
  default: (_: string) => [],
});

export const DriveItemAtom = atomFamily<Partial<DriveItemDetails> | null, string>({
  key: 'DriveItemAtom',
  default: (_: string) => null,
});
