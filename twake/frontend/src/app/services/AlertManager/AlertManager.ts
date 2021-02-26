import { Modal } from 'antd';
import Languages from 'services/languages/languages';

const { confirm, info } = Modal;

class AlertService {
  alert(onClose: () => void, options: any = undefined) {
    info({
      title: options?.title || options?.text || '',
      content: options?.text || '',
      onCancel: onClose,
    });
  }
  confirm(
    onConfirm: () => void,
    onClose: (() => void) | undefined = undefined,
    options: any = undefined,
  ) {
    confirm({
      title: options?.title || Languages.t('components.alert.confirm'),
      content: options?.text || Languages.t('components.alert.confirm_click'),
      onOk: onConfirm,
      onCancel: onClose,
    });
  }
}

const alert_serv = new AlertService();
export default alert_serv;
