<?php

namespace WebsiteApi\UsersBundle\Services;
use WebsiteApi\UsersBundle\Model\UserStatsInterface;

/**
 * This is an interface for the service UserStats
 *
 * This service is responsible for recording data from user for statistical purpose only
 */
class UserStats implements UserStatsInterface
{

	protected $em;

	public function __construct($em)
	{
		$this->em = $em;
	}

	public function create($userId)
	{
		//Verify userstat exists
		$repo = $this->em->getRepository("TwakeUsersBundle:UserStats");
		$userStats = $repo->find($userId);

		if($userStats==null){
			$userStats = new \WebsiteApi\UsersBundle\Entity\UserStats($userId);
		}

		$this->em->persist($userStats);
		$this->em->flush();
	}

	public function sendMessage($userId, $private=true)
	{
		$repo = $this->em->getRepository("TwakeUsersBundle:UserStats");
		$userStats = $repo->find($userId);

		if($private){
			$userStats->addPrivateMsgCount(1);
		}else{
			$userStats->addPublicMsgCount(1);
		}

		$this->em->persist($userStats);
		$this->em->flush();
	}

}