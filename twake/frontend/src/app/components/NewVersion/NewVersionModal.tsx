import React from 'react';
import ObjectModal from '../ObjectModal/ObjectModal';
import Languages from 'services/languages/languages';
import Emojione from '../Emojione/Emojione';
import { Button } from 'antd';

const NewVersionModal = () => {
  const onClickBtn = () => {
    return window.location.reload();
  };

  return (
    <ObjectModal
      title={
        <>
          {Languages.t('components.newversion.new_version_modal.title')} <Emojione type="rocket" />
        </>
      }
      footer={
        <Button type="primary" onClick={onClickBtn}>
          {Languages.t('scenes.app.header.disconnected.reload')}
        </Button>
      }
    >
      <div className="x-margin">
        <b>{Languages.t('components.newversion.new_version_component.row.part_1')}</b>,{' '}
        {Languages.t('components.newversion.new_version_component.row.part_2')}
      </div>
    </ObjectModal>
  );
};

export default NewVersionModal;
