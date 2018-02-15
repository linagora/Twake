<?php

namespace WebsiteApi\WorkspacesBundle\Services;
use WebsiteApi\WorkspacesBundle\Model\WorkspaceStatsInterface;


class WorkspaceStats implements WorkspaceStatsInterface
{

	protected $em;

	public function __construct($em)
	{
		$this->em = $em;
	}

	public function create($workspace)
	{
		//Verify userstat exists
		$repo = $this->em->getRepository("TwakeWorkspacesBundle:WorkspaceStats");
		$wStats = $repo->find($workspace);

		if($wStats==null){
			$wStats = new \WebsiteApi\WorkspacesBundle\Entity\WorkspaceStats($workspace);
		}

		$this->em->persist($wStats);
		$this->em->flush();
	}

	public function sendMessage($workspace, $private=true, $privateChannel=false)
	{
		$repo = $this->em->getRepository("TwakeWorkspacesBundle:WorkspaceStats");
		$wStats = $repo->find($workspace);

		if(!$wStats){
			return;
		}

		if($private){
			$wStats->addPrivateMsg(1);
		}else{
			if($privateChannel) {
				$wStats->addPrivateChannelMsg(1);
			}else{
				$wStats->addPublicMsg(1);
			}
		}

		$this->em->persist($wStats);
		$this->em->flush();
	}

}