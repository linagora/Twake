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

        if (is_int($var) || get_class($var) == "Cassandra\Timeuuid") {
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
        $client->setApplicationName('Twake Drive');
        $client->setScopes(Google_Service_Drive::DRIVE);
        $client->setAuthConfig('../app/Ressources/Apis/client_secret.json');
        $client->setAccessType('offline');

        return $client;
    }
    private function base64UrlEncode($inputStr)
    {
        return strtr(base64_encode($inputStr), '+/=', '-_,');
    }

    public function requestNewTokenUrlForGDrive($workspaceId, $fileId){
        $client = $this->getGDriveClient();
        $client->setApprovalPrompt("force");
        $state = $this->base64UrlEncode(json_encode(array('fileId' => $fileId, 'workspaceId' => $workspaceId),true));
        $client->setState($state);
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

    public function deleteToken(Token $userToken){
        $this->doctrine->getRepository("TwakeUsersBundle:Token")->deleteToken($userToken);
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

    public function newToken($authCode, $user){
        $accessToken = $this->getGDriveClient()->fetchAccessTokenWithAuthCode($authCode);
        $userToken = new Token($accessToken, $user,"google drive");

        $this->doctrine->persist($userToken);
        $this->doctrine->flush();
        return $userToken;
    }
}