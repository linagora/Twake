import { atomFamily } from 'recoil';

export const LoadingState = atomFamily<boolean, string>({
  key: 'LoadingState',
  default: tag => false,
});

export const LoadingStateInitTrue = atomFamily<boolean, string>({
  key: 'LoadingStateInitTrue',
  default: tag => true,
});
