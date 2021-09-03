import Api from '../Api';
import DepreciatedCollections from '../Depreciated/Collections/Collections';
import InitService from '../InitService';
import Languages from 'services/languages/languages';
import logger from 'app/services/Logger';
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
      const response = await Api.post('/ajax/users/console/api/invite', data, (res: any) => {
        if (res) {
          if (res.error) {
            logger.error('Error while adding emails', res.error);
            return Toaster.error(
              Languages.t(
                'services.console_services.toaster.add_emails_error',
                [],
                'Error while adding email(s)',
              ),
            );
          } else if (res.data?.nok?.length) {
            res.data.nok.forEach(({ email, message }: { email: string; message: string }) => {
              // possible error messages are
              // 1. "User already belonged to the company" (Good typo in it...)
              // 2. "Unable to invite user ${user.email} to company ${company.code}"
              // TODO: do not compare the message but use error code...
              logger.error('Error while adding email', email, message);

              if (message.match(/Unable to invite user/)) {
                Toaster.warning(
                  Languages.t(
                    'services.console_services.toaster.add_email_error_message',
                    [email],
                    `Error while adding ${email}`,
                  ),
                );
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
