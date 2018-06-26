<?php


namespace WebsiteApi\DriveBundle\Services;

use AESCryptFileLib;
use MCryptAES256Implementation;
use WebsiteApi\DriveBundle\Entity\DriveLabel;
use WebsiteApi\DriveBundle\Entity\UserToNotify;

class UserToNotifyService
{

	var $doctrine;

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

	public function __construct($doctrine){
		$this->doctrine = $doctrine;
	}

	public function get($driveFile)
	{
	    $driveFile = $this->convertToEntity($driveFile, "TwakeDriveBundle:DriveFile");
		$UsersToNotifyRepository = $this->doctrine->getRepository("TwakeDriveBundle:UserToNotify");
		return $UsersToNotifyRepository->findBy(Array("driveFile" => $driveFile));
	}

	public function setUsersList($driveFile, $usersList){
        $driveFile = $this->convertToEntity($driveFile, "TwakeDriveBundle:DriveFile");
        $userToNotifyRepo = $this->doctrine->getRepository("TwakeDriveBundle:UserToNotify");
        $userToNotifyRepo->deleteByDriveFile($driveFile);


        foreach ($usersList as $user){
            $user = $this->convertToEntity($user,"TwakeUsersBundle:User");
            $userToNotify = $userToNotifyRepo->findOneBy(Array("user" => $user, "driveFile" => $driveFile));

            if(!$userToNotify || $userToNotify==null)
                $userToNotify = new UserToNotify($user,$driveFile);

            $this->doctrine->persist($userToNotify);
        }

	    $this->doctrine->flush();
    }

}
