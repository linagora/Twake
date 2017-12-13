<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use WebsiteApi\WorkspacesBundle\Repository\LinkWorkspaceUserRepository;

/**
 * WorkspaceSubscription
 *
 * @ORM\Table(name="workspace_subscription",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\WorkspaceSubscriptionRepository")
 */
class WorkspaceSubscription
{
	/**
	 * @var int
	 *
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	protected $id;
	
    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
     */
	protected $workspace;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
	 */
	protected $user;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $date;


    function __construct($workspace, $user) {
	    $this->setWorkspace($workspace);
    	$this->setUser($user);
	    $this->setDate(new \DateTime());
    }

	public function getId() {
		return $this->id;
	}

	public function getWorkspace() {
		return $this->workspace;
	}

	public function setWorkspace($workspace) {
		$this->workspace = $workspace;
	}

	public function getUser() {
		return $this->user;
	}

	public function setUser($user) {
		$this->user = $user;
	}

	public function getDate() {
		return $this->date;
	}

	public function setDate($date) {
		$this->date = $date;
	}
}
