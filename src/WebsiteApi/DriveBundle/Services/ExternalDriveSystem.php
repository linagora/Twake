<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 26/06/18
 * Time: 17:32
 */

namespace WebsiteApi\DriveBundle\Services;


use WebsiteApi\DriveBundle\Entity\ExternalDrive;

class ExternalDriveSystem
{

    var $doctrine;
    var $token_service;


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

    public function __construct($doctrine, $token_service)
    {
        $this->doctrine = $doctrine;
        $this->token_service = $token_service;
    }

    public function getTokenFromFileId($fileId){
        $externalDriveRepository = $this->doctrine->getRepository("TwakeDrievBundle:ExternalDrive");
        $externalDrive = $externalDriveRepository->findOneBy(Array("fileId" => $fileId));

        if(!$externalDrive)
            return false;

        return $externalDrive->getExternalToken();
    }

    public function addNewGDrive($folderId, $user, $workspace){
        $user = $this->convertToEntity($user,"TwakeUsersBundle:User");
        $workspace = $this->convertToEntity($workspace,"TwakeWorkspacesBundle:Workspace");


        //TODO : vérfier si un token existant permet déjà l'accès au nouveau dossier
        $redirectionUrl = "http://localhost:8080/ajax/drive/gdrive/fetchAccessTokenWithAuthCode";
        $authUrl = $this->token_service->requestNewTokenUrlForGDrive($redirectionUrl);

        $emptyUserToken = $this->token_service->makeNewEmptyToken($user,"google drive");
        $externalDrive = new ExternalDrive($folderId,$emptyUserToken,$workspace);

        $this->doctrine->persist($externalDrive);
        $this->doctrine->flush();

        return $authUrl;
    }

    public function completeAddingNewGDrive($authCode, $user){
        $userToken = $this->token_service->getEmptyToken($user,"google drive");
        $externalDrive = $this->doctrine->getrepository("TwakeDriveBundle:ExternalDrive")->findOneBy(Array("externalToken" => $userToken, "completed" => false));

        $externalDrive->setCompleted(true);
        $redirectionUrl = "http://localhost:8080/ajax/drive/gdrive/fetchAccessTokenWithAuthCode";
        $this->token_service->updateEmptyTokenWithAuthCode($authCode,$user,"google drive",$redirectionUrl);

        $this->doctrine->persist($externalDrive);
        $this->doctrine->flush();
    }
}