import Api from './Api';

class ConsoleService {
  public verifyMail() {
    return Api.post('users/console/api/verify_mail', {});
  }

  public addMailsInWorkspace(data: { workspace_id: string; company_id: string; emails: string[] }) {
    return Api.post('users/console/api/invite', data);
  }
}

export default new ConsoleService();
