<?php

namespace WebsiteApi\StatusBundle\Entity;

use Doctrine\Common\Persistence\ObjectManager;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\CommentsBundle\Entity\Comment;
use WebsiteApi\CommentsBundle\Entity\Like;
use WebsiteApi\OrganizationsBundle\Entity\Orga;
use WebsiteApi\UsersBundle\Entity\User;

/**
 * Status
 *
 * @ORM\Table(name="status",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\StatusBundle\Repository\StatusRepository")
 */
class Status
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
	 * @ORM\JoinColumn(nullable=true)
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
	 * @ORM\Column(type="string", length=1)
	 */
	private $privacy;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UploadBundle\Entity\File")
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $tempFile;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\StatusBundle\Entity\Status")
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $sharedStatus;

	/**
	 * @ORM\Column(type="integer")
	 */
	private $shares = 0;

	/**
	 * @ORM\Column(type="integer")
	 */
	protected $comments = 0;

	/**
	 * @ORM\Column(type="integer")
	 */
	private $likes = 0;


	public function __construct($owner, $content, $privacy, $tempFile = null, $sharedStatus = null) {

		$this->setUser($owner instanceof User ? $owner : null);
		$this->setOrganization($owner instanceof Orga ? $owner : null);
		$this->setContent($content);
		$this->setPrivacy($privacy == "P" || $privacy == "I" ? $privacy : "I");
		$this->setTempFile($tempFile);
		$this->setDate(new \DateTime());
		$this->setSharedStatus($sharedStatus);
	}

	public function getId() {
		return $this->id;
	}

	public function getSharedStatus() {
		return $this->sharedStatus;
	}

	public function setSharedStatus($sharedStatus) {
		$this->sharedStatus = $sharedStatus;
	}

	public function getUser() {
		return $this->user;
	}

	public function setUser($user) {
		$this->user = $user;
	}

	public function getShares() {
		return $this->shares;
	}

	public function addShare() {
		++$this->shares;
	}

	public function removeShare() {
		--$this->shares;
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

	public function getPrivacy() {
		return $this->privacy;
	}

	public function setPrivacy($privacy) {
		$this->privacy = $privacy;
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

	public function getOwnerDetails() {

		if ($this->getUser() != null) {
			return $this->getUser()->getAsSimpleArray();
		}

		return $this->getOrganization()->getAsSimpleArray();
	}

	public function getLikeEntity(ObjectManager $doctrineManager, $user) {
		return $doctrineManager->getRepository("TwakeCommentsBundle:Like")->findOneBy(Array("likedEntityType" => Like::getClassId($this), "user" => $user,"likedEntityId"=>$this->getId()));
	}

	public function getLikesEntities(ObjectManager $doctrineManager) {
		return $doctrineManager->getRepository("TwakeCommentsBundle:Like")->findBy(Array("likedEntityType" => Like::getClassId($this)));
	}

	public function getCommentsEntities(ObjectManager $doctrineManager, $limit = null, $offset = null) {
		return $doctrineManager->getRepository("TwakeCommentsBundle:Comment")->findBy(
			Array("commentedEntityType" => Comment::getClassId($this), "commentedEntityId" => $this->getId()), Array("date" => "desc"), $limit, $offset
		);
	}

	public function getArray(ObjectManager $doctrineManager, $currentUser, $sharedStatusCanBeShown, $includesOwnerDetails = false) {

		$dateDifference = $this->getDate()->diff(new \DateTime());

		$oldInitialSharedStatus = null;
		$initialSharedStatus = $this->getSharedStatus();
		while ($initialSharedStatus != null) {
			$oldInitialSharedStatus = $initialSharedStatus;
			$initialSharedStatus = $initialSharedStatus->getSharedStatus();
		}

		return Array(
			"id" => $this->getId(),
			"content" => $this->getContent(),
			"date" => $this->getDate()->getTimestamp(),
			"dateDifference" => Array(
				"y" => $dateDifference->y, "m" => $dateDifference->m, "d" => $dateDifference->d,
				"h" => $dateDifference->h, "i" => $dateDifference->i, "s" => $dateDifference->s
			),
			"ownerId" => $this->getUser() != null ? $this->getUser()->getId() : $this->getOrganization()->getId(),
			"ownerIsGroup" => $this->getOrganization() != null,
			"ownerDetails" => $includesOwnerDetails ? $this->getOwnerDetails() : Array(),
			"privacy" => $this->getPrivacy(),
			"fileurl" => $this->getTempFile() != null ? "https://twakeapp.com".$this->getTempFile()->getPublicURL() : "",
			"likes" => $this->getLikes(),
			"haveLiked" => $this->getLikeEntity($doctrineManager, $currentUser) != null,
			"sharedStatus" => $sharedStatusCanBeShown && $this->getSharedStatus() != null ? $this->getSharedStatus()->getArray($doctrineManager, $currentUser, false, true) : null,
			"initialSharedStatus" => $sharedStatusCanBeShown && $oldInitialSharedStatus != null ? $oldInitialSharedStatus->getArray($doctrineManager, $currentUser, false, true) : null,
			"shares" => $this->getShares(),
			"comments" => $this->getComments()
		);
	}
}
