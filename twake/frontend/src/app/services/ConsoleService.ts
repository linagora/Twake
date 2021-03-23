import { message as toaster } from 'antd';
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
            return toaster.success(Languages.t('services.console_services.toaster.success'));
          else return toaster.error(res.data.message);
        },
      );

      return resolve(response);
    });

    return onVerification;
  }

  public addMailsInWorkspace(data: { workspace_id: string; company_id: string; emails: string[] }) {
    const onVerification = new Promise(async resolve => {
      const response = await Api.post('users/console/api/invite', data, (res: any) => {
        if (res) {
          if (res.error) return toaster.error(res.error);
          else if (res.data?.nok?.length) {
            res.data.nok.map(({ email, message }: { email: string; message: string }) =>
              toaster.warning(`${email} - ${message}`),
            );
          }

          if (res.data?.ok?.length) {
            toaster.success(`Successfully added ${res.data.ok.length} email(s)`);
          }
        }
      });
      return resolve(response);
    });

    return onVerification;
  }
}

export default new ConsoleService();
