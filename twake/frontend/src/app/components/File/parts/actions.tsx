import React, { useRef } from 'react';
import { Button } from 'antd';
import { MoreHorizontal, X } from 'react-feather';

import {
  isPendingFileStatusPending,
  isPendingFileStatusPause,
  isPendingFileStatusSuccess,
} from 'app/components/FileUploads/utils/PendingFiles';
import Languages from 'services/languages/languages';
import { useUpload } from 'app/state/recoil/hooks/useUpload';
import { DataFileType } from '../types';
import MenuManager from 'app/components/Menus/MenusManager';

type PropsType = {
  data: DataFileType;
};

export const FileActions = ({ data }: PropsType): JSX.Element => {
  const { cancelUpload, deleteOneFile, downloadOneFile } = useUpload();
  const menuRef = useRef<HTMLElement>();
  const shouldDisplayCancelBtn =
    data.file.status &&
    (isPendingFileStatusPending(data.file.status) ||
      isPendingFileStatusPause(data.file.status) ||
      isPendingFileStatusSuccess(data.file.status));

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

  const onClickCancel = () =>
    data.file.status && isPendingFileStatusSuccess(data.file.status)
      ? deleteOneFile(data.file.id)
      : cancelUpload(data.file.id);

  return (
    <div className="file-menu">
      {shouldDisplayCancelBtn ? (
        <Button shape="circle" icon={<X size={16} />} onClick={onClickCancel} />
      ) : (
        <Button
          ref={node => node && (menuRef.current = node)}
          shape="circle"
          icon={<MoreHorizontal size={16} />}
          onClick={buildMenu}
        />
      )}
    </div>
  );
};

export default FileActions;
