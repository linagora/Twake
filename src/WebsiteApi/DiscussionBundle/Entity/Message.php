<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * Message
 *
 * @ORM\Table(name="message",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DiscussionBundle\Repository\MessageRepository")
 */
class Message
{
	/**
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User",cascade={"persist"})
	 */
	private $sender;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User",cascade={"persist"})
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $userReceiver;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Channel",cascade={"persist"})
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $channelReceiver;

	/**
	 * @ORM\Column(type="string", length=1)
	 */
	private $receiverType;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $date;

	/**
	 * @ORM\Column(type="text", length=20000)
	 */
	private $content;
	/**
	 * @ORM\Column(type="text", length=10000)
	 */
	private $cleanContent;

	/**
	 * @ORM\Column(type="string", length=30)
	 */
	private $usernamecache;

	/**
	 * @ORM\Column(type="boolean")
	 */
	private $edited;

	/**
	 * @ORM\Column(type="boolean")
	 */
	private $pinned;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\DriveBundle\Entity\DriveFile")
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $driveFile;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UploadBundle\Entity\File")
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $tempFile;

	/**
	 * @ORM\Column(type="boolean")
	 */
	private $isFile;

	/**
	 * @ORM\Column(type="string")
	 */
	private $filename;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Message")
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $responseTo = null;

	/**
	 * @ORM\Column(type="string")
	 */
	private $likeSummary;


	public function __construct($sender, $userReceiver, $channelReceiver, $content, $cleanContent)
	{

		$this->sender = $sender;
		$this->usernamecache = $sender->getUsernameClean();
		$this->userReceiver = $userReceiver;
		$this->channelReceiver = $channelReceiver;
		$this->receiverType = $userReceiver == null ? 'C' : 'U';
		$this->date = new \DateTime("now");
		$this->setContent($content);
		$this->setCleanContent($content);
		$this->setEdited(false);
		$this->pinned = false;
		$this->driveFile = null;
		$this->tempFile = null;
		$this->isFile = false;
		$this->filename = "";
		$this->likeSummary = "{}";

	}

	public function getId()
	{
		return $this->id;
	}

	public function setSender($sender)
	{
		$this->sender = $sender;
	}

	public function getSender()
	{
		return $this->sender;
	}

	public function setUserReceiver($userReceiver)
	{
		$this->userReceiver = $userReceiver;
	}

	public function setChannelReceiver($channelReceiver)
	{
		$this->channelReceiver = $channelReceiver;
	}

	public function getReceiver()
	{
		return $this->userReceiver == null ? $this->channelReceiver : $this->userReceiver;
	}

	public function getEdited()
	{
		return $this->edited;
	}

	public function setEdited($edited)
	{
		$this->edited = $edited;
	}

	public function getPinned()
	{
		return $this->pinned;
	}

	public function setPinned($pinned)
	{
		$this->pinned = $pinned;
	}

	public function setDate($date)
	{
		$this->date = $date;
	}

	public function getDate()
	{
		return $this->date;
	}

	public function setContent($content)
	{
		$content = substr($content, 0, 10000);
		$this->content = base64_encode($content);
	}

	public function getContent()
	{
		return base64_decode($this->content);
	}

	public function getCleanContent()
	{
		return $this->cleanContent;
	}

	public function setCleanContent($content)
	{
		$content = substr($content, 0, 10000);
		$this->cleanContent = $content;
	}

	/**
	 * @return mixed
	 */
	public function getDriveFile()
	{
		return $this->driveFile;
	}

	/**
	 * @param mixed $driveFile
	 */
	public function setDriveFile($driveFile)
	{
		$this->driveFile = $driveFile;

		if ($driveFile != null) {
			$this->isFile = true;
			$this->filename = $driveFile->getName();
		} else if ($this->tempFile == null) {
			$this->isFile = false;
			$this->filename = "";
		}
	}

	/**
	 * @return mixed
	 */
	public function getTempFile()
	{
		return $this->tempFile;
	}

	/**
	 * @param mixed $tempFile
	 */
	public function setTempFile($tempFile)
	{
		$this->tempFile = $tempFile;

		if ($tempFile != null) {
			$this->isFile = true;
			$this->filename = $tempFile->getRealName();
		} else if ($this->driveFile == null) {
			$this->isFile = false;
			$this->filename = "";
		}
	}

	private function fileIsImage()
	{

		if ($this->getDriveFile() != null) {
			$name = $this->getDriveFile()->getName();
		} else if ($this->getTempFile() != null) {
			$name = $this->getTempFile()->getName();
		} else {
			return false;
		}

		$nameParts = explode(".", $name);

		if (count($nameParts) == 2) {
			return in_array($nameParts[1], Array("png", "jpg", "jpeg", "gif", "tiff"));
		}

		return false;
	}

	public function setLikeSummary($summary)
	{
		$this->likeSummary = json_encode($summary);
	}

	public function getLikeSummary()
	{
		if ($this->likeSummary == "" or $this->likeSummary == null) {
			return Array();
		}
		return json_decode($this->likeSummary, 1);
	}

	public function getAsArray()
	{

		if ($this->getDriveFile() != null) {
			$fileUrl = $this->getDriveFile()->getDownloadLink();
		} else if ($this->getTempFile() != null) {
			$fileUrl = "" . $this->getTempFile()->getPublicURL();
		} else {
			$fileUrl = "";
		}

		if ($this->getDriveFile() != null) {
			$fileName = $this->getDriveFile()->getName();
		} else if ($this->getTempFile() != null) {
			$fileName = $this->getTempFile()->getRealName();
		} else {
			$fileName = "";
		}

		return Array(
			'id' => $this->getId(),
			'sid' => $this->getSender()->getId(),
			'rid' => $this->getReceiver()->getId(),
			'content' => $this->getContent(),
			'date' => $this->getDate()->format('d-m-Y H:i:s'),
			'timestamp' => $this->getDate()->getTimestamp(),
			'edited' => $this->getEdited(),
			'pinned' => $this->getPinned(),
			'fileurl' => $fileUrl,
			'fileisimage' => $this->fileIsImage(),
			'filename' => $fileName,
			'fileisfromdrive' => $this->getDriveFile() != null,
			'file' => $this->getDriveFile() != null ? $this->getDriveFile()->getArray() : null,
			'likes' => $this->getLikeSummary()
		);
	}
}
