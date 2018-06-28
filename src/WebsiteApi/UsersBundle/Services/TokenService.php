<?php

namespace WebsiteApi\UsersBundle\Services;
use Google_Client;
use Google_Service_Drive;
use WebsiteApi\UsersBundle\Entity\Token;
use WebsiteApi\UsersBundle\Model\TokenServiceInterface;

class TokenService implements TokenServiceInterface
{
	protected $doctrine;

	public function __construct($doctrine)
	{
		$this->doctrine = $doctrine;
	}

    private function convertToEntity($var, $repository)
    {
        if (is_string($var)) {
            $var = intval($var);
        }

        if (is_int($var)) {
            return $this->doctrine->getRepository($repository)->find($var);
        } else if (is_object($var)) {
            return $var;
        } else {
            return null;
        }

    }


    public function refreshToken(Token $newUserToken)
    {
        $this->doctrine->persist($newUserToken);
        $this->doctrine->flush();
    }

    public function getGDriveClient(){
        $client = new Google_Client();
        $redirectionUrl = "http://localhost:8080/ajax/drive/gdrive/fetchAccessTokenWithAuthCode";
        $client->setRedirectUri($redirectionUrl);
        $client->setApplicationName('Twake');
        $client->setScopes(Google_Service_Drive::DRIVE);
        $client->setAuthConfig('../client_secret.json');
        $client->setAccessType('offline');

        return $client;
    }

    public function requestNewTokenUrlForGDrive(){
        $client = $this->getGDriveClient();
        $client->setApprovalPrompt("force");
        return $client->createAuthUrl();
    }

    public function requestNewTokenFromAuthCodeForGDrive($authCode, $user){
        $accessToken = $this->getGDriveClient()->fetchAccessTokenWithAuthCode($authCode);
        $user = $this->convertToEntity($user,"TwakeUsersBundle:User");
        $userToken = new Token($accessToken, $user,"google drive");
        return $userToken;
    }

    public function updateEmptyTokenWithAuthCode($authCode,$user, $externalDriveName){
        $client = $this->getGDriveClient();
        $accessToken = $client->fetchAccessTokenWithAuthCode($authCode);
        $user = $this->convertToEntity($user,"TwakeUsersBundle:User");
        $userToken = $this->doctrine->getRepository("TwakeUsersBundle:Token")->findOneBy(Array("user" => $user, "token" => null, "externalServiceName" => $externalDriveName));
	    $userToken->setToken($accessToken);
        $this->refreshToken($userToken);
        return $userToken;
    }

    public function makeNewEmptyToken($user, $externalDriveName){
        $user = $this->convertToEntity($user,"TwakeUsersBundle:User");
        $userToken = new Token(null, $user,$externalDriveName);
        $this->doctrine->persist($userToken);
        $this->doctrine->flush();
        return $userToken;
    }
    public function getEmptyToken($user, $externalDriveName){
        $user = $this->convertToEntity($user,"TwakeUsersBundle:User");
        $userToken = $this->doctrine->getRepository("TwakeUsersBundle:Token")->findOneBy(Array("user" => $user, "token" => null, "externalServiceName" => $externalDriveName));
	    return $userToken;
    }
}