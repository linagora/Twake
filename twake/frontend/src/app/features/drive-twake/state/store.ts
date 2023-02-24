import { atomFamily } from 'recoil';
import { DriveTwakeTab } from '../types';

export const DriveTwakeTabAtom = atomFamily<DriveTwakeTab | null, string>({
  key: 'DriveTwakeTabAtom',
  default: () => null,
});
