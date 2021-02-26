import React, { useEffect, useMemo } from 'react';
import { Modal } from 'antd';
import './ModalComponent.scss';
import ModalManager from 'app/components/Modal/ModalManager';

let component: any = null;
export default () => {
  const open = ModalManager.useWatcher(() => ModalManager.isOpen());

  const eventClose = useMemo(
    () => (evt: any) => {
      if (evt.keyCode == 27 && ModalManager.canClose()) {
        close();
      }
    },
    undefined,
  );

  const close = () => {
    if (ModalManager.canClose()) {
      ModalManager.close();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', eventClose);
    return () => {
      document.removeEventListener('keydown', eventClose);
    };
  }, []);

  component = ModalManager.getComponent() || component;

  return (
    <Modal
      onCancel={close}
      centered
      closable={false}
      title={null}
      visible={open}
      footer={null}
      destroyOnClose={true}
    >
      {component}
    </Modal>
  );
};
