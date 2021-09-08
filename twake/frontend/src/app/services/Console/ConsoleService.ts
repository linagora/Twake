import Api from '../Api';
import DepreciatedCollections from '../Depreciated/Collections/Collections';
import InitService from '../InitService';
import Languages from 'services/languages/languages';
import { ToasterService as Toaster } from '../Toaster';
import { ConsoleMemberRole } from './types';

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
        '/internal/services/console/v1/resend-verification-email',
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
    role?: ConsoleMemberRole;
  }) {
    return new Promise(async resolve => {
      const response = await Api.post(
        `/internal/services/workspaces/v1/companies/${data.company_id}/workspaces/${data.workspace_id}/users/invite`,
        {
          invitations: [
            ...data.emails.map(email => ({
              email,
              role: 'member',
              company_role: 'member',
            })),
          ],
        },
        (res: any) => console.log(res),
      );
      return resolve(response);
    });
  }
}

export default new ConsoleService();
