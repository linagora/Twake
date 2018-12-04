<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 26/06/18
 * Time: 17:32
 */

namespace WebsiteApi\DriveBundle\Services;


use WebsiteApi\DriveBundle\Entity\ExternalDrive;
use WebsiteApi\UsersBundle\Entity\Token;

class ExternalDriveSystem
{
    var $doctrine;
    var $token_service;
    var $gdriveApi;


    private function convertToEntity($var, $repository)
    {
        if (is_string($var)) {
            $var = $var; // Cassandra id do nothing
        }

        if (is_int($var) || is_string($var)) {
            return $this->doctrine->getRepository($repository)->find($var);
        } else if (is_object($var)) {
            return $var;
        } else {
            return null;
        }
    }

    public function __construct($doctrine, $token_service, $gdriveApi)
    {
        $this->doctrine = $doctrine;
        $this->token_service = $token_service;
        $this->gdriveApi = $gdriveApi;
    }

    public function setRootDirectory($directory){
        $this->rootDirectory = $directory;
    }

    public function getTokenFromFileId($fileId){
        $externalDriveRepository = $this->doctrine->getRepository("TwakeDriveBundle:ExternalDrive");
        $externalDrive = $externalDriveRepository->findOneBy(Array("fileId" => $fileId));

        if(!$externalDrive)
            return false;

        return $externalDrive->getExternalToken();
    }

    public function isAValideRootDirectory($directory){
        $externalDriveRepository = $this->doctrine->getRepository("TwakeDriveBundle:ExternalDrive");
        $externalDrive = $externalDriveRepository->findOneBy(Array("fileId" => $directory));
        return $externalDrive;
    }

    public function addNewGDrive($folderId, $user, $workspace){
        $user = $this->convertToEntity($user,"TwakeUsersBundle:User");
        $workspace = $this->convertToEntity($workspace,"TwakeWorkspacesBundle:Workspace");

        $authUrl = $this->token_service->requestNewTokenUrlForGDrive($workspace->getId(),$folderId);
        return $authUrl;
    }

    public function completeAddingNewGDrive($authCode, $user){
        $userToken = $this->token_service->getEmptyToken($user,"google drive");
        $externalDrive = $this->doctrine->getrepository("TwakeDriveBundle:ExternalDrive")->findOneBy(Array("externalToken" => $userToken, "completed" => false));

        $externalDrive->setCompleted(true);
        $this->token_service->updateEmptyTokenWithAuthCode($authCode,$user,"google drive");

        if($externalDrive->getFileId()=="root")
            $externalDrive->setFileId($this->gdriveApi->getGDriveBasicInfo("root",$userToken)["id"]);

        $this->doctrine->persist($externalDrive);
        $this->doctrine->flush();
    }

    public function getExternalDrives($workspace, $completed = true){
        $workspace = $this->convertToEntity($workspace,"TwakeWorkspacesBundle:Workspace");

        $externalDrives = $this->doctrine->getRepository("TwakeDriveBundle:ExternalDrive")->findBy(Array("workspace" => $workspace, "completed" => $completed));

        return $externalDrives;
    }

    public function addNewExternalDrive($fileId, $workspace, $authCode, $user)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");
        $user = $this->convertToEntity($user, "TwakeUsersBundle:User");

        $token = $this->token_service->newToken($authCode, $user);

        if($fileId=='root'){
            $fileId = $this->gdriveApi->getGDriveBasicInfo("root",$token)["id"];
        }

        var_dump($this->gdriveApi->getHaveAccessTo($fileId,$token));
        if($this->gdriveApi->getHaveAccessTo($fileId,$token))
            $externalDrive = $this->doctrine->getRepository("TwakeDriveBundle:ExternalDrive")->findBy(Array("fileId" => $fileId));
        else
            $externalDrive = true;

        if($externalDrive) {
            $this->token_service->deleteToken($token);
            return false;
        }


        $externalDrive = new ExternalDrive($fileId, $token, $workspace);

        $externalDrive->setCompleted(true);

        $this->doctrine->persist($externalDrive);
        $this->doctrine->flush();

        return true;
    }
}