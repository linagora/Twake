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
import { PendingFileRecoilType } from 'app/models/File';

type PropsType = {
  file: DataFileType;
  status?: PendingFileRecoilType['status'];
  deletable?: boolean;
  actionMenu?: boolean;
  onRemove?: Function;
};

export const FileActions = ({
  file,
  status,
  deletable,
  actionMenu,
  onRemove,
}: PropsType): JSX.Element => {
  const { cancelUpload, deleteOneFile, downloadOneFile, retryUpload } = useUpload();
  const menuRef = useRef<HTMLElement>();

  const onClickDownload = async () =>
    file.company_id &&
    (await downloadOneFile({
      companyId: file.company_id,
      fileId: file.id,
      fileName: file.name,
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

    if (status && isPendingFileStatusSuccess(status)) {
      if (file.id) deleteOneFile(file.id);
    } else {
      cancelUpload(file.id);
    }

    if (onRemove) onRemove();
  };

  const onClickRetry = () => {
    retryUpload(file.id);
  };

  const setActions = () => {
    if (actionMenu) {
      return (
        <Button
          ref={node => node && (menuRef.current = node)}
          shape="circle"
          icon={<MoreHorizontal size={16} />}
          onClick={buildMenu}
        />
      );
    }

    if (deletable && status) {
      if (isPendingFileStatusError(status)) {
        return (
          <Button
            shape="circle"
            icon={<RotateCw size={16} color="var(--error)" />}
            onClick={onClickRetry}
          />
        );
      }

      if (
        isPendingFileStatusPending(status) ||
        isPendingFileStatusPause(status) ||
        isPendingFileStatusSuccess(status)
      ) {
        return <Button shape="circle" icon={<X size={16} />} onClick={onClickCancel} />;
      }

      if (isPendingFileStatusCancel(status)) {
        return <></>;
      }
    }
  };

  return <div className="file-menu">{setActions()}</div>;
};

export default FileActions;
