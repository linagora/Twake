<?php

namespace WebsiteApi\CommentsBundle\Entity;

use Doctrine\Common\Persistence\ObjectManager;
use Doctrine\ORM\Mapping as ORM;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\StatusBundle\Entity\Status;
use WebsiteApi\UsersBundle\Entity\User;

/**
 * Like
 *
 * @ORM\Table(name="user_like",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CommentsBundle\Repository\LikeRepository")
 */
class Like
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
	 */
    private $user;

	/**
	 * @ORM\Column(type="integer")
	 */
    private $likedEntityType;

	/**
	 * @ORM\Column(type="integer")
	 */
    private $likedEntityId;


	public function __construct($user, $likableEntity) {

		$this->setUser($user);
		$this->setLikedEntity($likableEntity);
	}

	public function getId() {
	return $this->id;
}

	public function getUser() {
		return $this->user;
	}

	public function setUser($user) {
		$this->user = $user;
	}

	public function getLikedEntity(ObjectManager $doctrineManager) {
		return $doctrineManager->getRepository($this->getLikedClassName($this->likedEntityType))->find($this->likedEntityId);
	}

	public function setLikedEntity($likedEntity) {

		$this->likedEntityId = $likedEntity->getId();
		$this->likedEntityType = $this->getClassId($likedEntity);
	}

	static public function getLikedClassName($likedEntityType) {

		switch ($likedEntityType) {

			case 1 : return "TwakeStatusBundle:Status";
			case 2 : return "TwakeCommentsBundle:Comment";
			default : return "";
		}
	}

	static public function getClassId($entity) {

		if ($entity instanceof Status) {
			return 1;
		}
		else if ($entity instanceof Comment) {
			return 2;
		}

		return 0;
	}
}
