<?php


namespace WebsiteApi\MarketBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;

/**
 * Message
 *
 * @ORM\Table(name="application",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\MarketBundle\Repository\ApplicationRepository")
 */
class Application
{
	/**
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	private $id;

	/**
	 * @ORM\Column(type="string", length=255)
	 */
	private $name;

	/**
	 * @ORM\Column(type="string", length=512)
	 */
	private $url = "";


	/**
	 * @ORM\Column(name="shortDescription", type="text")
	 */
	private $shortDescription = "";

	/**
	 * @ORM\Column(name="description", type="text")
	 */
	private $description = "";

	/**
	 * @ORM\Column(name="price", type="float")
	 */
	private $price = 0;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
	private $workspace;

	/**
	 * @ORM\Column(name="userCount", type="integer")
	 */
	private $userCount = 0;

	/**
	 * @ORM\Column(name="voteCount", type="integer")
	 */
	private $voteCount = 0;

	/**
	 * @ORM\Column(name="score", type="float")
	 */
	private $score = 0;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UploadBundle\Entity\File")
	 */
	protected $thumbnail;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UploadBundle\Entity\File")
	 */
	protected $cover;

	/**
	 * @ORM\Column(name="screenshot", type="text")
	 */
	protected $screenshot = "[]";

	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\MarketBundle\Entity\LinkAppWorkspace", mappedBy="Application")
	 */
	protected $applicationsLinks;

	/**
	 * @ORM\Column(type="boolean", options={"default" : false})
	 */
	protected $isPromoted = false;

	/**
	 * @ORM\Column(type="date")
	 */
	protected $date;

	/**
	 * @ORM\Column(type="text")
	 */
	protected $privateKey;

	/**
	 * @ORM\Column(type="text",nullable=true)
	 */
	protected $publicKey;

	/**
	 * @ORM\Column(type="boolean" )
	 */
	protected $enabled;

	/**
	 * @ORM\Column(type="text" )
	 */
	protected $filesTypes;

	/**
	 * @ORM\Column(type="text" )
	 */
	protected $userRights;

	/**
	 * @ORM\Column(type="text")
	 */
	protected $applicationRights;


	public function __construct()
	{
		$this->date = new \DateTime();
		$this->privateKey = Application::generatePrivateKey();
		$this->setUserRights(Array());
		$this->setFilesTypes(Array());
		$this->setApplicationRights(Array());
		$this->enabled = false;
	}

	static public function generatePrivateKey()
	{
		return sha1("a" . rand(1, 99999999) . "b" . rand(1, 99999999) . "c" . rand(1, 99999999) . "d");
	}

	public function generePublicKey()
	{
		$x = mb_strtoupper(Workspace::getKeyFromId($this->getId()));
		$this->setPublicKey($x);
		return $x;
	}

	public function generatePublicKey()
	{
	}

	public function getPrivateKey()
	{
		return $this->privateKey;
	}

	public function setPrivateKey($key)
	{
		$this->privateKey = $key;
	}

	public function getUserRights()
	{
		return json_decode($this->userRights);
	}

	public function getApplicationRights()
	{
		return json_decode($this->applicationRights);
	}

	public function setUserRights($rights)
	{
		$this->userRights = json_encode($rights);
	}

	public function setApplicationRights($rights)
	{
		$this->applicationRights = json_encode($rights);
	}

	/**
	 * @return mixed
	 */
	public function getEnabled()
	{
		return $this->enabled;
	}

	/**
	 * @param mixed $enabled
	 */
	public function setEnabled($enabled)
	{
		$this->enabled = $enabled;
	}

	/**
	 * @return mixed
	 */
	public function getFilesTypes()
	{
		return json_decode($this->filesTypes, true);
	}

	/**
	 * @param mixed $filesTypes
	 */
	public function setFilesTypes($filesTypes)
	{
		$this->filesTypes = json_encode($filesTypes);
	}

	public function changePrivateKey()
	{
		$this->privateKey = Application::generatePrivateKey();
	}

	public function getPublicKey()
	{
		return $this->publicKey;
	}

	public function setPublicKey($x)
	{
		$this->publicKey = $x;
	}

	public function getAsArray()
	{
		return Array(
			"id" => $this->id,
			"name" => $this->name,
			"score" => $this->score,
			"nbvote" => $this->voteCount,
			"nbUsers" => $this->userCount,
			"description" => $this->description,
			"shortDescription" => $this->shortDescription,
			"price" => $this->price,
			"cssthumbnail" => $this->getCssThumbnail(),
			"thumbnail" => $this->getUrlThumbnail(),
			"csscover" => $this->getCssCover(),
			"cover" => $this->getUrlCover(),
			"isPromoted" => $this->getPromoted(),
			"screenshots" => $this->getScreenshot(),
			"url" => $this->getUrl(),
			"filestypes" => $this->getFilesTypes()
		);
	}

	public function getAsSimpleArray()
	{
		return Array(
			"id" => $this->id,
			"name" => $this->name,
			"cssthumbnail" => $this->getCssThumbnail(),
			"thumbnail" => $this->getUrlThumbnail(),
			"url" => $this->getUrl(),
			"filestypes" => $this->getFilesTypes()
		);
	}

	public function newVote($score)
	{
		$scoreTotal = $this->score * $this->voteCount;
		$scoreTotal += $score;
		$this->voteCount++;
		$this->score = $scoreTotal / (float)$this->voteCount;
	}

	public function replaceVote($oldScore, $score)
	{
		$scoreTotal = $this->score * $this->voteCount;
		$scoreTotal += $score - $oldScore;
		$this->score = $scoreTotal / (float)$this->voteCount;
	}

	/**
	 * @param mixed $thumbnail
	 */
	public function setThumbnail($thumbnail)
	{
		$this->thumbnail = $thumbnail;
	}

	public function removeVote($score)
	{
		$scoreTotal = $this->score * $this->voteCount;
		$scoreTotal -= $score;
		$this->voteCount--;
		$this->score = $scoreTotal / (float)$this->voteCount;
	}

	public function getCssThumbnail()
	{
		if ($this->getThumbnail() == null) {
			return "";
		}
		return "background-image: url('" . "" . $this->getThumbnail()->getPublicURL(2) . "');";
	}

	public function getCssCover()
	{
		if ($this->getCover() == null) {
			return "";
		}
		return "background-image: url('" . "" . $this->getCover()->getPublicURL(2) . "');";
	}

	public function getUrlThumbnail()
	{
		if ($this->getThumbnail() == null) {
			return "";
		}
		return "" . $this->getThumbnail()->getPublicURL(2);
	}

	public function getUrlCover()
	{
		if ($this->getCover() == null) {
			return "";
		}
		return "" . $this->getCover()->getPublicURL(2);
	}

	public function getId()
	{
		return $this->id;
	}

	public function getName()
	{
		return $this->name;
	}

	public function setName($name)
	{
		$this->name = $name;
	}

	public function getDescription()
	{
		return $this->description;
	}

	public function setDescription($descr)
	{
		$this->description = $descr;
	}

	public function getShortDescription()
	{
		return $this->description;
	}

	public function setShortDescription($descr)
	{
		$this->shortDescription = $descr;
	}

	public function getGroup()
	{
		return $this->workspace;
	}

	public function setGroup($workspace)
	{
		$this->workspace = $workspace;
	}

	public function getPrice()
	{
		return $this->price;
	}

	public function setPrice($price)
	{
		$this->price = $price;
	}

	public function getUserCount()
	{
		return $this->userCount;
	}

	public function addUser()
	{
		$this->userCount++;
	}

	public function removeUser()
	{
		$this->userCount--;
	}

	public function getScore()
	{
		return $this->score;
	}

	public function getVoteCount()
	{
		return $this->voteCount;
	}

	public function getThumbnail()
	{
		return $this->thumbnail;
	}

	/**
	 * @return mixed
	 */
	public function getUrl()
	{
		return $this->url;
	}


	/**
	 * @param mixed $url
	 */
	public function setUrl($url)
	{
		$this->url = $url;
	}


	public function setCover($x)
	{
		$this->cover = $x;
	}

	public function getCover()
	{
		return $this->cover;
	}

	public function getPromoted()
	{
		return $this->isPromoted;
	}

	public function setPromoted($x)
	{
		$this->isPromoted = $x;
	}

	public function setScreenshot($screen)
	{
		$this->screenshot = json_encode($screen);
	}

	public function getScreenshot()
	{
		return json_decode($this->screenshot, 1);
	}

}
