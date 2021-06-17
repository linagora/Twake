import Languages from 'services/languages/languages.js';
import Api from '../Api';
import DepreciatedCollections from '../Depreciated/Collections/Collections';
import InitService from '../InitService';
import { ToasterService as Toaster } from '../Toaster'

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
    return new Promise(async resolve => {
      const response = await Api.post(
        'users/console/api/verify_mail',
        {},
        (res: { data: { error: string; message: string; statusCode: number } }) => {
          if (res.data === null)
            return Toaster.success(
              Languages.t('services.console_services.toaster.success_verify_email'),
            );
          else return Toaster.error(res.data.message);
        },
      );

      return resolve(response);
    });
  }

  public addMailsInWorkspace(data: {
    workspace_id: string;
    company_id: string;
    emails: string[];
    role?: 'admin' | 'member' | 'guest';
  }) {
    return new Promise(async resolve => {
      const response = await Api.post('users/console/api/invite', data, (res: any) => {
        if (res) {
          if (res.error) return Toaster.error(res.error);
          else if (res.data?.nok?.length) {
            res.data.nok.map(({ email, message }: { email: string; message: string }) => {
              if (message !== 'User already belonged to the company') {
                // FIXME : do not compare the message
                Toaster.warning(`${email} - ${message}`);
              }
            });
          }

          if (res.data?.ok?.length) {
            Toaster.success(
              Languages.t('services.console_services.toaster.success_invite_emails', [
                res.data.ok.length,
              ]),
            );
          }
        }
      });
      return resolve(response);
    });
  }
}

export default new ConsoleService();
