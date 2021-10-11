import React from 'react';
import { Button } from 'antd';
import { useUpload } from 'app/state/recoil/hooks/useUpload';
import {
  isPendingFileStatusPending,
  isPendingFileStatusPause,
  isPendingFileStatusSuccess,
} from 'app/components/FileUploads/utils/PendingFiles';
import { MoreHorizontal, X } from 'react-feather';
import { DataFileType } from '../types';

type PropsType = {
  data: DataFileType;
};

export const FileActions = ({ data }: PropsType): JSX.Element => {
  const { cancelUpload, deleteOneFile } = useUpload();
  const shouldDisplayCancelBtn =
    data.file.status &&
    (isPendingFileStatusPending(data.file.status) ||
      isPendingFileStatusPause(data.file.status) ||
      isPendingFileStatusSuccess(data.file.status));
  return (
    <div className="file-menu">
      {shouldDisplayCancelBtn ? (
        <Button
          shape="circle"
          icon={<X size={16} />}
          onClick={() =>
            data.file.status && isPendingFileStatusSuccess(data.file.status)
              ? deleteOneFile(data.file.id)
              : cancelUpload(data.file.id)
          }
        />
      ) : (
        <Button
          shape="circle"
          icon={<MoreHorizontal size={16} />}
          onClick={e => {
            e.stopPropagation();

            // TODO open menu
            console.log('Menu clicked');
          }}
        />
      )}
    </div>
  );
};

export default FileActions;
