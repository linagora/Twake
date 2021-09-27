import { PendingFileRecoilType } from 'app/models/File';

export const isPendingFileStatusPause = (status: PendingFileRecoilType['status']): boolean => {
  return status === 'pause' ? true : false;
};

export const isPendingFileStatusError = (status: PendingFileRecoilType['status']): boolean => {
  return status === 'error' ? true : false;
};

export const isPendingFileStatusPending = (status: PendingFileRecoilType['status']): boolean => {
  return status === 'pending' ? true : false;
};

export const isPendingFileStatusSuccess = (status: PendingFileRecoilType['status']): boolean => {
  return status === 'success' ? true : false;
};
