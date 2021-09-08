import Api from '../Api';
import DepreciatedCollections from '../Depreciated/Collections/Collections';
import InitService from '../InitService';
import Languages from 'services/languages/languages';
import { ToasterService as Toaster } from '../Toaster';
import { ConsoleMemberRole } from './types';
import logger from 'app/services/Logger';

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

  public async addMailsInWorkspace(data: {
    workspace_id: string;
    company_id: string;
    emails: string[];
    role?: ConsoleMemberRole;
  }) {
    const res: any = await Api.post(
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
    );

    if (!res?.resources || !res.resources.length) {
      logger.error('Error while adding emails');
      return Toaster.error(Languages.t('services.console_services.toaster.add_emails_error'));
    }

    if (res.resources.filter((r: any) => r.status === 'error').length > 0) {
      res.resources
        .filter((r: any) => r.status === 'error')
        .forEach(({ email, message }: { email: string; message: string }) => {
          // possible error messages are
          // 1. "User already belonged to the company" (Good typo in it...)
          // 2. "Unable to invite user ${user.email} to company ${company.code}"
          logger.error('Error while adding email', email, message);

          Toaster.warning(
            Languages.t('services.console_services.toaster.add_email_error_message', [
              email + ` (${message})`,
            ]),
          );
        });
    }

    if (res.resources.filter((r: any) => r.status !== 'error').length > 0) {
      Toaster.success(
        Languages.t('services.console_services.toaster.success_invite_emails', [
          res.resources.filter((r: any) => r.status !== 'error').length,
        ]),
      );
    }

    return res;
  }
}

export default new ConsoleService();
