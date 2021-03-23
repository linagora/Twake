import { message } from 'antd';
import Languages from 'services/languages/languages.js';
import Api from './Api';

class ConsoleService {
  public verifyMail() {
    const onVerification = new Promise(async resolve => {
      const response = await Api.post(
        'users/console/api/verify_mail',
        {},
        (res: { data: { error: string; message: string; statusCode: number } }) => {
          if (res.data === null)
            return message.success(Languages.t('services.console_services.toaster.success'));
          else return message.error(res.data.message);
        },
      );

      return resolve(response);
    });

    return onVerification;
  }

  public addMailsInWorkspace(data: { workspace_id: string; company_id: string; emails: string[] }) {
    const onVerification = new Promise(async resolve => {
      const response = await Api.post('users/console/api/invite', data, (res: any) => {
        if (res && res.error) return message.error(res.error);
        else return message.success('Success'); // TODO SUCCESS MESSAGE
      });
      return resolve(response);
    });

    return onVerification;
  }
}

export default new ConsoleService();
