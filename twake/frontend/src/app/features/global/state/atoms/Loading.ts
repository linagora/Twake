import { atomFamily } from 'recoil';

export const LoadingState = atomFamily<boolean, string>({
  key: 'LoadingState',
  default: tag => false,
});
