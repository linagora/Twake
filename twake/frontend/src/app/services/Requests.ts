import Logger from 'services/Logger';
import JWT from 'app/services/JWTService';

class Requests {
  private logger: Logger.Logger;

  constructor() {
    this.logger = Logger.getLogger('HTTPRequest');
  }

  request(
    method: 'post' | 'get' | 'put' | 'delete',
    route: string,
    data: string,
    callback: (result: string | any) => void,
    options: { disableJWTAuthentication?: boolean } = {},
  ) {
    this.logger.trace(`${method.toUpperCase()} ${route}`);

    if (options?.disableJWTAuthentication) {
      fetch(route, {
        credentials: 'same-origin',
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: JWT.getAutorizationHeader(),
        },
        body: method === 'post' ? data || '{}' : undefined,
      })
        .then(response => {
          response.text()
            .then(text => {
              this.retrieveJWTToken(text);
              callback(text);
            })
            .catch(err => {
              this.logger.trace('Can not get text from response');
              callback(JSON.stringify({ errors: [err] }));
            });
        })
        .catch(err => callback(JSON.stringify({ errors: [err] })));

      return;
    }

    JWT.authenticateCall(() => {
      options = options || {};
      options.disableJWTAuthentication = true;
      this.request(method, route, data, callback, options);
    });
  }

  private retrieveJWTToken(rawBody: string) {
    try {
      const body = JSON.parse(rawBody);
      if (body.access_token) {
        JWT.update(body.access_token);
      }
    } catch (err) {
      this.logger.debug(`Error while reading jwt tokens from: ${rawBody}`, err);
    }
  }
}

export default new Requests();
