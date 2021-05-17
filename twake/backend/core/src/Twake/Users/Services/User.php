<?php

namespace Twake\Users\Services;

use App\App;
use Common\Http\Request;
use Common\Http\Response;
use Twake\Core\Services\DoctrineAdapter\ManagerAdapter;
use Twake\Core\Services\Translate;
use Twake\Upload\Entity\File;
use Twake\Users\Entity\Device;
use Twake\Users\Entity\ExternalUserRepository;
use Twake\Users\Entity\Mail;
use Twake\Users\Entity\VerificationNumberMail;
use \Firebase\JWT\JWT;

/**
 * This service is responsible for subscribtions, unsubscribtions, request for new password
 */
class User
{

    /** @var App */
    private $app;

    /* @var Translate $translate  */
    var $translate;
    /** @var ManagerAdapter */
    private $em;
    private $pusher;
    private $twake_mailer;
    private $string_cleaner;
    private $workspace_members_service;
    private $group_service;
    private $workspace_service;
    private $restClient;
    private $standalone;
    private $licenceKey;
    private $encoder;


    public function __construct(App $app)
    {
        $this->app = $app;
        $this->em = $app->getServices()->get("app.twake_doctrine");
        $this->pusher = $app->getServices()->get("app.pusher");
        $this->twake_mailer = $app->getServices()->get("app.twake_mailer");
        $this->string_cleaner = $app->getServices()->get("app.string_cleaner");
        $this->workspace_members_service = $app->getServices()->get("app.workspace_members");
        $this->group_service = $app->getServices()->get("app.groups");
        $this->workspace_service = $app->getServices()->get("app.workspaces");
        $this->restClient = $app->getServices()->get("app.restclient");
        $this->translate = $app->getServices()->get("app.translate");
        $this->standalone = $app->getContainer()->getParameter("env.standalone");
        $this->licenceKey = $app->getContainer()->getParameter("env.licence_key");
        $this->encoder = new PasswordEncoder();
    }

    public function alive($userId)
    {
        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->find($userId);

        if ($user != null) {
            $user->isActive();
            $this->em->persist($user);
            $this->em->flush();
        }
    }

    /**
     * @param $service_id
     * @param $external_id
     * @return null|\Twake\Users\Entity\User
     */
    public function getUserFromExternalRepository($service_id, $external_id)
    {

        $extRepository = $this->em->getRepository("Twake\Users:ExternalUserRepository");
        /** @var ExternalUserRepository $user_link */
        $user_link = $extRepository->findOneBy(Array("service_id" => $service_id, "external_id" => $external_id));

        if (!$user_link) {
            return null;
        } else {
            $user_id = $user_link->getUserId();
            $userRepository = $this->em->getRepository("Twake\Users:User");
            /** @var \Twake\Users\Entity\User $user */
            $user = $userRepository->find($user_id);
            return $user;
        }

    }
   public function setUserFromExternalRepository($service_id, $external_id, $user_id)
   {

       $extRepository = $this->em->getRepository("Twake\Users:ExternalUserRepository");
       /** @var ExternalUserRepository $user_link */
       $user_link = $extRepository->findOneBy(Array("service_id" => $service_id, "external_id" => $external_id));

       if (!$user_link) {
         $user_link = new ExternalUserRepository($service_id, $external_id, $user_id);
         $this->em->persist($user_link);
       } else {
         $user_link->setUserId($user_id);
       }

       $this->em->flush();
       return $user_link;

   }

    public function loginFromServiceWithToken($service_id, $external_id, $email, $username, $fullname, $picture)
    {
        $user = $this->getUserFromExternalRepository($service_id, $external_id);

        if (!$user) {
            //Subscribe user

            //Find allowed username / email
            $counter = 1;
            $original_username = $username;
            $ok = false;
            $mailUsedError = false;
            do {
                $res = $this->getAvaibleMailPseudo($email, $username);
                if ($res !== true) {
                    if (in_array(-1, $res)) {
                        //Mail used
                        $mailUsedError = true;
                        break;
                    }
                    if (in_array(-2, $res)) {
                        //Username used
                        $username = $original_username . $counter;
                    }else{
                        $ok = true;
                    }
                }else{
                    $ok = true;
                }
                $counter++;
            } while (!$ok && $counter < 1000);
            if($mailUsedError){
                return false;
            }

            $user = new \Twake\Users\Entity\User();
            $user->setSalt(bin2hex(random_bytes(40)));
            $encoder = $this->encoder;
            $user->setPassword($encoder->encodePassword(bin2hex(random_bytes(40)), $user->getSalt()));
            $user->setUsername($username);
            $user->setMailVerified(true);
            $user->setEmail($email);
            $user->setLanguage("en");
            $user->setPhone("");
            $user->setIdentityProvider($service_id);

            $this->em->persist($user);
            $this->em->flush();

            $this->setUserFromExternalRepository($service_id, $external_id, $user->getId());

            $this->workspace_members_service->autoAddMemberByNewMail($email, $user->getId());

        }

        $user->setFirstName(@explode(" ", $fullname)[0] ?: "");
        $user->setLastName(@explode(" ", $fullname)[1] ?: "");

        if (($picture && (!$user->getThumbnail() || $user->getThumbnail()->getPublicLink() != $picture)) || ($user->getThumbnail() && !$picture)) {
            if ($user->getThumbnail()) {
                $this->em->remove($user->getThumbnail());
            }
            if($picture){
              $thumbnail = new File();
              $thumbnail->setPublicLink($picture);
              $user->setThumbnail($thumbnail);
              $user->setPicture($thumbnail->getPublicURL(2));
              $this->em->persist($thumbnail);
            }else{
              $user->setThumbnail(null);
              $user->setPicture("");
            }
        }

        $this->em->persist($user);
        $this->em->flush();

        return $this->loginWithUsernameOnlyWithToken($user->getusernameCanonical());
    }

    public function loginWithIdOnlyWithToken($userId, Response $response = null)
    {

        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->findOneBy(Array("id" => $userId));

        if ($user == null) {
            return false;
        }

        if ($user->getBanned()) {
            return false;
        }

        $token = bin2hex(random_bytes(64));

        $user->setTokenLogin(
          [
            "expiration" => date("U") + 120,
            "token" => $token
          ]
        );

        $this->em->persist($user);
        $this->em->flush();

        return ["token" => $token, "username" => $user->getEmail()];

    }

    public function loginWithUsernameOnlyWithToken($usernameOrMail, Response $response = null)
    {

        $usernameOrMail = trim(strtolower($usernameOrMail));

        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->findOneBy(Array("usernamecanonical" => $this->string_cleaner->simplifyUsername($usernameOrMail)));
        if ($user == null) {
            $user = $userRepository->findOneBy(Array("emailcanonical" => $this->string_cleaner->simplifyMail($usernameOrMail)));
        }

        if ($user == null) {
            return false;
        }

        if ($user->getBanned()) {
            return false;
        }

        $token = bin2hex(random_bytes(64));

        $user->setTokenLogin(
          [
            "expiration" => date("U") + 120,
            "token" => $token
          ]
        );

        $this->em->persist($user);
        $this->em->flush();

        return ["token" => $token, "username" => $user->getEmail()];

    }

    public function login($usernameOrMail, $passwordOrToken, $rememberMe = false, $request = null, $response = null)
    {

        $usernameOrMail = trim(strtolower($usernameOrMail));

        $userRepository = $this->em->getRepository("Twake\Users:User");

        $user = $userRepository->findOneBy(Array("usernamecanonical" => $this->string_cleaner->simplifyUsername($usernameOrMail)));

        if ($user == null) {
            $user = $userRepository->findOneBy(Array("emailcanonical" => $this->string_cleaner->simplifyMail($usernameOrMail)));
        }

        if ($user == null) {
            return false;
        }

        $tokenLogin = $user->getTokenLogin();

        if(isset($tokenLogin["expiration"]) && $tokenLogin["expiration"] > date("U")){
          if(isset($tokenLogin["token"]) && $tokenLogin["token"] == $passwordOrToken){
            $this->app->getServices()->get("app.session_handler")->setUser($user);
            return $user;
          }
        }

        $encoder = $this->encoder;
        $passwordValid = $encoder->isPasswordValid($user->getPassword(), $passwordOrToken, $user->getSalt());

        if ($passwordValid && !$user->getBanned() && $user->getMailVerifiedExtended()) {

            $this->app->getServices()->get("app.session_handler")->setUser($user);
            return $user;

        }

        return false;

    }

    public function generateJWT($user){

        $key = $this->app->getContainer()->getParameter("jwt.secret");

        $expiration = date("U") + $this->app->getContainer()->getParameter("jwt.expiration");
        $payload = [
            "exp" => $expiration,
            "type" => "access",
            "iat" => intval(date("U")) - 60*10,
            "nbf" => intval(date("U")) - 60*10,
            "sub" => $user->getId(),
            "email" => $user->getEmail(),
        ];
        $jwt = JWT::encode($payload, $key);

        $refreshExpiration = date("U") + $this->app->getContainer()->getParameter("jwt.refresh_expiration");
        $payload = [
            "exp" => $refreshExpiration,
            "type" => "refresh",
            "iat" => intval(date("U")) - 60*10,
            "nbf" => intval(date("U")) - 60*10,
            "sub" => $user->getId()
        ];
        $jwt_refresh = JWT::encode($payload, $key);

        return [
            "time" => date("U"),
            "expiration" => $expiration,
            "refresh_expiration" => $refreshExpiration,
            "value" => $jwt,
            "refresh" => $jwt_refresh,
            "type" => "Bearer"
        ];

    }

    public function logout(Request $request)
    {
        $response = new Response();
        $response->clearCookie('REMEMBERME');
        $response->sendHeaders();

        $this->app->getServices()->get("app.session_handler")->destroySession($request);

        return true;
    }

    public function ban($userId)
    {
        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->find($userId);
        $user->setBanned(true);
        $this->em->persist($user);
        $this->em->flush();
    }

    public function unban($userId)
    {
        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->find($userId);
        $user->setBanned(false);
        $this->em->persist($user);
        $this->em->flush();
    }

    public function requestNewPassword($mail)
    {

        $mail = $this->string_cleaner->simplifyMail($mail);

        $userRepository = $this->em->getRepository("Twake\Users:User");
        /* @var \Twake\Users\Entity\User $user */
        $user = $userRepository->findOneBy(Array("emailcanonical" => $mail));
        if ($user != null) {
            $verificationNumberMail = new VerificationNumberMail($mail);

            $code = $verificationNumberMail->getCode();

            if (!defined("TESTENV")) {
                error_log("recover code: " . $code);
            }

            $this->twake_mailer->send($mail, "requestPassword", Array(
                "_language" => $user ? $user->getLanguage() : "en",
                "code" => $code,
                "username" => $user->getUsername()
            ));

            $this->em->persist($verificationNumberMail);
            $this->em->flush();
            return $verificationNumberMail->getToken();
        }

        return false;
    }

    public function checkNumberForNewPasswordRequest($token, $code)
    {
        $verificationRepository = $this->em->getRepository("Twake\Users:VerificationNumberMail");
        $ticket = $verificationRepository->findOneBy(Array("token" => $token));

        if ($ticket != null) {
            return $ticket->verifyCode($code);
        }

        return false;
    }

    public function setNewPasswordAfterNewPasswordRequest($token, $code, $password)
    {

        $verificationRepository = $this->em->getRepository("Twake\Users:VerificationNumberMail");
        $userRepository = $this->em->getRepository("Twake\Users:User");
        $ticket = $verificationRepository->findOneBy(Array("token" => $token));
        $encoder = $this->encoder;

        if ($ticket != null) {
            if ($ticket->verifyCode($code)) {
                $user = $userRepository->findOneBy(Array("emailcanonical" => $ticket->getMail()));
                if ($user != null) {

                    $user->setPassword($encoder->encodePassword($password, $user->getSalt()));
                    $user->setMailVerified(true);

                    $this->em->remove($ticket);
                    $this->em->persist($user);
                    $this->em->flush();

                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @param $mail
     * @param $pseudo
     * @return [-1, -2] | true (-1 is bad mail, -2 is bad username)
     */
    public function getAvaibleMailPseudo($mail, $pseudo)
    {
        $mail = $this->string_cleaner->simplifyMail($mail);
        $pseudo = $this->string_cleaner->simplifyUsername($pseudo);
        $retour = Array();
        
        if (!$this->string_cleaner->verifyMail($mail)) {
            $retour[] = -1;
        } else {

            if(in_array($pseudo, ["all", "here", "null", "undefined"]) || strlen($pseudo) <= 4){
                $retour[] = -2;
            }

            //Check user doesn't exists
            $userRepository = $this->em->getRepository("Twake\Users:User");
            $user = $userRepository->findOneBy(Array("emailcanonical" => $mail));
            //Check mail doesn't exists
            $mailsRepository = $this->em->getRepository("Twake\Users:Mail");
            $mailExists = $mailsRepository->findOneBy(Array("mail" => $mail));

            if (($user != null && $user->getMailVerifiedExtended($mail, $pseudo)) || $mailExists != null) {
                $retour[] = -1;
            }

            //Check pseudo doesn't exists
            $userRepository = $this->em->getRepository("Twake\Users:User");
            $user = $userRepository->findOneBy(Array("usernamecanonical" => $pseudo));
            if ($user != null && $user->getMailVerifiedExtended($mail, $pseudo)) {
                $retour[] = -2;
            }
        }

        if (count($retour) <= 0) {
            return true;
        }
        return $retour;
    }

    public function subscribeMail($mail, $pseudo, $password, $name, $firstname, $phone, $language, $newsletter = false, $sendEmail = true)
    {

        $pseudo = $this->string_cleaner->simplifyUsername($pseudo);

        //Check pseudo doesn't exists
        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->findOneBy(Array("usernamecanonical" => $pseudo));
        if ($user != null && $user->getMailVerifiedExtended($mail, $pseudo)) {
            return ["error" => "usernamealreadytaken"];
        }

        $mail = $this->string_cleaner->simplifyMail($mail);

        if (!$this->string_cleaner->verifyMail($mail)) {
            return ["error" => "mailalreadytaken"];
        }

        //Check mail doesn't exists
        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->findOneBy(Array("emailcanonical" => $mail));
        if ($user != null && $user->getMailVerifiedExtended($mail, $pseudo)) {
            return ["error" => "mailalreadytaken"];
        }
        $mailsRepository = $this->em->getRepository("Twake\Users:Mail");
        $mailExists = $mailsRepository->findOneBy(Array("mail" => $mail));
        if ($mailExists != null) {
            return ["error" => "mailalreadytaken"];
        }

        $complete_existing_user = null;
        if ($user && !$user->getMailVerifiedExtended($mail, $pseudo) && $user->getisNew()) { //This user never verified his email, so we remove it.
            if (strlen($user->getMailVerificationOverride()) > 2) {
                $complete_existing_user = $user;
            } else {
                $this->em->remove($user);
                $this->em->flush();
            }
        }

        $auto_validate_mail = $this->app->getContainer()->getParameter("defaults.auth.internal.disable_email_verification");

        $verificationNumberMail = new VerificationNumberMail($mail);
        $code = $verificationNumberMail->getCode();
        $this->em->persist($verificationNumberMail);

        if(!$auto_validate_mail){

          $magic_link = "/login?verifyMail&m=" . $mail . "&c=" . $code . "&token=" . $verificationNumberMail->getToken();

          if (!defined("TESTENV")) {
              error_log("sign in code: " . $magic_link);
          }

          if ($sendEmail) {
              $this->twake_mailer->send($mail, "subscribeMail", Array("_language" => $user ? $user->getLanguage() : "en", "code" => $code, "magic_link" => $magic_link));
          }

        }

        //Create the temporary user
        $user = new \Twake\Users\Entity\User();
        $user->setSalt(bin2hex(random_bytes(40)));
        $encoder = $this->encoder;
        $user->setPassword($encoder->encodePassword($password, $user->getSalt()));
        if (!$complete_existing_user) {
            $user->setUsername($pseudo);
            $user->setEmail($mail);
        } else {
            $user->setUsername("to_replace/" . $pseudo);
            $user->setEmail("to_replace/" . $mail);
        }
        $user->setFirstName($firstname);
        $user->setLastName($name);
        $user->setPhone($phone);
        $user->setLanguage($language ? $language : "en");
        $this->em->persist($user);

        $this->em->flush();

        if ($sendEmail) {
            try {
              $contact_list_subscribe = $this->app->getContainer()->getParameter("mail.mailjet.contact_list_subscribe");
              if($contact_list_subscribe){
                $data = Array(
                    "Email" => $mail,
                    "Properties" => Array(
                        "first_name" => $firstname,
                        "last_name" => $name,
                        "language" => $language,
                    ),
                    "Action" => "addforce"
                );
                $this->restClient->post($contact_list_subscribe["url"], json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 60, CURLOPT_USERPWD => $contact_list_subscribe["token"], CURLOPT_HTTPHEADER => ['Content-Type: application/json']));
              }
            } catch (\Exception $exception) {
                error_log($exception->getMessage());
            }
        }
        if ($newsletter) {
            try {
              $contact_list_newsletter = $this->app->getContainer()->getParameter("mail.mailjet.contact_list_newsletter");
              if($contact_list_newsletter){
                $data = Array(
                    "Email" => $mail,
                    "Properties" => Array(
                        "first_name" => $firstname,
                        "last_name" => $name,
                        "language" => $language,
                    ),
                    "Action" => "addforce"
                );
                $this->restClient->post($contact_list_newsletter["url"], json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 60, CURLOPT_USERPWD => $contact_list_newsletter["token"], CURLOPT_HTTPHEADER => ['Content-Type: application/json']));
              }
            } catch (\Exception $exception) {
                error_log($exception->getMessage());
            }
        }

        if($auto_validate_mail){
          $this->verifyMail($mail, $verificationNumberMail->getToken(), $code, true);
        }

        return $verificationNumberMail->getToken();
    }

    public function verifyMail($mail, $token, $code, $force = false, $response = null,  $login = true)
    {

        $mail = trim(strtolower($mail));

        $verificationRepository = $this->em->getRepository("Twake\Users:VerificationNumberMail");
        $ticket = $verificationRepository->findOneBy(Array("token" => $token));
        if (($ticket != null && $ticket->verifyCode($code) && $ticket->getMail($mail)) || $force) {

            if ($ticket) {
                $ticket->setVerified(true);
                $this->em->persist($ticket);
                $this->em->flush();
            }

            $userRepository = $this->em->getRepository("Twake\Users:User");
            $user = $userRepository->findOneBy(Array("emailcanonical" => $mail));
            if ($user) {

                $user_to_replace = $userRepository->findOneBy(Array("emailcanonical" => "to_replace/" . $mail));
                if ($user_to_replace) {

                    $username = explode("/", $user_to_replace->getUsername());
                    $username = $username[1];

                    $user->setUsername($username);

                    $user->setSalt($user_to_replace->getSalt());
                    $user->setPassword($user_to_replace->getPassword());

                    $user->setFirstName($user_to_replace->getFirstName());
                    $user->setLastName($user_to_replace->getLastName());
                    $user->setPhone($user_to_replace->getPhone());

                    $this->em->remove($user_to_replace);
                    $this->em->flush();

                }

                $user->setMailVerified(true);
                $this->em->persist($user);

                $mailObj = new Mail();
                $mailObj->setMail($user->getEmail());
                $mailObj->setUserId($user->getId());

                $this->em->persist($mailObj);

                $this->em->flush();

                $this->workspace_members_service->autoAddMemberByNewMail($mail, $user->getId());


                // User auto log in
                if($login) $this->app->getServices()->get("app.session_handler")->setUser($user);

            }

            return true;
        }
        return false;
    }

    public function createCompanyUser($mail, $fullname, $password, $language, $workspace_id, $current_user_id)
    {

        $pseudo = explode("@", $mail)[0] . "_" . date("U");
        $firstname = explode(" ", $fullname)[0];
        $lastname = explode(" ", $fullname . " ")[1];
        $override_key = $workspace_id . "_" . $current_user_id;

        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->findOneBy(Array("emailcanonical" => $mail));
        if ($user != null) {
            if ($user->getMailVerified() || $user->getMailVerificationOverride() != $override_key) {
                return ["error" => "mailalreadytaken"];
            } else if (!$user->getMailVerified() && $user->getMailVerificationOverride() == $override_key) {

                $user->setSalt(bin2hex(random_bytes(40)));
                $encoder = $this->encoder;
                $user->setPassword($encoder->encodePassword($password, $user->getSalt()));
                $user->setUsername($pseudo);

                $this->em->persist($user);
                $this->em->flush();

                $this->verifyMail($mail, "", "", true);

                $user->setMailVerified(false);
                $this->em->persist($user);
                $this->em->flush();

                return true;

            } else {
                return ["error" => "mailalreadytaken"];
            }
        }
        $mailsRepository = $this->em->getRepository("Twake\Users:Mail");
        $mailExists = $mailsRepository->findOneBy(Array("mail" => $mail));
        if ($mailExists != null) {
            return ["error" => "mailalreadytaken"];
        }
        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->findOneBy(Array("usernamecanonical" => $pseudo));
        if ($user != null && $user->getMailVerified()) {
            return ["error" => "usernamealreadytaken"];
        }

        $user = new \Twake\Users\Entity\User();
        $user->setSalt(bin2hex(random_bytes(40)));
        $encoder = $this->encoder;
        $user->setPassword($encoder->encodePassword($password, $user->getSalt()));
        $user->setUsername($pseudo);
        $user->setEmail($mail);
        $user->setFirstName($firstname);
        $user->setLastName($lastname);
        $user->setPhone("");
        $user->setLanguage($language ? $language : "en");
        $user->setMailVerificationOverride($override_key);
        $this->em->persist($user);
        $this->em->flush();

        $this->verifyMail($mail, "", "", true, null, false);

        $user->setMailVerified(false);
        $this->em->persist($user);
        $this->em->flush();

        return true;

    }

    public function checkPassword($userId, $password)
    {
        $userRepository = $this->em->getRepository("Twake\Users:User");

        $user = $userRepository->find($userId);

        if ($user == null) {
            return false;
        }

        $encoder = $this->encoder;
        $passwordValid = $encoder->isPasswordValid($user->getPassword(), $password, $user->getSalt());

        $res = false;
        if ($passwordValid) {
            $res = true;
        }
        return $res;
    }

    public function addDevice($userId, $type, $value, $version = "?")
    {
        $devicesRepository = $this->em->getRepository("Twake\Users:Device");

        $devices = $devicesRepository->findBy(Array("value" => $value));
        $devices = array_merge($devices, $devicesRepository->findBy(Array("user_id" => $userId)));
        foreach($devices as $device){
            $this->em->remove($device);
        }

        $newDevice = new Device($userId, $type, $value, $version);
        $this->em->persist($newDevice);
        $this->em->flush();

        return true;

    }

    public function removeDevice($userId, $type, $value)
    {
        $devicesRepository = $this->em->getRepository("Twake\Users:Device");
        $devices = $devicesRepository->findBy(Array("user_id" => $userId));
        foreach($devices as $device){
            if($device->getValue() === $value){
                $this->em->remove($device);
            }
        }

        return true;
    }

    public function getSecondaryMails($userId)
    {

        $mailRepository = $this->em->getRepository("Twake\Users:Mail");
        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->find($userId);

        return $mailRepository->findBy(Array("user_id" => $user));

    }

    public function addNewMail($userId, $mail)
    {

        $mail = $this->string_cleaner->simplifyMail($mail);

        $userRepository = $this->em->getRepository("Twake\Users:User");
        $mailRepository = $this->em->getRepository("Twake\Users:Mail");
        $user = $userRepository->find($userId);

        $userWithThisMailAsMainMail = $userRepository->findOneBy(Array("emailcanonical" => $mail));

        $res = false;

        if ($user != null && $userWithThisMailAsMainMail == null) {
            $mailExists = $mailRepository->findOneBy(Array("mail" => $mail));

            if ($mailExists == null) {

                $verificationNumberMail = new VerificationNumberMail($mail);

                $code = $verificationNumberMail->getCode();

                $this->twake_mailer->send($mail, "addMail",
                    Array("_language" => $user ? $user->getLanguage() : "en", "code" => $code, "username" => $user->getUsername()));

                $this->em->persist($verificationNumberMail);
                $this->em->flush();
                $res = $verificationNumberMail->getToken();

            }

        }

        return $res;
    }

    public function removeSecondaryMail($userId, $mailId)
    {


        $userRepository = $this->em->getRepository("Twake\Users:User");
        $mailRepository = $this->em->getRepository("Twake\Users:Mail");
        $user = $userRepository->find($userId);

        $res = false;

        if ($user != null) {
            $mail = $mailRepository->findOneBy(Array("id" => $mailId));
            if ($mail && $mail->getUserId() == $userId) {
                $this->em->remove($mail);
                $this->em->flush();
                $res = true;
            }

        }

        return $res;
    }

    public function checkNumberForAddNewMail($userId, $token, $code)
    {

        $verificationRepository = $this->em->getRepository("Twake\Users:VerificationNumberMail");
        $userRepository = $this->em->getRepository("Twake\Users:User");
        $mailRepository = $this->em->getRepository("Twake\Users:Mail");
        $ticket = $verificationRepository->findOneBy(Array("token" => $token));
        $user = $userRepository->find($userId);

        if ($ticket != null && $user != null) {
            if ($ticket->verifyCode($code)) {
                $userWithMail = $userRepository->findOneBy(Array("emailcanonical" => $ticket->getMail()));
                if ($userWithMail == null || $userWithMail->getId() != $userId) {
                    $mailExists = $mailRepository->findOneBy(Array("mail" => $ticket->getMail()));

                    if ($mailExists == null) {
                        $mail = new Mail();
                        $mail->setMail($ticket->getMail());
                        $mail->setUserId($user->getId());

                        $this->em->remove($ticket);
                        $this->em->persist($mail);
                        $this->em->flush();

                        $this->workspace_members_service->autoAddMemberByNewMail($ticket->getMail(), $user->getId());

                        return $mail->getId();

                    }
                }
            }
        }

        return false;
    }

    public function changePassword($userId, $oldPassword, $password)
    {

        if (!$password) {
            return false;
        }

        if (!$this->string_cleaner->verifyPassword($password)) {
            return false;
        }

        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->find($userId);
        $encoder = $this->encoder;
        if ($user != null) {

            $passwordValid = $encoder->isPasswordValid($user->getPassword(), $oldPassword, $user->getSalt());

            if ($passwordValid) {

                $user->setPassword($encoder->encodePassword($password, $user->getSalt()));

                $this->em->persist($user);
                $this->em->flush();

                return true;
            }

        }

        return false;
    }

    public function changePseudo($userId, $pseudo)
    {

        $pseudo = $this->string_cleaner->simplifyUsername($pseudo);

        if (!$pseudo) {
            return false;
        }

        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->find($userId);

        $otherUser = $userRepository->findOneBy(Array("usernamecanonical" => $pseudo));
        if ($otherUser != null && $otherUser->getId() != $userId) {
            return false;
        }

        if ($user != null) {

            $user->setUsername($pseudo);

            $this->em->persist($user);
            $this->em->flush();

            $datatopush = Array(
                "type" => "USER",
                "action" => "changeUser"
            );
            $this->pusher->push($datatopush, "notifications/" . $user->getId());

            return true;

        }

        return false;
    }

    /**
     * @param $userId
     * @param $mail
     * @return bool
     */
    public function changeMainMail($userId, $mailId)
    {


        $userRepository = $this->em->getRepository("Twake\Users:User");
        $mailRepository = $this->em->getRepository("Twake\Users:Mail");

        $user = $userRepository->find($userId);

        if ($user != null) {
            $mailObj = $mailRepository->findOneBy(Array("id" => $mailId));


            if ($mailObj != null) {

                $user->setEmail($mailObj->getMail());

                $this->em->persist($user);
                $this->em->persist($mailObj);
                $this->em->flush();

                return true;

            }

        }

        return false;
    }

    public function updateUserBasicData($userId, $firstName, $lastName, $thumbnail = null, $uploader = null)
    {
        $userRepository = $this->em->getRepository("Twake\Users:User");

        $user = $userRepository->find($userId);

        if ($user != null) {

            $user->setFirstName($firstName);
            $user->setLastName($lastName);
            if ($thumbnail == 'false' || $thumbnail == 'null') {
                $user->setThumbnail(null);
                $user->setPicture("");
            } else if ($thumbnail != null && !is_string($thumbnail)) {
                if ($user->getThumbnail()) {
                    if ($uploader) {
                        $uploader->removeFile($user->getThumbnail(), false);
                    } else {
                        $user->getThumbnail()->deleteFromDisk();
                    }
                    $this->em->remove($user->getThumbnail());
                }
                $user->setThumbnail($thumbnail);
                $user->setPicture($thumbnail->getPublicURL(2));
            }
            $this->em->persist($user);
            $this->em->flush();

            $datatopush = Array(
                "type" => "USER",
                "action" => "changeUser"
            );
            $this->pusher->push($datatopush, "notifications/" . $user->getId());

            return $user;

        }

    }

    public function setNotificationPreferences($userId, $notification)
    {
        $userRepository = $this->em->getRepository("Twake\Users:User");

        $user = $userRepository->find($userId);

        if ($user != null) {

            $all_notification = $user->getNotificationPreference();

            foreach ($notification as $key => $value) {
                $all_notification[$key] = $value;
            }

            $user->setNotificationPreference($all_notification);
            $this->em->persist($user);
            $this->em->flush();

        }
    }

    public function getNotificationPreferences($userId)
    {
        $userRepository = $this->em->getRepository("Twake\Users:User");

        $user = $userRepository->find($userId);

        if ($user != null) {
            return $user->getNotificationPreference();
        }

        return false;

    }

    public function setWorkspacesPreferences($userId, $preferences)
    {
        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->find($userId);
        if ($user != null) {
            $user->setWorkspacesPreference($preferences);
            $this->em->persist($user);
            $this->em->flush();
        }
    }

    public function updateStatus($userId, $status)
    {
        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->find($userId);
        if ($user != null) {
            $user->setStatusIcon($status);
            $this->em->persist($user);
            $this->em->flush();
        }
    }

    public function updateLanguage($userId, $language)
    {
        $userRepository = $this->em->getRepository("Twake\Users:User");

        $user = $userRepository->find($userId);

        if ($user != null) {

            $user->setLanguage($language);
            $this->em->persist($user);
            $this->em->flush();

            if ($userId) {
                $datatopush = Array(
                    "type" => "LANGUAGE"
                );
                $this->pusher->push($datatopush, "notifications/" . $userId);
            }

        }
    }

    public function setIsNew($value, $userId)
    {
        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->find($userId);

        if ($user != null) {

            $user->setisNew($value);
            $this->em->persist($user);
            $this->em->flush();

        }
    }

    public function updateNotificationPreferenceByWorkspace($workspaceId, $appNotif, $user)
    {
        /* @var \Twake\Users\Entity\User $user */
        $pref = $user->getNotificationPreference();

        $pref["workspace"][$workspaceId . ""] = $appNotif;

        $user->setNotificationPreference($pref);

        $this->em->persist($user);
        $this->em->flush();

        return true;
    }

    public function setTutorialStatus($userId, $status)
    {
        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->find($userId);

        if ($user != null) {
            $user->setTutorialStatus($status);
            $this->em->persist($user);
            $this->em->flush();
        }

        return true;
    }

    public function updateTimezone($user, $timezone = false)
    {
        if ($user && $timezone !== false) {
            if ($user->getTimezone() != intval($timezone)) {
                $user->setTimezone(intval($timezone) . "");
                $this->em->persist($user);
                $this->em->flush();
            }
        }
    }

    public function removeUserByUsername($username)
    {
        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->findOneBy(Array("usernamecanonical" => $username));

        if (!$user) {
            return false;
        }

        $this->removeLinkedToUserRows("Twake\Users:Device", $user, "user_id");
        $this->removeLinkedToUserRows("Twake\Users:Mail", $user, "user_id");

        $this->removeLinkedToUserRows("Twake\Workspaces:WorkspaceUser", $user, "user");
        $this->removeLinkedToUserRows("Twake\Workspaces:GroupUser", $user, "user");
        $this->removeLinkedToUserRows("Twake\Workspaces:Workspace", $user, "user");

        $this->em->remove($user);
        $this->em->flush();

        return true;

    }

    private function removeLinkedToUserRows($entity, $user, $col = "user")
    {
        $repo = $this->em->getRepository($entity);
        $toRemove = $repo->findBy(Array($col => $user));
        foreach ($toRemove as $r) {
            $this->em->remove($r);
        }
    }

    

}
