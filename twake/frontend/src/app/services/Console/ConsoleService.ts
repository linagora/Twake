import Api from '../Api';
import DepreciatedCollections from '../Depreciated/Collections/Collections';
import InitService from '../InitService';
import Languages from 'services/languages/languages';
import { ToasterService as Toaster } from '../Toaster';
import { ConsoleMemberRole } from './types';
import { JWTDataType } from '../JWTService';
import Logger from 'app/services/Logger';

class ConsoleService {
  private logger: Logger.Logger;

  constructor() {
    this.logger = Logger.getLogger('Console');
  }

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
    role?: ConsoleMemberRole;
  }) {
    return new Promise(async resolve => {
      const response = await Api.post('users/console/api/invite', data, (res: any) => {
        if (res) {
          if (res.error) {
            this.logger.error('Error while adding emails', res.error);
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
              this.logger.error('Error while adding email', email, message);

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

  public getNewAccessToken(currentToken: { access_token: string }, callback: (err?: Error, access_token?: JWTDataType) => void): void {
    Api.post('users/console/token',
      { access_token: currentToken.access_token },
      (response: { access_token: JWTDataType }) => {
        // the input access_token is potentially expired and so the response contains an error.
        // we should be able to refresh the token or renew it in some way...
        if (!response.access_token) {
          this.logger.error('getNewAccessToken, Can not retrieve access_token from console. Response was', response);
          callback(new Error('Can not retrieve access_token from console'));
          return;
        }

        callback(undefined, response.access_token);
      }
    );
  }
}

export default new ConsoleService();
