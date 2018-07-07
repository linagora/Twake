<?php


namespace WebsiteApi\DriveBundle\Services;

use AESCryptFileLib;
use MCryptAES256Implementation;
use WebsiteApi\DriveBundle\Entity\DriveLabel;
use WebsiteApi\DriveBundle\Entity\UserToNotify;

class UserToNotifyService
{

    var $doctrine;
    /* @var DriveFileSystemGDrive $externalDriveFileSystem */
    var $externalDriveFileSystem;
    /* @var \WebsiteApi\DriveBundle\Services\DriveActivities $driveActivities */
    var $driveActivities;

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

    public function __construct($doctrine, $externalDriveFileSystem, $driveActivities)
    {
        $this->doctrine = $doctrine;
        $this->externalDriveFileSystem = $externalDriveFileSystem;
        $this->driveActivities = $driveActivities;
    }

    public function get($driveFile)
    {
        $UsersToNotifyRepository = $this->doctrine->getRepository("TwakeDriveBundle:UserToNotify");
        return $UsersToNotifyRepository->findBy(Array("driveFile" => $driveFile));
    }

    public function setUsersList($driveFile, $rootDirectory, $usersList)
    {
        $driveFile = strval($driveFile);
        $additionalData = $this->getAdditionalData($driveFile);
        $userToNotifyRepo = $this->doctrine->getRepository("TwakeDriveBundle:UserToNotify");
        $userToNotifyRepo->deleteByDriveFile($driveFile);

        $driveType = $this->externalDriveFileSystem->getDriveType($rootDirectory);

        if($driveType == "gdrive") {
            if (count($usersList) == 0)
                $additionalData = $this->externalDriveFileSystem->unwatchFile($driveFile, $rootDirectory,$additionalData);
            else
                $additionalData = $this->externalDriveFileSystem->watchFile($driveFile, $rootDirectory,$additionalData);

            //$this->updateAdditionalData($driveFile,$additionalData);
        }


        foreach ($usersList as $user) {
            $user = $this->convertToEntity($user, "TwakeUsersBundle:User");
            $userToNotify = $userToNotifyRepo->findOneBy(Array("user" => $user, "driveFile" => $driveFile));

            if (!$userToNotify || $userToNotify == null)
                $userToNotify = new UserToNotify($user, $driveFile,$driveType);

            $userToNotify->setAdditionalData($additionalData);

            $this->doctrine->persist($userToNotify);
        }

        $this->doctrine->flush();
    }

    public function notifyUsers($driveFile, $workspace, $title = "Drive", $text= "", $fileId = null){
        $driveFile = strval($driveFile);

        $workspace = $this->convertToEntity($workspace,"TwakeWorkspacesBundle:Workspace");
        $userToNotifyRepo = $this->doctrine->getRepository("TwakeDriveBundle:UserToNotify");

        $usersToNotify = $userToNotifyRepo->findBy(Array("driveFile" => $driveFile));

        if($fileId==null)
            $fileId="";
        else
            $fileId = "/".$fileId;

        if(!$usersToNotify)
            return false;
        foreach ($usersToNotify as $userToNotify){
            $this->driveActivities->pushActivity(true,$workspace, $userToNotify->getUser(),null,$title,$text,Array(),Array("notifCode" => $userToNotify->getDriveType()."/".$driveFile.$fileId));
        }
        return true;
    }

    public function getAdditionalData($driveFile)
    {
        $userToNotifyRepo = $this->doctrine->getRepository("TwakeDriveBundle:UserToNotify");

        $usersToNotify = $userToNotifyRepo->findBy(Array("driveFile" => $driveFile));

        if(count($usersToNotify)==0)
            return Array();

        return $usersToNotify[0]->getAdditionalData();
    }

    public function updateAdditionalData($driveFile, $additionalData)
    {
        $userToNotifyRepo = $this->doctrine->getRepository("TwakeDriveBundle:UserToNotify");

        $usersToNotify = $userToNotifyRepo->findBy(Array("driveFile" => $driveFile));
        foreach ($usersToNotify as $userToNotify){
            $userToNotify->setAdditionalDatta($additionalData);
            $this->doctrine->persist($userToNotify);
        }
        $this->doctrine->flush();
    }
}
