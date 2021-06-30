<?php
namespace Twake\Users\Controller\Adapters\OpenID;

use \Firebase\JWT\JWT;

/**
 *
 * JWT signature verification support by Jonathan Reed <jdreed@mit.edu>
 * Edited by Romaric Mourgues to make it stateless and compatible with LemonLDAP
 * Licensed under the same license as the rest of this file.
 *
 * phpseclib is required to validate the signatures of some tokens.
 * It can be downloaded from: http://phpseclib.sourceforge.net/
 */

if (!class_exists('\phpseclib\Crypt\RSA') && !class_exists('Crypt_RSA')) {
    user_error('Unable to find phpseclib Crypt/RSA.php.  Ensure phpseclib is installed and in include_path before you include this file');
}

/**
 * A wrapper around base64_decode which decodes Base64URL-encoded data,
 * which is not the same alphabet as base64.
 * @param string $base64url
 * @return bool|string
 */
function base64url_decode($base64url) {
    return base64_decode(b64url2b64($base64url));
}

/**
 * Per RFC4648, "base64 encoding with URL-safe and filename-safe
 * alphabet".  This just replaces characters 62 and 63.  None of the
 * reference implementations seem to restore the padding if necessary,
 * but we'll do it anyway.
 * @param string $base64url
 * @return string
 */
function b64url2b64($base64url) {
    // "Shouldn't" be necessary, but why not
    $padding = strlen($base64url) % 4;
    if ($padding > 0) {
        $base64url .= str_repeat('=', 4 - $padding);
    }
    return strtr($base64url, '-_', '+/');
}


/**
 * OpenIDConnect Exception Class
 */
class OpenIDConnectClientException extends \Exception
{

}

/**
 * Require the CURL and JSON PHP extensions to be installed
 */
if (!function_exists('curl_init')) {
    throw new OpenIDConnectClientException('OpenIDConnect needs the CURL PHP extension.');
}
if (!function_exists('json_decode')) {
    throw new OpenIDConnectClientException('OpenIDConnect needs the JSON PHP extension.');
}

/**
 *
 * Please note this class stores nonces by default in $_SESSION['openid_connect_nonce']
 *
 */
class OpenIDConnectClient
{

    /**
     * @var string arbitrary id value
     */
    private $clientID;

    /**
     * @var string arbitrary name value
     */
    private $clientName;

    /**
     * @var string arbitrary secret value
     */
    private $clientSecret;

    /**
     * @var array holds the provider configuration
     */
    private $providerConfig = array();

    /**
     * @var string http proxy if necessary
     */
    private $httpProxy;

    /**
     * @var string full system path to the SSL certificate
     */
    private $certPath;

    /**
     * @var bool Verify SSL peer on transactions
     */
    private $verifyPeer = true;

    /**
     * @var bool Verify peer hostname on transactions
     */
    private $verifyHost = true;

    /**
     * @var string if we acquire an access token it will be stored here
     */
    protected $accessToken;

    /**
     * @var string if we acquire a refresh token it will be stored here
     */
    private $refreshToken;

    /**
     * @var string if we acquire an id token it will be stored here
     */
    protected $idToken;

    /**
     * @var string stores the token response
     */
    private $tokenResponse;

    /**
     * @var array holds scopes
     */
    private $scopes = array();

    /**
     * @var int|null Response code from the server
     */
    private $responseCode;

    /**
     * @var array holds response types
     */
    private $responseTypes = array();

    /**
     * @var array holds a cache of info returned from the user info endpoint
     */
    private $userInfo = array();

    /**
     * @var array holds authentication parameters
     */
    private $authParams = array();

    /**
     * @var array holds additional registration parameters for example post_logout_redirect_uris
     */
    private $registrationParams = array();

    /**
     * @var mixed holds well-known openid server properties
     */
    private $wellKnown = false;

    /**
     * @var mixed holds well-known opendid configuration parameters, like policy for MS Azure AD B2C User Flow  
     * @see https://docs.microsoft.com/en-us/azure/active-directory-b2c/user-flow-overview 
     */
    private $wellKnownConfigParameters = array();

    /**
     * @var int timeout (seconds)
     */
    protected $timeOut = 60;

    /**
     * @var int leeway (seconds)
     */
    private $leeway = 300;

    /**
     * @var array holds response types
     */
    private $additionalJwks = array();

    /**
     * @var array holds verified jwt claims
     */
    protected $verifiedClaims = array();

    /**
     * @var callable validator function for issuer claim
     */
    private $issuerValidator;

    /**
     * @var bool Allow OAuth 2 implicit flow; see http://openid.net/specs/openid-connect-core-1_0.html#ImplicitFlowAuth
     */
    private $allowImplicitFlow = false;
    /**
     * @var string
     */
    private $redirectURL;

    protected $enc_type = PHP_QUERY_RFC1738;

    /**
     * @var string holds code challenge method for PKCE mode
     * @see https://tools.ietf.org/html/rfc7636
     */
    private $codeChallengeMethod = false;

    /**
     * @var array holds PKCE supported algorithms
     */
    private $pkceAlgs = array('S256' => 'sha256', 'plain' => false);

    /**
     * Server key, used to generate stateless OIDC state
     */
    private $serverKey = "";

    public function setServerKey($key){
        $this->serverKey = $key;
    }

    private function getServerKey(){
        return $this->serverKey;
    }

    /**
     * @param $provider_url string optional
     *
     * @param $client_id string optional
     * @param $client_secret string optional
     * @param null $issuer
     */
    public function __construct($provider_url = null, $client_id = null, $client_secret = null, $issuer = null) {
        $this->setProviderURL($provider_url);
        if ($issuer === null) {
            $this->setIssuer($provider_url);
        } else {
            $this->setIssuer($issuer);
        }

        $this->clientID = $client_id;
        $this->clientSecret = $client_secret;

        $this->issuerValidator = function($iss){
	        return ($iss === $this->getIssuer() || $iss === $this->getWellKnownIssuer() || $iss === $this->getWellKnownIssuer(true));
        };
    }

    /**
     * @param $provider_url
     */
    public function setProviderURL($provider_url) {
        $this->providerConfig['providerUrl'] = $provider_url;
    }

    /**
     * @param $issuer
     */
    public function setIssuer($issuer) {
        $this->providerConfig['issuer'] = $issuer;
    }

    /**
     * @param $response_types
     */
    public function setResponseTypes($response_types) {
        $this->responseTypes = array_merge($this->responseTypes, (array)$response_types);
    }

    /**
     * @return bool
     * @throws OpenIDConnectClientException
     */
    public function authenticate($options = []) {

        // Do a preemptive check to see if the provider has thrown an error from a previous redirect
        if (isset($_REQUEST['error'])) {
            $desc = isset($_REQUEST['error_description']) ? ' Description: ' . $_REQUEST['error_description'] : '';
            throw new OpenIDConnectClientException('Error: ' . $_REQUEST['error'] .$desc);
        }

        // If we have an authorization code then proceed to request a token
        if (isset($_REQUEST['code'])) {

            $code = $_REQUEST['code'];
            $token_json = $this->requestTokens($code);

            // Throw an error if the server returns one
            if (isset($token_json->error)) {
                if (isset($token_json->error_description)) {
                    throw new OpenIDConnectClientException($token_json->error_description);
                }
                throw new OpenIDConnectClientException('Got response: ' . $token_json->error);
            }

            // Do an OpenID Connect session check
            if (!$this->checkState($_REQUEST['state']) && !$options["ignore_state"]) {
                throw new OpenIDConnectClientException('Unable to determine state');
            }

            if (!property_exists($token_json, 'id_token')) {
                throw new OpenIDConnectClientException('User did not authorize openid scope.');
            }

            $claims = $this->decodeJWT($token_json->id_token, 1);

            // Verify the signature
            if ($this->canVerifySignatures()) {
                if (!$this->getProviderConfigValue('jwks_uri')) {
                    throw new OpenIDConnectClientException ('Unable to verify signature due to no jwks_uri being defined');
                }
                if (!$this->verifyJWTsignature($token_json->id_token)) {
                    throw new OpenIDConnectClientException ('Unable to verify signature');
                }
            } else {
                user_error('Warning: JWT signature verification unavailable.');
            }

            // Save the id token
            $this->idToken = $token_json->id_token;

            // Save the access token
            $this->accessToken = $token_json->access_token;

            // If this is a valid claim
            if ($this->verifyJWTclaims($claims, $token_json->access_token, $options)) {

                // Clean up the session a little
                $this->unsetNonce();

                // Save the full response
                $this->tokenResponse = $token_json;

                // Save the verified claims
                $this->verifiedClaims = $claims;

                // Save the refresh token, if we got one
                if (isset($token_json->refresh_token)) {
                    $this->refreshToken = $token_json->refresh_token;
                }

                // Success!
                return true;

            }

            throw new OpenIDConnectClientException ('Unable to verify JWT claims');
        }

        if ($this->allowImplicitFlow && isset($_REQUEST['id_token'])) {
            // if we have no code but an id_token use that
            $id_token = $_REQUEST['id_token'];

            $accessToken = null;
            if (isset($_REQUEST['access_token'])) {
                $accessToken = $_REQUEST['access_token'];
            }

            // Do an OpenID Connect session check
            if ($_REQUEST['state'] !== $this->checkState($_REQUEST['state'])) {
                throw new OpenIDConnectClientException('Unable to determine state');
            }

            $claims = $this->decodeJWT($id_token, 1);

            // Verify the signature
            if ($this->canVerifySignatures()) {
                if (!$this->getProviderConfigValue('jwks_uri')) {
                    throw new OpenIDConnectClientException ('Unable to verify signature due to no jwks_uri being defined');
                }
                if (!$this->verifyJWTsignature($id_token)) {
                    throw new OpenIDConnectClientException ('Unable to verify signature');
                }
            } else {
                user_error('Warning: JWT signature verification unavailable.');
            }

            // Save the id token
            $this->idToken = $id_token;

            // If this is a valid claim
            if ($this->verifyJWTclaims($claims, $accessToken, $options)) {

                // Clean up the session a little
                $this->unsetNonce();

                // Save the verified claims
                $this->verifiedClaims = $claims;

                // Save the access token
                if ($accessToken) {
                    $this->accessToken = $accessToken;
                }

                // Success!
                return true;

            }

            throw new OpenIDConnectClientException ('Unable to verify JWT claims');
        }

        $this->requestAuthorization();
        return false;

    }

    /**
     * It calls the end-session endpoint of the OpenID Connect provider to notify the OpenID
     * Connect provider that the end-user has logged out of the relying party site
     * (the client application).
     *
     * @param string $accessToken ID token (obtained at login)
     * @param string|null $redirect URL to which the RP is requesting that the End-User's User Agent
     * be redirected after a logout has been performed. The value MUST have been previously
     * registered with the OP. Value can be null.
     *
     * @throws OpenIDConnectClientException
     */
    public function signOut($accessToken, $redirect) {
        $signout_endpoint = $this->getProviderConfigValue('end_session_endpoint');

        $signout_params = null;
        if($redirect === null){
            $signout_params = array('id_token_hint' => $accessToken);
        }
        else {
            $signout_params = array(
                'id_token_hint' => $accessToken,
                'post_logout_redirect_uri' => $redirect);
        }

        $signout_endpoint  .= (strpos($signout_endpoint, '?') === false ? '?' : '&') . http_build_query( $signout_params, null, '&', $this->enc_type);
        error_log("redirect user to (signout): ".$signout_endpoint);

        $this->redirect($signout_endpoint);
    }

    /**
     * @param array $scope - example: openid, given_name, etc...
     */
    public function addScope($scope) {
        $this->scopes = array_merge($this->scopes, (array)$scope);
    }

    /**
     * @param array $param - example: prompt=login
     */
    public function addAuthParam($param) {
        $this->authParams = array_merge($this->authParams, (array)$param);
    }

    /**
     * @param array $param - example: post_logout_redirect_uris=[http://example.com/successful-logout]
     */
    public function addRegistrationParam($param) {
        $this->registrationParams = array_merge($this->registrationParams, (array)$param);
    }

    /**
     * @param $jwk object - example: (object) array('kid' => ..., 'nbf' => ..., 'use' => 'sig', 'kty' => "RSA", 'e' => "", 'n' => "")
     */
    protected function addAdditionalJwk($jwk) {
        $this->additionalJwks[] = $jwk;
    }

    /**
     * Get's anything that we need configuration wise including endpoints, and other values
     *
     * @param string $param
     * @param string $default optional
     * @throws OpenIDConnectClientException
     * @return string
     *
     */
    protected function getProviderConfigValue($param, $default = null) {

        // If the configuration value is not available, attempt to fetch it from a well known config endpoint
        // This is also known as auto "discovery"
        if (!isset($this->providerConfig[$param])) {
            $this->providerConfig[$param] = $this->getWellKnownConfigValue($param, $default);
        }

        return $this->providerConfig[$param];
    }

    /**
     * Get's anything that we need configuration wise including endpoints, and other values
     *
     * @param string $param
     * @param string $default optional
     * @throws OpenIDConnectClientException
     * @return string
     *
     */
    private function getWellKnownConfigValue($param, $default = null) {

        // If the configuration value is not available, attempt to fetch it from a well known config endpoint
        // This is also known as auto "discovery"
        if(!$this->wellKnown) {
            $well_known_config_url = rtrim($this->getProviderURL(), '/') . '/.well-known/openid-configuration';
            if (count($this->wellKnownConfigParameters) > 0){
                $well_known_config_url .= '?' .  http_build_query($this->wellKnownConfigParameters) ;
            }
            $this->wellKnown = json_decode($this->fetchURL($well_known_config_url));
        }

        $value = false;
        if(isset($this->wellKnown->{$param})){
            $value = $this->wellKnown->{$param};
        }

        if ($value) {
            return $value;
        }

        if (isset($default)) {
            // Uses default value if provided
            return $default;
        }

        throw new OpenIDConnectClientException("The provider {$param} could not be fetched. Make sure your provider has a well known configuration available.");
    }

    /**
     * Set optionnal parameters for .well-known/openid-configuration 
     *
     * @param string $param
     *
     */
    public function setWellKnownConfigParameters(array $params = []){
        $this->wellKnownConfigParameters=$params;
    }


    /**
     * @param string $url Sets redirect URL for auth flow
     */
    public function setRedirectURL ($url) {
        if (parse_url($url,PHP_URL_HOST) !== false) {
            $this->redirectURL = $url;
        }
    }

    /**
     * Gets the URL of the current page we are on, encodes, and returns it
     *
     * @return string
     */
    public function getRedirectURL() {

        // If the redirect URL has been set then return it.
        if (property_exists($this, 'redirectURL') && $this->redirectURL) {
            return $this->redirectURL;
        }

        // Other-wise return the URL of the current page

        /**
         * Thank you
         * http://stackoverflow.com/questions/189113/how-do-i-get-current-page-full-url-in-php-on-a-windows-iis-server
         */

        /*
         * Compatibility with multiple host headers.
         * The problem with SSL over port 80 is resolved and non-SSL over port 443.
         * Support of 'ProxyReverse' configurations.
         */

        if (isset($_SERVER['HTTP_UPGRADE_INSECURE_REQUESTS']) && ($_SERVER['HTTP_UPGRADE_INSECURE_REQUESTS'] === '1')) {
            $protocol = 'https';
        } else {
            $protocol = @$_SERVER['HTTP_X_FORWARDED_PROTO']
                ?: @$_SERVER['REQUEST_SCHEME']
                    ?: ((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http');
        }

        $port = @intval($_SERVER['HTTP_X_FORWARDED_PORT'])
            ?: @intval($_SERVER['SERVER_PORT'])
                ?: (($protocol === 'https') ? 443 : 80);

        $host = @explode(':', $_SERVER['HTTP_HOST'])[0]
            ?: @$_SERVER['SERVER_NAME']
                ?: @$_SERVER['SERVER_ADDR'];

        $port = (443 === $port) || (80 === $port) ? '' : ':' . $port;

        return sprintf('%s://%s%s/%s', $protocol, $host, $port, @trim(reset(explode('?', $_SERVER['REQUEST_URI'])), '/'));
    }

    /**
     * Used for arbitrary value generation for nonces and state
     *
     * @return string
     * @throws OpenIDConnectClientException
     */
    protected function generateRandString() {
        // Error and Exception need to be catched in this order, see https://github.com/paragonie/random_compat/blob/master/README.md
        // random_compat polyfill library should be removed if support for PHP versions < 7 is dropped
        try {
            $a = \bin2hex(\random_bytes(16));
            error_log("random string: ".$a);
            return $a;
        } catch (Error $e) {
            throw new OpenIDConnectClientException('Random token generation failed.');
        } catch (\Exception $e) {
            throw new OpenIDConnectClientException('Random token generation failed.');
        };
    }

    /**
     * Start Here
     * @return void
     * @throws OpenIDConnectClientException
     */
    private function requestAuthorization() {

        $auth_endpoint = $this->getProviderConfigValue('authorization_endpoint');
        $response_type = 'code';

        // Generate and store a nonce in the session
        // The nonce is an arbitrary value
        $nonce = $this->setNonce($this->generateRandString());

        // State essentially acts as a session key for OIDC
        $state = $this->genState();

        $auth_params = array_merge($this->authParams, array(
            'response_type' => $response_type,
            'redirect_uri' => $this->getRedirectURL(),
            'client_id' => $this->clientID,
            'nonce' => $nonce,
            'state' => $state,
            'scope' => 'openid'
        ));

        // If the client has been registered with additional scopes
        if (count($this->scopes) > 0) {
            $auth_params = array_merge($auth_params, array('scope' => implode(' ', array_merge($this->scopes, array('openid')))));
        }

        // If the client has been registered with additional response types
        if (count($this->responseTypes) > 0) {
            $auth_params = array_merge($auth_params, array('response_type' => implode(' ', $this->responseTypes)));
        }

        // If the client supports Proof Key for Code Exchange (PKCE)
        if (!empty($this->getCodeChallengeMethod()) && in_array($this->getCodeChallengeMethod(), $this->getProviderConfigValue('code_challenge_methods_supported'))) {
            $codeVerifier = bin2hex(random_bytes(64));
            $this->setCodeVerifier($codeVerifier);
            if (!empty($this->pkceAlgs[$this->getCodeChallengeMethod()])) {
                $codeChallenge = rtrim(strtr(base64_encode(hash($this->pkceAlgs[$this->getCodeChallengeMethod()], $codeVerifier, true)), '+/', '-_'), '=');
            } else {
                $codeChallenge = $codeVerifier;
            }
            $auth_params = array_merge($auth_params, array(
                'code_challenge' => $codeChallenge,
                'code_challenge_method' => $this->getCodeChallengeMethod()
            ));
        }

        $auth_endpoint .= (strpos($auth_endpoint, '?') === false ? '?' : '&') . http_build_query($auth_params, null, '&', $this->enc_type);
        error_log("redirect user to: ".$auth_endpoint);

        $this->commitSession();
        $this->redirect($auth_endpoint);
    }

    /**
     * Requests a client credentials token
     *
     * @throws OpenIDConnectClientException
     */
    public function requestClientCredentialsToken() {
        $token_endpoint = $this->getProviderConfigValue('token_endpoint');

        $headers = [];

        $grant_type = 'client_credentials';

        $post_data = array(
            'grant_type'    => $grant_type,
            'client_id'     => $this->clientID,
            'client_secret' => $this->clientSecret,
            'scope'         => implode(' ', $this->scopes)
        );

        // Convert token params to string format
        $post_params = http_build_query($post_data, null, '&', $this->enc_type);

        return json_decode($this->fetchURL($token_endpoint, $post_params, $headers));
    }


    /**
     * Requests a resource owner token
     * (Defined in https://tools.ietf.org/html/rfc6749#section-4.3)
     *
     * @param boolean $bClientAuth Indicates that the Client ID and Secret be used for client authentication
     * @return mixed
     * @throws OpenIDConnectClientException
     */
    public function requestResourceOwnerToken($bClientAuth =  FALSE) {
        $token_endpoint = $this->getProviderConfigValue('token_endpoint');

        $headers = [];

        $grant_type = 'password';

        $post_data = array(
            'grant_type'    => $grant_type,
            'username'      => $this->authParams['username'],
            'password'      => $this->authParams['password'],
            'scope'         => implode(' ', $this->scopes)
        );

        //For client authentication include the client values
        if($bClientAuth) {
            $post_data['client_id']     = $this->clientID;
            $post_data['client_secret'] = $this->clientSecret;
        }

        // Convert token params to string format
        $post_params = http_build_query($post_data, null, '&', $this->enc_type);

        return json_decode($this->fetchURL($token_endpoint, $post_params, $headers));
    }


    /**
     * Requests ID and Access tokens
     *
     * @param string $code
     * @return mixed
     * @throws OpenIDConnectClientException
     */
    protected function requestTokens($code) {
        $token_endpoint = $this->getProviderConfigValue('token_endpoint');
        $token_endpoint_auth_methods_supported = $this->getProviderConfigValue('token_endpoint_auth_methods_supported', ['client_secret_basic']);

        $headers = [];

        $grant_type = 'authorization_code';

        $token_params = array(
            'grant_type' => $grant_type,
            'code' => $code,
            'redirect_uri' => $this->getRedirectURL(),
            'client_id' => $this->clientID,
            'client_secret' => $this->clientSecret
        );

        # Consider Basic authentication if provider config is set this way
        if (in_array('client_secret_basic', $token_endpoint_auth_methods_supported, true)) {
            $headers = ['Authorization: Basic ' . base64_encode(urlencode($this->clientID) . ':' . urlencode($this->clientSecret))];
            unset($token_params['client_secret']);
	        unset($token_params['client_id']);
        }

        if (!empty($this->getCodeChallengeMethod()) && !empty($this->getCodeVerifier())) {
            $headers = [];
            unset($token_params['client_secret']);
            $token_params = array_merge($token_params, array(
                'client_id' => $this->clientID,
                'code_verifier' => $this->getCodeVerifier()
            ));
        }

        // Convert token params to string format
        $token_params = http_build_query($token_params, null, '&', $this->enc_type);

        $this->tokenResponse = json_decode($this->fetchURL($token_endpoint, $token_params, $headers));

        return $this->tokenResponse;
    }

    /**
     * Requests Access token with refresh token
     *
     * @param string $refresh_token
     * @return mixed
     * @throws OpenIDConnectClientException
     */
    public function refreshToken($refresh_token) {
        $token_endpoint = $this->getProviderConfigValue('token_endpoint');

        $grant_type = 'refresh_token';

        $token_params = array(
            'grant_type' => $grant_type,
            'refresh_token' => $refresh_token,
            'client_id' => $this->clientID,
            'client_secret' => $this->clientSecret,
        );

        // Convert token params to string format
        $token_params = http_build_query($token_params, null, '&', $this->enc_type);

        $json = json_decode($this->fetchURL($token_endpoint, $token_params));

        if (isset($json->access_token)) {
            $this->accessToken = $json->access_token;
        }

        if (isset($json->refresh_token)) {
            $this->refreshToken = $json->refresh_token;
        }

        return $json;
    }

    /**
     * @param array $keys
     * @param array $header
     * @throws OpenIDConnectClientException
     * @return object
     */
    private function get_key_for_header($keys, $header) {
        foreach ($keys as $key) {
            if ($key->kty === 'RSA') {
                if (!isset($header->kid) || $key->kid === $header->kid) {
                    return $key;
                }
            } else {
                if (isset($key->alg) && $key->alg === $header->alg && $key->kid === $header->kid) {
                    return $key;
                }
            }
        }
        if ($this->additionalJwks) {
            foreach ($this->additionalJwks as $key) {
                if ($key->kty === 'RSA') {
                    if (!isset($header->kid) || $key->kid === $header->kid) {
                        return $key;
                    }
                } else {
                    if (isset($key->alg) && $key->alg === $header->alg && $key->kid === $header->kid) {
                        return $key;
                    }
                }
            }
        }
        if (isset($header->kid)) {
            throw new OpenIDConnectClientException('Unable to find a key for (algorithm, kid):' . $header->alg . ', ' . $header->kid . ')');
        }

        throw new OpenIDConnectClientException('Unable to find a key for RSA');
    }


    /**
     * @param string $hashtype
     * @param object $key
     * @param $payload
     * @param $signature
     * @param $signatureType
     * @return bool
     * @throws OpenIDConnectClientException
     */
    private function verifyRSAJWTsignature($hashtype, $key, $payload, $signature, $signatureType) {
        if (!class_exists('\phpseclib\Crypt\RSA') && !class_exists('Crypt_RSA')) {
            throw new OpenIDConnectClientException('Crypt_RSA support unavailable.');
        }
        if (!(property_exists($key, 'n') && property_exists($key, 'e'))) {
            throw new OpenIDConnectClientException('Malformed key object');
        }

        /* We already have base64url-encoded data, so re-encode it as
           regular base64 and use the XML key format for simplicity.
        */
        $public_key_xml = "<RSAKeyValue>\r\n".
            '  <Modulus>' . b64url2b64($key->n) . "</Modulus>\r\n" .
            '  <Exponent>' . b64url2b64($key->e) . "</Exponent>\r\n" .
            '</RSAKeyValue>';
        if(class_exists('Crypt_RSA', false)) {
            $rsa = new Crypt_RSA();
            $rsa->setHash($hashtype);
            if ($signatureType === 'PSS') {
                $rsa->setMGFHash($hashtype);
            }
            $rsa->loadKey($public_key_xml, Crypt_RSA::PUBLIC_FORMAT_XML);
            $rsa->signatureMode = $signatureType === 'PSS' ? Crypt_RSA::SIGNATURE_PSS : Crypt_RSA::SIGNATURE_PKCS1;
        } else {
            $rsa = new \phpseclib\Crypt\RSA();
            $rsa->setHash($hashtype);
            if ($signatureType === 'PSS') {
                $rsa->setMGFHash($hashtype);
            }
            $rsa->loadKey($public_key_xml, \phpseclib\Crypt\RSA::PUBLIC_FORMAT_XML);
            $rsa->signatureMode = $signatureType === 'PSS' ? \phpseclib\Crypt\RSA::SIGNATURE_PSS : \phpseclib\Crypt\RSA::SIGNATURE_PKCS1;
        }
        return $rsa->verify($payload, $signature);
    }

    /**
     * @param string $hashtype
     * @param object $key
     * @param $payload
     * @param $signature
     * @return bool
     * @throws OpenIDConnectClientException
     */
    private function verifyHMACJWTsignature($hashtype, $key, $payload, $signature)
    {
        if (!function_exists('hash_hmac')) {
            throw new OpenIDConnectClientException('hash_hmac support unavailable.');
        }

        $expected=hash_hmac($hashtype, $payload, $key, true);

        if (function_exists('hash_equals')) {
            return hash_equals($signature, $expected);
        }

        return self::hashEquals($signature, $expected);
    }

    /**
     * @param string $jwt encoded JWT
     * @throws OpenIDConnectClientException
     * @return bool
     */
    public function verifyJWTsignature($jwt) {
        if (!\is_string($jwt)) {
            throw new OpenIDConnectClientException('Error token is not a string');
        }
        $parts = explode('.', $jwt);
        if (!isset($parts[0])) {
            throw new OpenIDConnectClientException('Error missing part 0 in token');
        }
        $signature = base64url_decode(array_pop($parts));
        if (false === $signature || '' === $signature) {
            throw new OpenIDConnectClientException('Error decoding signature from token');
        }
        $header = json_decode(base64url_decode($parts[0]));
        if (null === $header || !\is_object($header)) {
            throw new OpenIDConnectClientException('Error decoding JSON from token header');
        }
        $payload = implode('.', $parts);
        $jwks = json_decode($this->fetchURL($this->getProviderConfigValue('jwks_uri')));
        if ($jwks === NULL) {
            throw new OpenIDConnectClientException('Error decoding JSON from jwks_uri');
        }
        if (!isset($header->alg)) {
            throw new OpenIDConnectClientException('Error missing signature type in token header');
        }
        switch ($header->alg) {
            case 'RS256':
            case 'PS256':
            case 'RS384':
            case 'RS512':
                $hashtype = 'sha' . substr($header->alg, 2);
                $signatureType = $header->alg === 'PS256' ? 'PSS' : '';

                $verified = $this->verifyRSAJWTsignature($hashtype,
                    $this->get_key_for_header($jwks->keys, $header),
                    $payload, $signature, $signatureType);
                break;
            case 'HS256':
            case 'HS512':
            case 'HS384':
                $hashtype = 'SHA' . substr($header->alg, 2);
                $verified = $this->verifyHMACJWTsignature($hashtype, $this->getClientSecret(), $payload, $signature);
                break;
            case 'none':
                $verified = true;
                break;
            default:
                throw new OpenIDConnectClientException('No support for signature type: ' . $header->alg);
        }
        return $verified;
    }

    /**
     * @param object $claims
     * @param string|null $accessToken
     * @return bool
     */
    protected function verifyJWTclaims($claims, $accessToken = null, $options = []) {
        if(isset($claims->at_hash) && isset($accessToken)){
            if(isset($this->getIdTokenHeader()->alg) && $this->getIdTokenHeader()->alg !== 'none'){
                $bit = substr($this->getIdTokenHeader()->alg, 2, 3);
            }else{
                // TODO: Error case. throw exception???
                $bit = '256';
            }
            $len = ((int)$bit)/16;
            $expected_at_hash = $this->urlEncode(substr(hash('sha'.$bit, $accessToken, true), 0, $len));
        }
        return (($this->issuerValidator->__invoke($claims->iss))
            && (($claims->aud === $this->clientID) || in_array($this->clientID, $claims->aud, true))
            && ($claims->nonce === $this->getNonce() || $options["ignore_nonce"])
            && ( !isset($claims->exp) || ((gettype($claims->exp) === 'integer') && ($claims->exp >= time() - $this->leeway)))
            && ( !isset($claims->nbf) || ((gettype($claims->nbf) === 'integer') && ($claims->nbf <= time() + $this->leeway)))
            && ( !isset($claims->at_hash) || $claims->at_hash === $expected_at_hash )
        );
    }

    /**
     * @param string $str
     * @return string
     */
    protected function urlEncode($str) {
        $enc = base64_encode($str);
        $enc = rtrim($enc, '=');
        $enc = strtr($enc, '+/', '-_');
        return $enc;
    }

    /**
     * @param string $jwt encoded JWT
     * @param int $section the section we would like to decode
     * @return object
     */
    protected function decodeJWT($jwt, $section = 0) {

        $parts = explode('.', $jwt);
        return json_decode(base64url_decode($parts[$section]));
    }

    /**
     *
     * @param string|null $attribute optional
     *
     * Attribute        Type        Description
     * user_id          string      REQUIRED Identifier for the End-User at the Issuer.
     * name             string      End-User's full name in displayable form including all name parts, ordered according to End-User's locale and preferences.
     * given_name       string      Given name or first name of the End-User.
     * family_name      string      Surname or last name of the End-User.
     * middle_name      string      Middle name of the End-User.
     * nickname         string      Casual name of the End-User that may or may not be the same as the given_name. For instance, a nickname value of Mike might be returned alongside a given_name value of Michael.
     * profile          string      URL of End-User's profile page.
     * picture          string      URL of the End-User's profile picture.
     * website          string      URL of End-User's web page or blog.
     * email            string      The End-User's preferred e-mail address.
     * verified         boolean     True if the End-User's e-mail address has been verified; otherwise false.
     * gender           string      The End-User's gender: Values defined by this specification are female and male. Other values MAY be used when neither of the defined values are applicable.
     * birthday         string      The End-User's birthday, represented as a date string in MM/DD/YYYY format. The year MAY be 0000, indicating that it is omitted.
     * zoneinfo         string      String from zoneinfo [zoneinfo] time zone database. For example, Europe/Paris or America/Los_Angeles.
     * locale           string      The End-User's locale, represented as a BCP47 [RFC5646] language tag. This is typically an ISO 639-1 Alpha-2 [ISO639‑1] language code in lowercase and an ISO 3166-1 Alpha-2 [ISO3166‑1] country code in uppercase, separated by a dash. For example, en-US or fr-CA. As a compatibility note, some implementations have used an underscore as the separator rather than a dash, for example, en_US; Implementations MAY choose to accept this locale syntax as well.
     * phone_number     string      The End-User's preferred telephone number. E.164 [E.164] is RECOMMENDED as the format of this Claim. For example, +1 (425) 555-1212 or +56 (2) 687 2400.
     * address          JSON object The End-User's preferred address. The value of the address member is a JSON [RFC4627] structure containing some or all of the members defined in Section 2.4.2.1.
     * updated_time     string      Time the End-User's information was last updated, represented as a RFC 3339 [RFC3339] datetime. For example, 2011-01-03T23:58:42+0000.
     *
     * @return mixed
     *
     * @throws OpenIDConnectClientException
     */
    public function requestUserInfo($attribute = null) {

        $user_info_endpoint = $this->getProviderConfigValue('userinfo_endpoint');
        $schema = 'openid';

        $user_info_endpoint .= '?schema=' . $schema;

        //The accessToken has to be sent in the Authorization header.
        // Accept json to indicate response type
        $headers = ["Authorization: Bearer {$this->accessToken}",
            'Accept: application/json'];

        $user_json = json_decode($this->fetchURL($user_info_endpoint,null,$headers));
        if ($this->getResponseCode() <> 200) {
            throw new OpenIDConnectClientException('The communication to retrieve user data has failed with status code '.$this->getResponseCode());
        }
        $this->userInfo = $user_json;

        if($attribute === null) {
            return $this->userInfo;
        }

        if (property_exists($this->userInfo, $attribute)) {
            return $this->userInfo->$attribute;
        }

        return null;
    }

    /**
     *
     * @param string|null $attribute optional
     *
     * Attribute        Type    Description
     * exp              int     Expires at
     * nbf              int     Not before
     * ver              string  Version
     * iss              string  Issuer
     * sub              string  Subject
     * aud              string  Audience
     * nonce            string  nonce
     * iat              int     Issued At
     * auth_time        int     Authenatication time
     * oid              string  Object id
     *
     * @return mixed
     *
     */
    public function getVerifiedClaims($attribute = null) {

        if($attribute === null) {
            return $this->verifiedClaims;
        }

        if (property_exists($this->verifiedClaims, $attribute)) {
            return $this->verifiedClaims->$attribute;
        }

        return null;
    }

    /**
     * @param string $url
     * @param string | null $post_body string If this is set the post type will be POST
     * @param array $headers Extra headers to be send with the request. Format as 'NameHeader: ValueHeader'
     * @throws OpenIDConnectClientException
     * @return mixed
     */
    protected function fetchURL($url, $post_body = null, $headers = array()) {

        // OK cool - then let's create a new cURL resource handle
        $ch = curl_init();

        // Determine whether this is a GET or POST
        if ($post_body !== null) {
            // curl_setopt($ch, CURLOPT_POST, 1);
            // Alows to keep the POST method even after redirect
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
            curl_setopt($ch, CURLOPT_POSTFIELDS, $post_body);

            // Default content type is form encoded
            $content_type = 'application/x-www-form-urlencoded';

            // Determine if this is a JSON payload and add the appropriate content type
            if (is_object(json_decode($post_body))) {
                $content_type = 'application/json';
            }

            // Add POST-specific headers
            $headers[] = "Content-Type: {$content_type}";

        }

        // If we set some headers include them
        if(count($headers) > 0) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }

        // Set URL to download
        curl_setopt($ch, CURLOPT_URL, $url);

        if (isset($this->httpProxy)) {
            curl_setopt($ch, CURLOPT_PROXY, $this->httpProxy);
        }

        // Include header in result? (0 = yes, 1 = no)
        curl_setopt($ch, CURLOPT_HEADER, 0);

        // Allows to follow redirect
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

        /**
         * Set cert
         * Otherwise ignore SSL peer verification
         */
        if (isset($this->certPath)) {
            curl_setopt($ch, CURLOPT_CAINFO, $this->certPath);
        }

        if($this->verifyHost) {
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        } else {
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        }

        if($this->verifyPeer) {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        } else {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        }

        // Should cURL return or print out the data? (true = return, false = print)
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        // Timeout in seconds
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeOut);

        // Download the given URL, and return output
        $output = curl_exec($ch);

        // HTTP Response code from server may be required from subclass
        $info = curl_getinfo($ch);
        $this->responseCode = $info['http_code'];

        if ($output === false) {
            throw new OpenIDConnectClientException('Curl error: (' . curl_errno($ch) . ') ' . curl_error($ch));
        }

        // Close the cURL resource, and free system resources
        curl_close($ch);

        return $output;
    }

    /**
     * @param bool $appendSlash
     * @return string
     * @throws OpenIDConnectClientException
     */
    public function getWellKnownIssuer($appendSlash = false) {

        return $this->getWellKnownConfigValue('issuer') . ($appendSlash ? '/' : '');
    }

    /**
     * @return string
     * @throws OpenIDConnectClientException
     */
    public function getIssuer() {

        if (!isset($this->providerConfig['issuer'])) {
            throw new OpenIDConnectClientException('The issuer has not been set');
        }

        return $this->providerConfig['issuer'];
    }

    /**
     * @return mixed
     * @throws OpenIDConnectClientException
     */
    public function getProviderURL() {
        if (!isset($this->providerConfig['providerUrl'])) {
            throw new OpenIDConnectClientException('The provider URL has not been set');
        }

        return $this->providerConfig['providerUrl'];
    }

    /**
     * @param string $url
     */
    public function redirect($url) {
        header('Location: ' . $url);
        exit;
    }

    /**
     * @param string $httpProxy
     */
    public function setHttpProxy($httpProxy) {
        $this->httpProxy = $httpProxy;
    }

    /**
     * @param string $certPath
     */
    public function setCertPath($certPath) {
        $this->certPath = $certPath;
    }

    /**
     * @return string|null
     */
    public function getCertPath()
    {
        return $this->certPath;
    }

    /**
     * @param bool $verifyPeer
     */
    public function setVerifyPeer($verifyPeer) {
        $this->verifyPeer = $verifyPeer;
    }

    /**
     * @param bool $verifyHost
     */
    public function setVerifyHost($verifyHost) {
        $this->verifyHost = $verifyHost;
    }

    /**
     * @return bool
     */
    public function getVerifyHost()
    {
        return $this->verifyHost;
    }

    /**
     * @return bool
     */
    public function getVerifyPeer()
    {
        return $this->verifyPeer;
    }

    /**
     * Use this for custom issuer validation
     * The given function should accept the issuer string from the JWT claim as the only argument
     * and return true if the issuer is valid, otherwise return false
     *
     * @param callable $issuerValidator
     */
    public function setIssuerValidator($issuerValidator){
        $this->issuerValidator = $issuerValidator;
    }

    /**
     * @param bool $allowImplicitFlow
     */
    public function setAllowImplicitFlow($allowImplicitFlow) {
        $this->allowImplicitFlow = $allowImplicitFlow;
    }

    /**
     * @return bool
     */
    public function getAllowImplicitFlow()
    {
        return $this->allowImplicitFlow;
    }

    /**
     *
     * Use this to alter a provider's endpoints and other attributes
     *
     * @param array $array
     *        simple key => value
     */
    public function providerConfigParam($array) {
        $this->providerConfig = array_merge($this->providerConfig, $array);
    }

    /**
     * @param string $clientSecret
     */
    public function setClientSecret($clientSecret) {
        $this->clientSecret = $clientSecret;
    }

    /**
     * @param string $clientID
     */
    public function setClientID($clientID) {
        $this->clientID = $clientID;
    }


    /**
     * Dynamic registration
     *
     * @throws OpenIDConnectClientException
     */
    public function register() {

        $registration_endpoint = $this->getProviderConfigValue('registration_endpoint');

        $send_object = (object ) array_merge($this->registrationParams, array(
            'redirect_uris' => array($this->getRedirectURL()),
            'client_name' => $this->getClientName()
        ));

        $response = $this->fetchURL($registration_endpoint, json_encode($send_object));

        $json_response = json_decode($response);

        // Throw some errors if we encounter them
        if ($json_response === false) {
            throw new OpenIDConnectClientException('Error registering: JSON response received from the server was invalid.');
        }

        if (isset($json_response->{'error_description'})) {
            throw new OpenIDConnectClientException($json_response->{'error_description'});
        }

        $this->setClientID($json_response->{'client_id'});

        // The OpenID Connect Dynamic registration protocol makes the client secret optional
        // and provides a registration access token and URI endpoint if it is not present
        if (isset($json_response->{'client_secret'})) {
            $this->setClientSecret($json_response->{'client_secret'});
        } else {
            throw new OpenIDConnectClientException('Error registering:
                                                    Please contact the OpenID Connect provider and obtain a Client ID and Secret directly from them');
        }

    }

    /**
     * Introspect a given token - either access token or refresh token.
     * @see https://tools.ietf.org/html/rfc7662
     *
     * @param string $token
     * @param string $token_type_hint
     * @param string|null $clientId
     * @param string|null $clientSecret
     * @return mixed
     * @throws OpenIDConnectClientException
     */
    public function introspectToken($token, $token_type_hint = '', $clientId = null, $clientSecret = null) {
        $introspection_endpoint = $this->getProviderConfigValue('introspection_endpoint');

        $post_data = array(
            'token'    => $token,
        );
        if ($token_type_hint) {
            $post_data['token_type_hint'] = $token_type_hint;
        }
        $clientId = $clientId !== null ? $clientId : $this->clientID;
        $clientSecret = $clientSecret !== null ? $clientSecret : $this->clientSecret;

        // Convert token params to string format
        $post_params = http_build_query($post_data, null, '&');
        $headers = ['Authorization: Basic ' . base64_encode(urlencode($clientId) . ':' . urlencode($clientSecret)),
            'Accept: application/json'];

        return json_decode($this->fetchURL($introspection_endpoint, $post_params, $headers));
    }

    /**
     * Revoke a given token - either access token or refresh token.
     * @see https://tools.ietf.org/html/rfc7009
     *
     * @param string $token
     * @param string $token_type_hint
     * @param string|null $clientId
     * @param string|null $clientSecret
     * @return mixed
     * @throws OpenIDConnectClientException
     */
    public function revokeToken($token, $token_type_hint = '', $clientId = null, $clientSecret = null) {
        $revocation_endpoint = $this->getProviderConfigValue('revocation_endpoint');

        $post_data = array(
            'token'    => $token,
        );
        if ($token_type_hint) {
            $post_data['token_type_hint'] = $token_type_hint;
        }
        $clientId = $clientId !== null ? $clientId : $this->clientID;
        $clientSecret = $clientSecret !== null ? $clientSecret : $this->clientSecret;

        // Convert token params to string format
        $post_params = http_build_query($post_data, null, '&');
        $headers = ['Authorization: Basic ' . base64_encode(urlencode($clientId) . ':' . urlencode($clientSecret)),
            'Accept: application/json'];

        return json_decode($this->fetchURL($revocation_endpoint, $post_params, $headers));
    }

    /**
     * @return string
     */
    public function getClientName() {
        return $this->clientName;
    }

    /**
     * @param string $clientName
     */
    public function setClientName($clientName) {
        $this->clientName = $clientName;
    }

    /**
     * @return string
     */
    public function getClientID() {
        return $this->clientID;
    }

    /**
     * @return string
     */
    public function getClientSecret() {
        return $this->clientSecret;
    }

    /**
     * @return bool
     */
    public function canVerifySignatures() {
        return class_exists('\phpseclib\Crypt\RSA') || class_exists('Crypt_RSA');
    }

    /**
     * Set the access token.
     *
     * May be required for subclasses of this Client.
     *
     * @param string $accessToken
     * @return void
     */
    public function setAccessToken($accessToken) {
        $this->accessToken = $accessToken;
    }

    /**
     * @return string
     */
    public function getAccessToken() {
        return $this->accessToken;
    }

    /**
     * @return string
     */
    public function getRefreshToken() {
        return $this->refreshToken;
    }

    /**
     * @return string
     */
    public function getIdToken() {
        return $this->idToken;
    }

    /**
     * @return object
     */
    public function getAccessTokenHeader() {
        return $this->decodeJWT($this->accessToken);
    }

    /**
     * @return object
     */
    public function getAccessTokenPayload() {
        return $this->decodeJWT($this->accessToken, 1);
    }

    /**
     * @return object
     */
    public function getIdTokenHeader() {
        return $this->decodeJWT($this->idToken);
    }

    /**
     * @return object
     */
    public function getIdTokenPayload() {
        return $this->decodeJWT($this->idToken, 1);
    }

    /**
     * @return string
     */
    public function getTokenResponse() {
        return $this->tokenResponse;
    }

    /**
     * Stores nonce
     *
     * @param string $nonce
     * @return string
     */
    protected function setNonce($nonce) {
        $this->setSessionKey('openid_connect_nonce', $nonce);
        return $nonce;
    }

    /**
     * Get stored nonce
     *
     * @return string
     */
    protected function getNonce() {
        return $this->getSessionKey('openid_connect_nonce');
    }

    /**
     * Cleanup nonce
     *
     * @return void
     */
    protected function unsetNonce() {
        $this->unsetSessionKey('openid_connect_nonce');
    }

    /**
     * Stores $state
     *
     * @param string $state
     * @return string
     */
    protected function genState() {
        //Generate a state using jwt
        $payload = [
            "token" => $this->generateRandString(),
            "exp" => date("U") + 5 * 60
        ];

        $key = $this->getServerKey();
        $jwt = JWT::encode($payload, $key);

        return $jwt;
    }

    /**
     * Get stored state
     *
     * @return string
     */
    protected function checkState($state = "") {
        $key = $this->getServerKey();

        try{
            //Check state is valid and non expired
            $jwt = JWT::decode($state, $key, array('HS256'));

            if($jwt->exp > date("U")){
                return true;
            }
        }catch(\Exception $e){}

        return false;
    }

    /**
     * Stores $codeVerifier
     *
     * @param string $codeVerifier
     * @return string
     */
    protected function setCodeVerifier($codeVerifier) {
        $this->setSessionKey('openid_connect_code_verifier', $codeVerifier);
        return $codeVerifier;
    }

    /**
     * Get stored codeVerifier
     *
     * @return string
     */
    protected function getCodeVerifier() {
        return $this->getSessionKey('openid_connect_code_verifier');
    }

    /**
     * Cleanup state
     *
     * @return void
     */
    protected function unsetCodeVerifier() {
        $this->unsetSessionKey('openid_connect_code_verifier');
    }

    /**
     * Get the response code from last action/curl request.
     *
     * @return int
     */
    public function getResponseCode()
    {
        return $this->responseCode;
    }

    /**
     * Set timeout (seconds)
     *
     * @param int $timeout
     */
    public function setTimeout($timeout)
    {
        $this->timeOut = $timeout;
    }

    /**
     * @return int
     */
    public function getTimeout()
    {
        return $this->timeOut;
    }

    /**
     * Safely calculate length of binary string
     * @param string $str
     * @return int
     */
    private static function safeLength($str)
    {
        if (function_exists('mb_strlen')) {
            return mb_strlen($str, '8bit');
        }
        return strlen($str);
    }

    /**
     * Where has_equals is not available, this provides a timing-attack safe string comparison
     * @param string $str1
     * @param string $str2
     * @return bool
     */
    private static function hashEquals($str1, $str2)
    {
        $len1=static::safeLength($str1);
        $len2=static::safeLength($str2);

        //compare strings without any early abort...
        $len = min($len1, $len2);
        $status = 0;
        for ($i = 0; $i < $len; $i++) {
            $status |= (ord($str1[$i]) ^ ord($str2[$i]));
        }
        //if strings were different lengths, we fail
        $status |= ($len1 ^ $len2);
        return ($status === 0);
    }

    /**
     * Use session to manage a nonce
     */
    protected function startSession() {
        if (!isset($_SESSION)) {
            @session_start();
        }
    }

    protected function commitSession() {
        $this->startSession();

        session_write_close();
    }

    protected function getSessionKey($key) {
        $this->startSession();

        return $_SESSION[$key];
    }

    protected function setSessionKey($key, $value) {
        $this->startSession();

        $_SESSION[$key] = $value;
    }

    protected function unsetSessionKey($key) {
        $this->startSession();

        unset($_SESSION[$key]);
    }

    public function setUrlEncoding($curEncoding)
    {
        switch ($curEncoding)
        {
            case PHP_QUERY_RFC1738:
                $this->enc_type = PHP_QUERY_RFC1738;
                break;

            case PHP_QUERY_RFC3986:
                $this->enc_type = PHP_QUERY_RFC3986;
                break;

        	default:
                break;
        }

    }

    /**
     * @return array
     */
    public function getScopes()
    {
        return $this->scopes;
    }

    /**
     * @return array
     */
    public function getResponseTypes()
    {
        return $this->responseTypes;
    }

    /**
     * @return array
     */
    public function getAuthParams()
    {
        return $this->authParams;
    }

    /**
     * @return callable
     */
    public function getIssuerValidator()
    {
        return $this->issuerValidator;
    }

    /**
     * @return int
     */
    public function getLeeway()
    {
        return $this->leeway;
    }

    /**
     * @return string
     */
    public function getCodeChallengeMethod() {
        return $this->codeChallengeMethod;
    }

    /**
     * @param string $codeChallengeMethod
     */
    public function setCodeChallengeMethod($codeChallengeMethod) {
        $this->codeChallengeMethod = $codeChallengeMethod;
    }
}
