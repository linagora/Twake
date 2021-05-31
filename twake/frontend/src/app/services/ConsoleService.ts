import { message as toaster } from 'antd';
import Languages from 'services/languages/languages.js';
import Api from './Api';
import DepreciatedCollections from './Depreciated/Collections/Collections';
import InitService from './InitService';

class ConsoleService {
  public getCompanyManagementUrl(companyId: string) {
    const identity_provider_id =
      DepreciatedCollections.get('groups').find(companyId)?.identity_provider_id;
    return (
      InitService.server_infos?.configuration?.accounts?.console?.company_management_url || ''
    ).replace('{company_id}', identity_provider_id);
  }

  public getCompanyUsersManagementUrl(companyId: string) {
    const identity_provider_id =
      DepreciatedCollections.get('groups').find(companyId)?.identity_provider_id;
    return (
      InitService.server_infos?.configuration?.accounts?.console?.collaborators_management_url || ''
    ).replace('{company_id}', identity_provider_id);
  }

  public verifyMail() {
    const onVerification = new Promise(async resolve => {
      const response = await Api.post(
        'users/console/api/verify_mail',
        {},
        (res: { data: { error: string; message: string; statusCode: number } }) => {
          if (res.data === null)
            return toaster.success(
              Languages.t('services.console_services.toaster.success_verify_email'),
            );
          else return toaster.error(res.data.message);
        },
      );

      return resolve(response);
    });

    return onVerification;
  }

  public addMailsInWorkspace(data: {
    workspace_id: string;
    company_id: string;
    emails: string[];
    role?: 'admin' | 'member' | 'guest';
  }) {
    const onVerification = new Promise(async resolve => {
      const response = await Api.post('users/console/api/invite', data, (res: any) => {
        if (res) {
          if (res.error) return toaster.error(res.error);
          else if (res.data?.nok?.length) {
            res.data.nok.map(({ email, message }: { email: string; message: string }) => {
              if (message != 'User already belonged to the company') {
                // FIXME : do not compare the message
                toaster.warning(`${email} - ${message}`);
              }
            });
          }

          if (res.data?.ok?.length) {
            toaster.success(
              Languages.t('services.console_services.toaster.success_invite_emails', [
                res.data.ok.length,
              ]),
            );
          }
        }
      });
      return resolve(response);
    });

    return onVerification;
  }
}

export default new ConsoleService();
