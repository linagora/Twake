<?php

namespace WebsiteApi\CommentsBundle\Entity;

use Doctrine\Common\Persistence\ObjectManager;
use Doctrine\ORM\Mapping as ORM;
use WebsiteApi\OrganizationsBundle\Entity\Orga;
use WebsiteApi\StatusBundle\Entity\Status;
use WebsiteApi\UsersBundle\Entity\User;

/**
 * Comment
 *
 * @ORM\Table(name="comment",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CommentsBundle\Repository\CommentRepository")
 */
class Comment
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
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\OrganizationsBundle\Entity\Orga")
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $organization;

	/**
	 * @ORM\Column(type="text")
	 */
	private $content;

	/**
	 * @ORM\Column(type="text")
	 */
	private $cleanContent;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $date;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UploadBundle\Entity\File")
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $tempFile;

	/**
	 * @ORM\Column(type="integer")
	 */
	protected $comments = 0;

	/**
	 * @ORM\Column(type="integer")
	 */
	private $likes = 0;

	/**
	 * @ORM\Column(type="integer")
	 */
	private $commentedEntityType;

	/**
	 * @ORM\Column(type="integer")
	 */
	private $commentedEntityId;


	public function __construct($owner, $content, $commentedEntity, $tempFile = null) {

		$this->setUser($owner instanceof User ? $owner : null);
		$this->setOrganization($owner instanceof Orga ? $owner : null);
		$this->setContent($content);
		$this->setDate(new \DateTime());
		$this->setCommentedEntity($commentedEntity);
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

	public function getOrganization() {
		return $this->organization;
	}

	public function setOrganization($organization) {
		$this->organization = $organization;
	}

	public function getOwner() {
		return $this->user != null ? $this->user : $this->organization;
	}

	public function getContent() {
		return base64_decode($this->content);
	}

	public function getCleanContent() {
		return $this->cleanContent;
	}

	public function setContent($content) {
		$this->content = base64_encode($content);
		$this->cleanContent = $content;
	}

	public function getDate() {
		return $this->date;
	}

	public function setDate($date) {
		$this->date = $date;
	}

	public function getTempFile() {
		return $this->tempFile;
	}

	public function setTempFile($tempFile) {
		$this->tempFile = $tempFile;
	}

	public function getComments() {
		return $this->comments;
	}

	public function addComment() {
		++$this->comments;
	}

	public function removeComment() {
		--$this->comments;
	}

	public function getLikes() {
		return $this->likes;
	}

	public function addLike() {
		++$this->likes;
	}

	public function removeLike() {
		--$this->likes;
	}

	public function getCommentedEntity(ObjectManager $doctrineManager) {
		return $doctrineManager->getRepository(Comment::getCommentedClassName($this->commentedEntityType))->find($this->commentedEntityId);
	}

	public function setCommentedEntity($commentedEntity) {

		$this->commentedEntityId = $commentedEntity->getId();
		$this->commentedEntityType = 0;

		if ($commentedEntity instanceof Status) {
			$this->commentedEntityType = 1;
		}
		else if ($commentedEntity instanceof Comment) {
			$this->commentedEntityType = 2;
		}
	}

	public function getCommentsEntities(ObjectManager $doctrineManager, $limit = null, $offset = null) {
		return $doctrineManager->getRepository("TwakeCommentsBundle:Comment")->findBy(
			Array("commentedEntityType" => $this->getClassId($this), "commentedEntityId" => $this->getId()), Array("date" => "desc"), $limit, $offset
		);
	}

	static public function getCommentedClassName($likedEntityType) {

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

	public function getLikeEntity(ObjectManager $doctrineManager, $user) {
		return $doctrineManager->getRepository("TwakeCommentsBundle:Like")->findOneBy(Array("likedEntityType" => Comment::getClassId($this), "user" => $user));
	}

	public function getLikesEntities(ObjectManager $doctrineManager) {
		return $doctrineManager->getRepository("TwakeCommentsBundle:Like")->findBy(Array("likedEntityType" => Comment::getClassId($this)));
	}

	public function getArray(ObjectManager $doctrineManager, $currentUser, $limit) {

		$dateDifference = $this->getDate()->diff(new \DateTime());

		$commentsDetails = Array();
		$comments = $this->getCommentsEntities($doctrineManager, $limit, 0);
		foreach ($comments as $comment) {
			$commentsDetails[] = $comment->getArray($doctrineManager, $currentUser, 0);
		}

		return Array(
			"id" => $this->getId(),
			"ownerId" => $this->getOwner()->getId(),
			"ownerDetails" => $this->getOwner()->getAsSimpleArray(),
			"ownerIsGroup" => $this->getOrganization() != null,
			"content" => $this->getContent(),
			"fileurl" => $this->getTempFile() != null ? "https://twakeapp.com".$this->getTempFile()->getPublicURL() : "",
			"date" => $this->getDate()->getTimestamp(),
			"dateDifference" => Array(
				"y" => $dateDifference->y, "m" => $dateDifference->m, "d" => $dateDifference->d,
				"h" => $dateDifference->h, "i" => $dateDifference->i, "s" => $dateDifference->s
			),
			"likes" => $this->getLikes(),
			"haveLiked" => $this->getLikeEntity($doctrineManager, $currentUser),
			"comments" => $this->getComments(),
			"commentsDetails" => $commentsDetails
		);
	}
}

