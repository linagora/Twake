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

	public function create($user)
	{
		//Verify userstat exists
		$repo = $this->em->getRepository("TwakeUsersBundle:UserStats");
		$userStats = $repo->find($user);

		if($userStats==null){
			$userStats = new \WebsiteApi\UsersBundle\Entity\UserStats($user);
		}

		$this->em->persist($userStats);
		$this->em->flush();
	}

	public function sendMessage($user, $private=true)
	{
		$repo = $this->em->getRepository("TwakeUsersBundle:UserStats");
		$userStats = $repo->find($user);

		if($private){
			$userStats->addPrivateMsgCount(1);
		}else{
			$userStats->addPublicMsgCount(1);
		}

		$this->em->persist($userStats);
		$this->em->flush();
	}

}