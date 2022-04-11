import { Modal } from 'antd';

import Languages from 'app/features/global/services/languages-service';
import { TwakeService } from '../framework/registry-decorator-service';

const { confirm, info } = Modal;

type Options = {
  title?: string;
  text?: string;
};
@TwakeService('Alert')
class AlertServiceService {
  alert(onClose: () => void, options?: Options) {
    info({
      title: options?.title || options?.text || '',
      content: options?.text || '',
      onCancel: onClose,
    });
  }

  confirm(onConfirm: () => void, onClose: (() => void) | false = () => {}, options?: Options) {
    confirm({
      title: options?.title || Languages.t('components.alert.confirm'),
      content: options?.text || Languages.t('components.alert.confirm_click'),
      onOk: onConfirm,
      onCancel: onClose || undefined,
      cancelButtonProps: onClose ? {} : { style: { display: 'none' } },
    });
  }
}
const AlertManager = new AlertServiceService();

export default AlertManager;
