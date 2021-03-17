import Api from './Api';

class ConsoleService {
  public verifyMail() {
    return Api.post('users/console/api/verify_mail', {});
  }
}

export default new ConsoleService();
