<?php


namespace WebsiteApi\DriveBundle\Services;

use AESCryptFileLib;
use MCryptAES256Implementation;
use WebsiteApi\CoreBundle\Services\Translate;
use WebsiteApi\CoreBundle\Services\TranslationObject;
use WebsiteApi\DriveBundle\Entity\DriveLabel;
use WebsiteApi\DriveBundle\Entity\UserToNotify;
use WebsiteApi\UsersBundle\Entity\User;

class UserToNotifyService
{

    var $doctrine;
    /* @var DriveFileSystemGDrive $externalDriveFileSystem */
    var $externalDriveFileSystem;
    /* @var \WebsiteApi\DriveBundle\Services\DriveActivities $driveActivities */
    var $driveActivities;
    /* @var Translate $translate*/
    var $translate;

    private function convertToEntity($var, $repository)
    {
        if (is_string($var)) {
            $var = $var; // Cassandra id do nothing
        }

        if (is_int($var) || is_string($var) || get_class($var) == "Ramsey\Uuid\Uuid") {
            return $this->doctrine->getRepository($repository)->find($var);
        } else if (is_object($var)) {
            return $var;
        } else {
            return null;
        }

    }

    public function __construct($doctrine, $externalDriveFileSystem, $driveActivities, $translate)
    {
        $this->doctrine = $doctrine;
        $this->externalDriveFileSystem = $externalDriveFileSystem;
        $this->driveActivities = $driveActivities;
        $this->translate = $translate;
    }

    public function get($drivefile)
    {
        $UsersToNotifyRepository = $this->doctrine->getRepository("TwakeDriveBundle:UserToNotify");
        return $UsersToNotifyRepository->findBy(Array("drivefile" => $drivefile));
    }

    public function setUsersList($drivefile, $rootDirectory, $usersList)
    {
        $drivefile = strval($drivefile);
        $additionalData = $this->getAdditionalData($drivefile);
        $userToNotifyRepo = $this->doctrine->getRepository("TwakeDriveBundle:UserToNotify");
        $userToNotifyRepo->deleteByDriveFile($drivefile);

        $driveType = $this->externalDriveFileSystem->getDriveType($rootDirectory);

        if($driveType == "gdrive") {
            if (count($usersList) == 0)
                $additionalData = $this->externalDriveFileSystem->unwatchFile($drivefile, $rootDirectory, $additionalData);
            else
                $additionalData = $this->externalDriveFileSystem->watchFile($drivefile, $rootDirectory, $additionalData);

            //$this->updateAdditionalData($drivefile,$additionalData);
        }


        foreach ($usersList as $user) {
            $user = $this->convertToEntity($user, "TwakeUsersBundle:User");
            $userToNotify = $userToNotifyRepo->findOneBy(Array("user" => $user, "drivefile" => $drivefile));

            if (!$userToNotify || $userToNotify == null)
                $userToNotify = new UserToNotify($user, $drivefile, $driveType);

            $userToNotify->setAdditionalData($additionalData);

            $this->doctrine->persist($userToNotify);
        }

        $this->doctrine->flush();
    }

    public function notifyUsers($drivefile, $workspace, $title = "Drive", $text = "", $fileId = null, $senderId)
    {
        $drivefile = strval($drivefile);

        $workspace = $this->convertToEntity($workspace,"TwakeWorkspacesBundle:Workspace");
        $userToNotifyRepo = $this->doctrine->getRepository("TwakeDriveBundle:UserToNotify");

        $usersToNotify = $userToNotifyRepo->findBy(Array("drivefile" => $drivefile));

        if($fileId==null)
            $fileId="";
        else
            $fileId = "/".$fileId;

        if(!$usersToNotify)
            return false;
        foreach ($usersToNotify as $userToNotify){
            /* @var UserToNotify $userToNotify */

            $this->driveActivities->pushActivity($userToNotify->getUser()->getId()!=$senderId,$workspace, $userToNotify->getUser(),null,
                $this->translate->translate($title,$userToNotify->getUser()->getLanguage()),
                $this->translate->translate($text,$userToNotify->getUser()->getLanguage())
                , Array(), Array("notifCode" => $userToNotify->getDriveType() . "/" . $drivefile . $fileId));
        }
        return true;
    }

    public function getAdditionalData($drivefile)
    {
        $userToNotifyRepo = $this->doctrine->getRepository("TwakeDriveBundle:UserToNotify");

        $usersToNotify = $userToNotifyRepo->findBy(Array("drivefile" => $drivefile));

        if(count($usersToNotify)==0)
            return Array();

        return $usersToNotify[0]->getAdditionalData();
    }

    public function updateAdditionalData($drivefile, $additionalData)
    {
        $userToNotifyRepo = $this->doctrine->getRepository("TwakeDriveBundle:UserToNotify");

        $usersToNotify = $userToNotifyRepo->findBy(Array("drivefile" => $drivefile));
        foreach ($usersToNotify as $userToNotify){
            $userToNotify->setAdditionalDatta($additionalData);
            $this->doctrine->persist($userToNotify);
        }
        $this->doctrine->flush();
    }
}
