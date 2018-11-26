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
     * @ORM\Column(name="id", type="cassandra_timeuuid")
	 * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
	 */
	private $id;

	/**
	 * @ORM\Column(type="string", length=255)
	 */
	private $name;

    /**
     * @ORM\Column(name="isdefault", type="cassandra_boolean")
     */
    private $default;

    /**
     * @ORM\Column(name="autoorder", type="integer")
     */
    private $order;

	/**
	 * @ORM\Column(type="string", length=6)
	 */
	private $color; //Header color

	/**
	 * @ORM\Column(type="string", length=512, nullable = true)
	 */
	private $url = "";

	/**
     * @ORM\Column(name="cancreatefile", type="cassandra_boolean")
	 */
	private $canCreateFile; //Will be visible in the list of new files in Drive

	/**
     * @ORM\Column(name="createfiledata", type="text")
	 */
	private $createFileData = "{}"; //Will be visible in the list of new files in Drive

	/**
     * @ORM\Column(name="iscapable", type="cassandra_boolean")
	 */
	private $isCapable; //Can be opened as app in window (displayed in the left bar of apps)


	/**
     * @ORM\Column(name="short_description", type="text")
	 */
	private $shortDescription = "";

	/**
	 * @ORM\Column(name="description", type="text")
	 */
	private $description = "";

	/**
     * @ORM\Column(name="price_monthly", type="cassandra_float")
	 */
	private $priceMonthly = 0;

    /**
     * @ORM\Column(name="price_user", type="cassandra_float")
     */
    private $priceUser = 0;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
	private $workspace;

	/**
     * @ORM\Column(name="user_count", type="integer")
	 */
	private $userCount = 0;

	/**
     * @ORM\Column(name="vote_count", type="integer")
	 */
	private $voteCount = 0;

	/**
     * @ORM\Column(name="score", type="cassandra_float")
	 */
	private $score = 0;

	/**
     * @ORM\Column(type="string", length=512)
	 */
	protected $thumbnail;

	/**
     * @ORM\Column(type="string", length=512)
	 */
    protected $cover = "";

	/**
	 * @ORM\Column(name="screenshot", type="text")
	 */
	protected $screenshot = "[]";

	/**
     * @ORM\Column(name="message_module" , type="cassandra_boolean")
	 */
	protected $messageModule;

    /**
     * @ORM\Column(name="message_module_url", type="text")
     */
    private $messageModuleUrl = "";

    /**
     * @ORM\Column(name="editable_rights" , type="cassandra_boolean")
     */
    protected $editableRights = 0;

	/**
     * @ORM\Column(type="cassandra_datetime")
	 */
	protected $date;

	/**
     * @ORM\Column(name="privatekey", type="text")
	 */
	protected $privateKey;

	/**
     * @ORM\Column(name="publickey", type="text",nullable=true, options={"index"=true})
	 */
	protected $publicKey;

	/**
     * @ORM\Column(type="cassandra_boolean" )
	 */
    protected $enabled = 0;

	/**
     * @ORM\Column(name="filestypes", type="text" )
	 */
	protected $filesTypes;

	/**
     * @ORM\Column(name="userrights", type="text" )
	 */
	protected $userRights;

	/**
     * @ORM\Column(name="applicationrights",type="text")
	 */
	protected $applicationRights;

    /**
     * @ORM\Column(name="install_count", type="integer")
     */
    private $installCount = 0;

    /**
     * @ORM\Column(name="cgu", type="text")
     */
    private $cgu = "";

    /**
     * @ORM\Column(name="urlapp", type="cassandra_boolean")
     */
    private $urlApp = false;

    /**
     * @ORM\Column(type="string", length = 256, nullable = true)
     */
    private $domain_name;

    /**
     * @ORM\Column(name="searchwords", type="text")
     */
    private $searchWords;


    public function __construct()
	{
		$this->date = new \DateTime();
		$this->privateKey = Application::generatePrivateKey();
		$this->setUserRights(Array());
		$this->setFilesTypes(Array());
		$this->setApplicationRights(Array());
		$this->enabled = false;
		$this->messageModule = false;
		$this->domain_name =null;
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
		return json_decode($this->userRights, 1);
	}

	public function getApplicationRights()
	{
		return json_decode($this->applicationRights, 1);
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

	/**
	 * @return mixed
	 */
	public function getFilesTypesRaw()
	{
		return $this->filesTypes;
	}

	/**
	 * @param mixed $filesTypes
	 */
	public function setFilesTypesRaw($filesTypes)
	{
		$this->filesTypes = $filesTypes;
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
		return "background-image: url('" . "" . $this->getThumbnail() . "');";
	}

	public function getCssCover()
	{
		if ($this->getCover() == null) {
			return "";
		}
		return "background-image: url('" . "" . $this->getCover() . "');";
	}

	public function getUrlThumbnail()
	{
		if ($this->getThumbnail() == null) {
			return "";
		}
		return "" . $this->getThumbnail();
	}

	public function getUrlCover()
	{
		if ($this->getCover() == null) {
			return "";
		}
		return "" . $this->getCover();
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
		if($this->searchWords=="")
		    $this->setSearchWords(strtolower($name));
	}

	public function getDescription()
	{
		return $this->description;
	}

	public function setDescription($descr)
	{
		$this->description = $descr;
	}

    public function getCgu()
    {
        return $this->cgu;
    }

    public function setCgu($cgu)
    {
        $this->cgu = $cgu;
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

    public function getInstallCount()
    {
        return $this->installCount;
    }

    public function increaseInstall()
    {
        return $this->installCount = $this->installCount+1;
    }

    public function decreaseInstall()
    {
        return $this->installCount = $this->installCount-1;
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

	public function setScreenshot($screen)
	{
		$this->screenshot = json_encode($screen);
	}

	public function getScreenshot()
	{
		return json_decode($this->screenshot, 1);
	}

	/**
	 * @return mixed
	 */
	public function getColor()
	{
		return $this->color;
	}

	/**
	 * @param mixed $color
	 */
	public function setColor($color)
	{
		$this->color = $color;
	}

	/**
	 * @return mixed
	 */
	public function getCanCreateFile()
	{
		return $this->canCreateFile;
	}

	/**
	 * @param mixed $canCreateFile
	 */
	public function setCanCreateFile($canCreateFile)
	{
		$this->canCreateFile = $canCreateFile;
	}

	/**
	 * @return mixed
	 */
	public function getCreateFileData()
	{
		return json_decode($this->createFileData, 1);
	}

	/**
	 * @param mixed $createFileData
	 */
	public function setCreateFileData($createFileData)
	{
		$this->createFileData = json_encode($createFileData);
	}

	/**
	 * @return mixed
	 */
	public function getCreateFileDataRaw()
	{
		return $this->createFileData;
	}

	/**
	 * @param mixed $createFileData
	 */
	public function setCreateFileDataRaw($createFileData)
	{
		$this->createFileData = $createFileData;
	}

	/**
	 * @return mixed
	 */
	public function getisCapable()
	{
		return $this->isCapable;
	}

	/**
	 * @param mixed $isCapable
	 */
	public function setIsCapable($isCapable)
	{
		$this->isCapable = $isCapable;
	}

	/**
	 * @return mixed
	 */
	public function getDefault()
	{
		return $this->default;
	}

	/**
	 * @param mixed $default
	 */
	public function setDefault($default)
	{
		$this->default = $default;
	}

    /**
     * @return mixed
     */
    public function getMessageModule()
    {
        return $this->messageModule;
    }

    /**
     * @param mixed $messageModule
     */
    public function setMessageModule($messageModule)
    {
        $this->messageModule = $messageModule;
    }

    /**
     * @return mixed
     */
    public function getMessageModuleUrl()
    {
        return $this->messageModuleUrl;
    }

    /**
     * @param mixed $messageModulUrl
     */
    public function setMessageModuleUrl($messageModuleUrl)
    {
        $this->messageModuleUrl = $messageModuleUrl;
    }

    /**
     * @return mixed
     */
    public function getEditableRights()
    {
        return $this->editableRights;
    }

    /**
     * @param mixed $editableRights
     */
    public function setEditableRights($editableRights)
    {
        $this->editableRights = $editableRights;
    }

    /**
     * @return mixed
     */
    public function getOrder()
    {
        return $this->order;
    }

    /**
     * @param mixed $order
     */
    public function setOrder($order)
    {
        $this->order = $order;
    }

    /**
     * @return mixed
     */
    public function getPriceMonthly()
    {
        return $this->priceMonthly;
    }

    /**
     * @param mixed $priceMonthly
     */
    public function setPriceMonthly($priceMonthly)
    {
        $this->priceMonthly = $priceMonthly;
    }

    /**
     * @return mixed
     */
    public function getPriceUser()
    {
        return $this->priceUser;
    }

    /**
     * @param mixed $priceUser
     */
    public function setPriceUser($priceUser)
    {
        $this->priceUser = $priceUser;
    }

    /**
     * @return mixed
     */
    public function getDomainName(){
        return $this->domain_name;
    }

    public function setDomainName($domain_name){
        $this->domain_name = $domain_name;
    }

    /**
     * @return mixed
     */
    public function getUrlApp()
    {
        return $this->urlApp;
    }

    /**
     * @param mixed $urlApp
     */
    public function setUrlApp($urlApp)
    {
        $this->urlApp = $urlApp;
    }


    public function getAsArray()
	{
		return Array(
			"id" => $this->id,
			"name" => $this->name,
			"score" => $this->score,
			"nbvote" => $this->voteCount,
            "nbInstall" => $this->installCount,
			"nbUsers" => $this->userCount,
			"description" => $this->description,
			"shortDescription" => $this->shortDescription,
			"priceMonthly" => $this->priceMonthly,
            "priceUser" => $this->priceUser,
            "cssthumbnail" => $this->getCssThumbnail(),
			"thumbnail" => $this->getUrlThumbnail(),
			"csscover" => $this->getCssCover(),
			"cover" => $this->getUrlCover(),
			"screenshots" => $this->getScreenshot(),
			"url" => $this->getUrl(),
			"filestypes" => $this->getFilesTypes(),
			"userRights" => $this->getUserRights(),
            "applicationRights" => $this->getApplicationRights(),
			"internal" => ((!(substr( $this->getUrl(), 0, 4 ) === "http"))?true:false),
			"color" => $this->getColor(),
			"canCreateFile" => $this->getCanCreateFile(),
			"createFileData" => $this->getCreateFileData(),
			"isCapable" => $this->getisCapable(),
			"default" => $this->getDefault(),
            "order" => $this->getOrder(),
            "messageModule" => $this->getMessageModule(),
            "messageModuleUrl" => $this->getMessageModuleUrl(),
            "publicKey" => $this->getPublicKey(),
            "cgu"=> $this->getCgu(),
            "editableRights" => $this->getEditableRights(),
            "domain_name" => $this->getDomainName(),
            "urlapp" => $this->getUrlApp()
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
            "publicKey" => $this->getPublicKey(),
			"filestypes" => $this->getFilesTypes()
		);
	}

    /**
     * @return mixed
     */
    public function getSearchWords()
    {
        return $this->searchWords;
    }

    /**
     * @param mixed $searchWords
     */
    public function setSearchWords($searchWords)
    {
        $this->searchWords = $searchWords;
    }

    public function addSearchWord($searchWord)
    {
        $this->searchWords .= " ".$searchWord;
    }

}
