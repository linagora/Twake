import Api from 'app/features/global/framework/api-service';
import { TwakeService } from 'app/features/global/framework/registry-decorator-service';
import { JWTDataType } from 'app/features/auth/jwt-storage-service';

type LoginParams = {
  email: string;
  password: string;
  remember_me: boolean;
};

type SignupParams = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  username: string;
};

@TwakeService('ConsoleAPIClientService')
class ConsoleAPIClient {
  login(params: LoginParams, disableJWTAuthentication = false): Promise<string> {
    return Api.post<LoginParams, { access_token: string }>(
      '/internal/services/console/v1/login',
      { ...params, ...{ device: {} } },
      undefined,
      false,
      { disableJWTAuthentication },
    ).then(res => res.access_token);
  }

  async signup(params: SignupParams) {
    const res = await Api.post<SignupParams, { error?: string }>(
      '/internal/services/console/v1/signup',
      params,
    );
    if (res.error) {
      throw new Error(res.error);
    }
    return res;
  }

  getNewAccessToken(): Promise<JWTDataType> {
    return new Promise<JWTDataType>((resolve, reject) => {
      Api.post<
        undefined,
        { access_token: JWTDataType; message: string; error: string; statusCode: number }
      >('/internal/services/console/v1/token', undefined, response =>
        response.access_token
          ? resolve(response.access_token)
          : reject(new Error('Can not get access token')),
      );
    });
  }
}

export default new ConsoleAPIClient();
