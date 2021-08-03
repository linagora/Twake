import JWTStorage from 'services/JWTStorage';

class Requests {
  request(
    type: 'post' | 'get' | 'put' | 'delete',
    route: string,
    data: string,
    callback: (result: string | any) => void,
    options: { disableJWTAuthentication?: boolean } = {},
  ) {
    if (options?.disableJWTAuthentication) {
      fetch(route, {
        credentials: 'same-origin',
        method: type,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: JWTStorage.getAutorizationHeader(),
        },
        body: type === 'post' ? data || '{}' : undefined,
      })
        .then(response => {
          response.text().then(text => {
            this.retrieveJWTToken(text);
            if (callback) {
              callback(text);
            }
          });
        })
        .catch(err => {
          if (callback) {
            callback(JSON.stringify({ errors: [err] }));
          }
        });
      return;
    }
    JWTStorage.authenticateCall(() => {
      options = options || {};
      options.disableJWTAuthentication = true;
      this.request(type, route, data, callback, options);
    });
  }

  retrieveJWTToken(rawBody: string) {
    try {
      const body = JSON.parse(rawBody);
      if (body.access_token) {
        JWTStorage.updateJWT(body.access_token);
      }
    } catch (err) {
      console.error('Error while reading jwt tokens from: ' + rawBody, err);
    }
  }
}

const requests = new Requests();
export default requests;
