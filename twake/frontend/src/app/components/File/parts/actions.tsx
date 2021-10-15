import React, { useRef } from 'react';
import { Button } from 'antd';
import { MoreHorizontal, RotateCw, X } from 'react-feather';

import {
  isPendingFileStatusPending,
  isPendingFileStatusPause,
  isPendingFileStatusSuccess,
  isPendingFileStatusError,
  isPendingFileStatusCancel,
} from 'app/components/FileUploads/utils/PendingFiles';
import Languages from 'services/languages/languages';
import { useUpload } from 'app/state/recoil/hooks/useUpload';
import { DataFileType } from '../types';
import MenuManager from 'app/components/Menus/MenusManager';

type PropsType = {
  data: DataFileType;
};

export const FileActions = ({ data }: PropsType): JSX.Element => {
  const { cancelUpload, deleteOneFile, downloadOneFile, retryUpload } = useUpload();
  const menuRef = useRef<HTMLElement>();

  const onClickDownload = async () =>
    data.file.company_id &&
    (await downloadOneFile({
      companyId: data.file.company_id,
      fileId: data.file.id,
      fileName: data.file.name,
    }));

  const buildMenu = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation();

    MenuManager.openMenu(
      [
        {
          type: 'menu',
          // TODO add translation
          text: Languages.t('scenes.apps.drive.download_button'),
          onClick: onClickDownload,
        },
      ],
      (window as any).getBoundingClientRect(menuRef.current),
      null,
      { margin: 0 },
    );
  };

  const onClickCancel = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();

    data.file.status && isPendingFileStatusSuccess(data.file.status)
      ? data.file.backendFileId && deleteOneFile(data.file.backendFileId)
      : cancelUpload(data.file.id);
  };

  const onClickRetry = () => {
    retryUpload(data.file.id);
  };

  const setActions = () => {
    if (data.type === 'message') {
      return (
        <Button
          ref={node => node && (menuRef.current = node)}
          shape="circle"
          icon={<MoreHorizontal size={16} />}
          onClick={buildMenu}
        />
      );
    }

    if (data.type === 'input' && data.file.status) {
      if (isPendingFileStatusError(data.file.status)) {
        return (
          <Button
            shape="circle"
            icon={<RotateCw size={16} color="var(--error)" />}
            onClick={onClickRetry}
          />
        );
      }

      if (
        isPendingFileStatusPending(data.file.status) ||
        isPendingFileStatusPause(data.file.status) ||
        isPendingFileStatusSuccess(data.file.status)
      ) {
        return <Button shape="circle" icon={<X size={16} />} onClick={onClickCancel} />;
      }

      if (isPendingFileStatusCancel(data.file.status)) {
        return <></>;
      }
    }
  };

  return <div className="file-menu">{setActions()}</div>;
};

export default FileActions;
