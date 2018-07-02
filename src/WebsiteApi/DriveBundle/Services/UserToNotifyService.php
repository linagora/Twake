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
        $userToNotifyRepo = $this->doctrine->getRepository("TwakeDriveBundle:UserToNotify");
        $userToNotifyRepo->deleteByDriveFile($driveFile);

        if (count($usersList) == 0 && $rootDirectory != 0)
            $this->externalDriveFileSystem->unwatchFile($driveFile, $rootDirectory);
        else
            $this->externalDriveFileSystem->watchFile($driveFile, $rootDirectory);

        $driveType = $this->externalDriveFileSystem->getDriveType($driveFile);

        foreach ($usersList as $user) {
            $user = $this->convertToEntity($user, "TwakeUsersBundle:User");
            $userToNotify = $userToNotifyRepo->findOneBy(Array("user" => $user, "driveFile" => $driveFile));

            if (!$userToNotify || $userToNotify == null)
                $userToNotify = new UserToNotify($user, $driveFile,$driveType);

            $this->doctrine->persist($userToNotify);
        }

        $this->doctrine->flush();
    }

    public function notifyUsers($driveFile, $workspace){
        $driveFile = strval($driveFile);

        $workspace = $this->convertToEntity($workspace,"TwakeWorkspacesBundle");
        $userToNotifyRepo = $this->doctrine->getRepository("TwakeDriveBundle:UserToNotify");

        $usersToNotify = $userToNotifyRepo->findOneBy(Array("driveFile" => $driveFile));

        foreach ($usersToNotify as $userToNotify){
            $this->driveActivities->pushActivity(true,$workspace, $userToNotify->getUser(),null,$userToNotify->getDriveType()."/".$driveFile);
        }
    }
}
