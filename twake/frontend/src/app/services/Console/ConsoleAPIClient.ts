import Api from '../Api';
import { TwakeService } from '../Decorators/TwakeService';
import { JWTDataType } from '../JWTService';

type LoginParams = {
  email: string;
  password: string;
  remember_me: boolean;
};

@TwakeService('ConsoleAPIClientService')
class ConsoleAPIClient {

  login(params: LoginParams, disableJWTAuthentication = false): Promise<string> {
    return Api.post<LoginParams, { access_token: string }>(
      '/internal/services/console/v1/login',
      {...params, ...{device: {}}},
      undefined,
      false,
      { disableJWTAuthentication },
    )
    .then(res => res.access_token);
  }

  getNewAccessToken(): Promise<JWTDataType> {
    return new Promise<JWTDataType>((resolve, reject) => {
      Api.post<
        undefined,
        { access_token: JWTDataType, message: string; error: string; statusCode: number }
      >(
        '/internal/services/console/v1/token',
        undefined,
        response => response.access_token ? resolve(response.access_token) : reject(new Error('Can not get access token'))
      );
    });
  }
}

export default new ConsoleAPIClient();
