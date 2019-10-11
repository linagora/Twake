<?php

namespace WebsiteApi\UsersBundle\Services;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Http\Event\InteractiveLoginEvent;
use WebsiteApi\CoreBundle\Services\Translate;
use WebsiteApi\UsersBundle\Entity\Device;
use WebsiteApi\UsersBundle\Entity\Mail;
use WebsiteApi\UsersBundle\Entity\VerificationNumberMail;
use WebsiteApi\UsersBundle\Model\UserInterface;

/**
 * This service is responsible for subscribtions, unsubscribtions, request for new password
 */
class User
{

    private $em;
    private $pusher;
    private $encoder_factory;
    private $authorization_checker;
    private $core_remember_me_manager;
    private $event_dispatcher;
    private $request_stack;
    private $twake_mailer;
    private $string_cleaner;
    private $token_storage;
    private $workspace_members_service;
    private $group_service;
    private $workspace_service;
    private $pricing_plan;
    private $restClient;
    private $circle;
    /* @var Translate $translate */
    var $translate;
    private $standalone;
    private $licenceKey;


    public function __construct($em, $pusher, $encoder_factory, $authorization_checker, $token_storage, $core_remember_me_manager, $event_dispatcher, $request_stack, $twake_mailer, $string_cleaner, $workspace_members_service, $group_service, $workspace_service, $pricing_plan, $restClient, $translate, $standalone, $licenceKey)
    {
        $this->em = $em;
        $this->pusher = $pusher;
        $this->encoder_factory = $encoder_factory;
        $this->core_remember_me_manager = $core_remember_me_manager;
        $this->event_dispatcher = $event_dispatcher;
        $this->request_stack = $request_stack;
        $this->twake_mailer = $twake_mailer;
        $this->string_cleaner = $string_cleaner;
        $this->authorization_checker = $authorization_checker;
        $this->token_storage = $token_storage;
        $this->workspace_members_service = $workspace_members_service;
        $this->group_service = $group_service;
        $this->workspace_service = $workspace_service;
        $this->pricing_plan = $pricing_plan;
        $this->restClient = $restClient;
        $this->translate = $translate;
        $this->standalone = $standalone;
        $this->licenceKey = $licenceKey;
    }

    public function current()
    {
        $securityContext = $this->authorization_checker;

        if ($securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            return true;
        }

        return false;
    }

    public function alive($userId)
    {
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");

        $user = $userRepository->find($userId);

        if ($user != null) {
            $user->isActive();
            $this->em->persist($user);
            $this->em->flush();

        }
    }

    public function loginWithUsernameOnly($usernameOrMail)
    {

        $usernameOrMail = trim(strtolower($usernameOrMail));


        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
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

        // User log in
        $token = new UsernamePasswordToken($user, null, "main", $user->getRoles());
        $this->token_storage->setToken($token);

        $request = $this->request_stack->getCurrentRequest();
        if ($request) {
            $event = new InteractiveLoginEvent($request, $token);
            $this->event_dispatcher->dispatch("security.interactive_login", $event);
        }

        return $user;

    }

    public function login($usernameOrMail, $password, $rememberMe = false, $request = null, $response = null)
    {

        $usernameOrMail = trim(strtolower($usernameOrMail));

        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");

        $user = $userRepository->findOneBy(Array("usernamecanonical" => $this->string_cleaner->simplifyUsername($usernameOrMail)));

        if ($user == null) {
            $user = $userRepository->findOneBy(Array("emailcanonical" => $this->string_cleaner->simplifyMail($usernameOrMail)));
        }

        if ($user == null) {
            return false;
        }

        $passwordValid = $this->encoder_factory
            ->getEncoder($user)
            ->isPasswordValid($user->getPassword(), $password, $user->getSalt());

        if ($passwordValid && !$user->getBanned() && $user->getMailVerifiedExtended()) {

            // User log in
            $token = new UsernamePasswordToken($user, null, "main", $user->getRoles());
            if ($rememberMe && $request && $response) {
                $this->core_remember_me_manager->doRemember($request, $response, $token);
            }
            $this->token_storage->setToken($token);

            $request = $this->request_stack->getCurrentRequest();
            if ($request) {
                $event = new InteractiveLoginEvent($request, $token);
                $this->event_dispatcher->dispatch("security.interactive_login", $event);
            }

            return $user;

        }

        return false;

    }

    public function logout()
    {
        $response = new Response();
        $response->headers->clearCookie('REMEMBERME');
        $response->sendHeaders();

        $this->token_storage->setToken(null);

        $request = $this->request_stack->getCurrentRequest();
        if ($request) {
            $request->getSession()->invalidate();
        }

        (new Session())->invalidate();

        return true;
    }

    public function ban($userId)
    {
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->find($userId);
        $user->setBanned(true);
        $this->em->persist($user);
        $this->em->flush();
    }

    public function unban($userId)
    {
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->find($userId);
        $user->setBanned(false);
        $this->em->persist($user);
        $this->em->flush();
    }

    public function requestNewPassword($mail)
    {

        $mail = $this->string_cleaner->simplifyMail($mail);

        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        /* @var \WebsiteApi\UsersBundle\Entity\User $user */
        $user = $userRepository->findOneBy(Array("emailcanonical" => $mail));
        if ($user != null) {
            $verificationNumberMail = new VerificationNumberMail($mail);

            $code = $verificationNumberMail->getCode();

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
        $verificationRepository = $this->em->getRepository("TwakeUsersBundle:VerificationNumberMail");
        $ticket = $verificationRepository->findOneBy(Array("token" => $token));

        if ($ticket != null) {
            return $ticket->verifyCode($code);
        }

        return false;
    }

    public function setNewPasswordAfterNewPasswordRequest($token, $code, $password)
    {

        $verificationRepository = $this->em->getRepository("TwakeUsersBundle:VerificationNumberMail");
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $ticket = $verificationRepository->findOneBy(Array("token" => $token));
        $factory = $this->encoder_factory;

        if ($ticket != null) {
            if ($ticket->verifyCode($code)) {
                $user = $userRepository->findOneBy(Array("emailcanonical" => $ticket->getMail()));
                if ($user != null) {

                    $encoder = $factory->getEncoder($user);
                    $user->setPassword($encoder->encodePassword($password, $user->getSalt()));

                    $token = new UsernamePasswordToken($user, null, "main", $user->getRoles());
                    $this->token_storage->setToken($token);

                    $request = $this->request_stack->getCurrentRequest();
                    $event = new InteractiveLoginEvent($request, $token);
                    $this->event_dispatcher->dispatch("security.interactive_login", $event);

                    $this->em->remove($ticket);
                    $this->em->persist($user);
                    $this->em->flush();

                    return true;
                }
            }
        }

        return false;
    }

    public function getAvaibleMailPseudo($mail, $pseudo)
    {
        $mail = $this->string_cleaner->simplifyMail($mail);
        $pseudo = $this->string_cleaner->simplifyUsername($pseudo);
        $retour = Array();

        if (!$this->string_cleaner->verifyMail($mail)) {
            $retour[] = -1;
        } else {

            //Check user doesn't exists
            $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
            $user = $userRepository->findOneBy(Array("emailcanonical" => $mail));
            //Check mail doesn't exists
            $mailsRepository = $this->em->getRepository("TwakeUsersBundle:Mail");
            $mailExists = $mailsRepository->findOneBy(Array("mail" => $mail));

            if (($user != null && $user->getMailVerifiedExtended($mail, $pseudo)) || $mailExists != null) {
                $retour[] = -1;
            }

            //Check pseudo doesn't exists
            $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
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

    public function verifyReCaptchaAction($recaptcha, $client_ip)
    {

        if ($recaptcha == "phone_app_no_verification") {
            return true;
        }

        //[REMOVE_ONPREMISE]

        $secret = "6LeXo1oUAAAAACHfOq50_H9n5W56_5rQycvT_IaZ";

        $api_url = "https://www.google.com/recaptcha/api/siteverify?secret="
            . $secret
            . "&response=" . $recaptcha
            . "&remoteip=" . $client_ip;

        $decode = json_decode(file_get_contents($api_url), true);

        if (isset($decode["success"])) {
            return true;
        }

        //[/REMOVE_ONPREMISE]

        return false;

    }

    public function testRecaptcha($recaptcha)
    {
        if ($this->standalone) {

            return $this->verifyReCaptchaAction($recaptcha, $_SERVER['REMOTE_ADDR']);

        } else {

            $masterServer = "https://app.twakeapp.com/api/remote";
            $data = Array(
                "licenceKey" => $this->licenceKey,
                "client_ip" => $_SERVER['REMOTE_ADDR'],
                "recaptcha" => $recaptcha
            );
            $result = $this->restClient->post($masterServer . "/recaptcha", json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 60, CURLOPT_HTTPHEADER => ['Content-Type: application/json']));
            $result = json_decode($result->getContent(), true);

            if (isset($result["status"])) {
                return $result["status"];
            }
            return false;

        }

    }

    public function subscribeInfo($mail, $password, $pseudo, $firstName, $lastName, $phone, $recaptcha, $language, $origin = "", $force = false)
    {
        $mail = $this->string_cleaner->simplifyMail($mail);
        $pseudo = $this->string_cleaner->simplifyUsername($pseudo);

        $avaible = $this->getAvaibleMailPseudo($mail, $pseudo);
        if (is_bool($avaible) && !$avaible) {
            return $avaible;
        }
        if ($mail == null || $password == null || $pseudo == null || !filter_var($mail, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        if (!($force || $this->testRecaptcha($recaptcha))) {
            return false;
        }

        $token = $this->subscribeMail($mail, $pseudo, $password, $lastName, $firstName, $phone, $language, false, false);
        $user = $this->verifyMail($mail, $token, "", true);
        if ($user == null || $user == false) {
            return false;
        }
        $user->setFirstName($firstName);
        $user->setLastName($lastName);
        $user->setPhone($phone);
        $user->setLanguage($language);
        $user->setCreationDate(new \DateTime());
        $user->setOrigin($origin);
        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }

    public function createCompanyUser($mail, $fullname, $password, $language, $workspace_id, $current_user_id)
    {

        $pseudo = explode("@", $mail)[0] . "_" . date("U");
        $firstname = explode(" ", $fullname)[0];
        $lastname = explode(" ", $fullname . " ")[1];
        $override_key = $workspace_id . "_" . $current_user_id;

        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->findOneBy(Array("emailcanonical" => $mail));
        if ($user != null) {
            if ($user->getMailVerified() || $user->getMailVerificationOverride() != $override_key) {
                return ["error" => "mailalreadytaken"];
            } else if (!$user->getMailVerified() && $user->getMailVerificationOverride() == $override_key) {

                $user->setSalt(bin2hex(random_bytes(40)));
                $factory = $this->encoder_factory;
                $encoder = $factory->getEncoder($user);
                $user->setPassword($encoder->encodePassword($password, $user->getSalt()));
                $user->setUsername($pseudo);

                $this->em->persist($user);
                $this->em->flush();

                return true;

            } else {
                return ["error" => "mailalreadytaken"];
            }
        }
        $mailsRepository = $this->em->getRepository("TwakeUsersBundle:Mail");
        $mailExists = $mailsRepository->findOneBy(Array("mail" => $mail));
        if ($mailExists != null) {
            return ["error" => "mailalreadytaken"];
        }
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->findOneBy(Array("usernamecanonical" => $pseudo));
        if ($user != null && $user->getMailVerified()) {
            return ["error" => "usernamealreadytaken"];
        }

        $user = new \WebsiteApi\UsersBundle\Entity\User();
        $user->setSalt(bin2hex(random_bytes(40)));
        $factory = $this->encoder_factory;
        $encoder = $factory->getEncoder($user);
        $user->setPassword($encoder->encodePassword($password, $user->getSalt()));
        $user->setUsername($pseudo);
        $user->setEmail($mail);
        $user->setFirstName($firstname);
        $user->setLastName($lastname);
        $user->setPhone("");
        $user->setLanguage($language ? $language : "en");
        $user->setMailVerificationOverride($override_key);
        $this->em->persist($user);

        return true;

    }

    public function subscribeMail($mail, $pseudo, $password, $name, $firstname, $phone, $language, $newsletter = false, $sendEmail = true)
    {

        $pseudo = $this->string_cleaner->simplifyUsername($pseudo);

        //Check pseudo doesn't exists
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->findOneBy(Array("usernamecanonical" => $pseudo));
        if ($user != null && $user->getMailVerifiedExtended($mail, $pseudo)) {
            return ["error" => "usernamealreadytaken"];
        }

        $mail = $this->string_cleaner->simplifyMail($mail);

        if (!$this->string_cleaner->verifyMail($mail)) {
            return ["error" => "mailalreadytaken"];
        }

        //Check mail doesn't exists
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->findOneBy(Array("emailcanonical" => $mail));
        if ($user != null && $user->getMailVerifiedExtended($mail, $pseudo)) {
            return ["error" => "mailalreadytaken"];
        }
        $mailsRepository = $this->em->getRepository("TwakeUsersBundle:Mail");
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

        $verificationNumberMail = new VerificationNumberMail($mail);
        $code = $verificationNumberMail->getCode();
        $this->em->persist($verificationNumberMail);

        $magic_link = "?verify_mail=1&m=" . $mail . "&c=" . $code . "&token=" . $verificationNumberMail->getToken();

        if ($sendEmail) {
            $this->twake_mailer->send($mail, "subscribeMail", Array("_language" => $user ? $user->getLanguage() : "en", "code" => $code, "magic_link" => $magic_link));
        }

        //Create the temporary user
        $user = new \WebsiteApi\UsersBundle\Entity\User();
        $user->setSalt(bin2hex(random_bytes(40)));
        $factory = $this->encoder_factory;
        $encoder = $factory->getEncoder($user);
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
                $data = Array(
                    "Email" => $mail,
                    "Properties" => Array(
                        "first_name" => $firstname,
                        "last_name" => $name,
                        "language" => $language,
                    ),
                    "Action" => "addforce"
                );
                $this->restClient->post("https://api.mailjet.com/v3/REST/contactslist/2345487/managecontact", json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 60, CURLOPT_USERPWD => "370c5b74b337ff3cb1e455482213ffcc" . ":" . "2eb996d709315055fefb96901762ad0c"));
            } catch (\Exception $exception) {
                error_log($exception->getMessage());
            }
        }
        if ($newsletter) {
            try {
                $data = Array(
                    "Email" => $mail,
                    "Properties" => Array(
                        "first_name" => $firstname,
                        "last_name" => $name,
                        "language" => $language,
                    ),
                    "Action" => "addforce"
                );
                $this->restClient->post("https://api.mailjet.com/v3/REST/contactslist/2345532/managecontact", json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 60, CURLOPT_USERPWD => "370c5b74b337ff3cb1e455482213ffcc" . ":" . "2eb996d709315055fefb96901762ad0c"));
            } catch (\Exception $exception) {
                error_log($exception->getMessage());
            }
        }
        return $verificationNumberMail->getToken();
    }

    public function verifyMail($mail, $token, $code, $force = false, $response = null)
    {

        $mail = trim(strtolower($mail));

        $verificationRepository = $this->em->getRepository("TwakeUsersBundle:VerificationNumberMail");
        $ticket = $verificationRepository->findOneBy(Array("token" => $token));
        if (($ticket != null && $ticket->verifyCode($code) && $ticket->getMail($mail)) || $force) {

            if ($ticket) {
                $ticket->setVerified(true);
                $this->em->persist($ticket);
                $this->em->flush();
            }

            $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
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
                $mailObj->setUser($user);

                $this->em->persist($mailObj);

                $this->em->flush();

                $this->workspace_members_service->autoAddMemberByNewMail($mail, $user->getId());


                // User auto log in
                $token = new UsernamePasswordToken($user, null, "main", $user->getRoles());
                $request = $this->request_stack->getCurrentRequest();
                if ($request && $response) {
                    $this->core_remember_me_manager->doRemember($request, $response, $token);
                    $this->token_storage->setToken($token);
                    $event = new InteractiveLoginEvent($request, $token);
                    $this->event_dispatcher->dispatch("security.interactive_login", $event);
                }

            }

            return true;
        }
        return false;
    }

    public function checkPassword($userId, $password)
    {
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");

        $user = $userRepository->find($userId);

        if ($user == null) {
            return false;
        }

        $passwordValid = $this->encoder_factory
            ->getEncoder($user)
            ->isPasswordValid($user->getPassword(), $password, $user->getSalt());

        $res = false;
        if ($passwordValid) {
            $res = true;
        }
        return $res;
    }

    public function addDevice($userId, $type, $value, $version = "?")
    {
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $devicesRepository = $this->em->getRepository("TwakeUsersBundle:Device");
        $user = $userRepository->find($userId);

        $res = false;
        if ($user != null) {
            $device = $devicesRepository->findOneBy(Array("value" => $value));
            if (!$device) {
                $newDevice = new Device($user, $type, $value, $version);
            } else if ($device->getUser() != $user) {
                $this->em->remove($device);
                $newDevice = new Device($user, $type, $value, $version);
            } else {
                $newDevice = $device;
                $device->setVersion($version);
            }

            $this->em->persist($newDevice);
            $this->em->flush();

            $res = true;
        }

        return $res;

    }

    public function removeDevice($userId, $type, $value)
    {
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $devicesRepository = $this->em->getRepository("TwakeUsersBundle:Device");
        $user = $userRepository->find($userId);

        $res = false;
        if ($user != null) {
            $device = $devicesRepository->findOneBy(Array("value" => $value));
            if ($device && $device->getUser()->getId() == $userId) {
                $this->em->remove($device);
                $this->em->flush();
            }
            $res = true;
        }

        return $res;
    }

    public function getSecondaryMails($userId)
    {

        $mailRepository = $this->em->getRepository("TwakeUsersBundle:Mail");
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->find($userId);

        return $mailRepository->findBy(Array("user" => $user));

    }

    public function addNewMail($userId, $mail)
    {

        $mail = $this->string_cleaner->simplifyMail($mail);

        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $mailRepository = $this->em->getRepository("TwakeUsersBundle:Mail");
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


        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $mailRepository = $this->em->getRepository("TwakeUsersBundle:Mail");
        $user = $userRepository->find($userId);

        $res = false;

        if ($user != null) {
            $mail = $mailRepository->findOneBy(Array("id" => $mailId));
            if ($mail && $mail->getUser()->getId() == $userId) {
                $this->em->remove($mail);
                $this->em->flush();
                $res = true;
            }

        }

        return $res;
    }

    public function checkNumberForAddNewMail($userId, $token, $code)
    {

        $verificationRepository = $this->em->getRepository("TwakeUsersBundle:VerificationNumberMail");
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $mailRepository = $this->em->getRepository("TwakeUsersBundle:Mail");
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
                        $mail->setUser($user);

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

        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->find($userId);
        $factory = $this->encoder_factory;
        if ($user != null) {

            $passwordValid = $factory
                ->getEncoder($user)
                ->isPasswordValid($user->getPassword(), $oldPassword, $user->getSalt());

            if ($passwordValid) {

                $encoder = $factory->getEncoder($user);
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

        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
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


        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $mailRepository = $this->em->getRepository("TwakeUsersBundle:Mail");

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
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");

        $user = $userRepository->find($userId);

        if ($user != null) {

            $user->setFirstName($firstName);
            $user->setLastName($lastName);
            if ($thumbnail == 'false' || $thumbnail == 'null') {
                $user->setThumbnail(null);
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
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");

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
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");

        $user = $userRepository->find($userId);

        if ($user != null) {
            return $user->getNotificationPreference();
        }

        return false;

    }

    public function setWorkspacesPreferences($userId, $preferences)
    {
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->find($userId);
        if ($user != null) {
            $user->setWorkspacesPreference($preferences);
            $this->em->persist($user);
            $this->em->flush();
        }
    }

    public function updateStatus($userId, $status)
    {
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->find($userId);
        if ($user != null) {
            $user->setStatusIcon($status);
            $this->em->persist($user);
            $this->em->flush();
        }
    }

    public function updateLanguage($userId, $language)
    {
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");

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
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->find($userId);

        if ($user != null) {

            $user->setisNew($value);
            $this->em->persist($user);
            $this->em->flush();

        }
    }

    public function updateNotificationPreferenceByWorkspace($workspaceId, $appNotif, $user)
    {
        /* @var \WebsiteApi\UsersBundle\Entity\User $user */
        $pref = $user->getNotificationPreference();

        $pref["workspace"][$workspaceId . ""] = $appNotif;

        $user->setNotificationPreference($pref);

        $this->em->persist($user);
        $this->em->flush();

        return true;
    }

    public function setTutorialStatus($userId, $status)
    {
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
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

    private function removeLinkedToUserRows($entity, $user, $col = "user")
    {
        $repo = $this->em->getRepository($entity);
        $toRemove = $repo->findBy(Array($col => $user));
        foreach ($toRemove as $r) {
            $this->em->remove($r);
        }
    }

    public function removeUserByUsername($username)
    {
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->findOneBy(Array("usernamecanonical" => $username));

        if (!$user) {
            return false;
        }

        $this->removeLinkedToUserRows("TwakeUsersBundle:Device", $user, "user");
        $this->removeLinkedToUserRows("TwakeUsersBundle:Contact", $user, "from");
        $this->removeLinkedToUserRows("TwakeUsersBundle:Contact", $user, "to");
        $this->removeLinkedToUserRows("TwakeUsersBundle:Mail", $user, "user");
        $this->removeLinkedToUserRows("TwakeUsersBundle:Token", $user, "user");
        $this->removeLinkedToUserRows("TwakeUsersBundle:UserStats", $user, "user");

        $this->removeLinkedToUserRows("TwakeWorkspacesBundle:WorkspaceUser", $user, "user");
        $this->removeLinkedToUserRows("TwakeWorkspacesBundle:GroupUser", $user, "user");
        $this->removeLinkedToUserRows("TwakeWorkspacesBundle:Workspace", $user, "user");

        $this->em->remove($user);
        $this->em->flush();

        return true;

    }

}
