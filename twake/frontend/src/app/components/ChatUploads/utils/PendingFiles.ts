import { PendingFileStateType } from 'app/models/File';

export const isPendingFileStatusPause = (status: PendingFileStateType['status']): boolean => {
  return status === 'pause' ? true : false;
};

export const isPendingFileStatusError = (status: PendingFileStateType['status']): boolean => {
  return status === 'error' ? true : false;
};

export const isPendingFileStatusPending = (status: PendingFileStateType['status']): boolean => {
  return status === 'pending' ? true : false;
};

export const isPendingFileStatusSuccess = (status: PendingFileStateType['status']): boolean => {
  return status === 'success' ? true : false;
};
