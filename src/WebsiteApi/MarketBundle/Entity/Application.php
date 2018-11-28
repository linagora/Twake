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
     * @ORM\Column(name="isdefault", type="cassandra_boolean", options={"index": true})
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
    private $cancreatefile; //Will be visible in the list of new files in Drive

	/**
     * @ORM\Column(name="createfiledata", type="text")
	 */
    private $createfiledata = "{}"; //Will be visible in the list of new files in Drive

	/**
     * @ORM\Column(name="iscapable", type="cassandra_boolean")
	 */
    private $iscapable; //Can be opened as app in window (displayed in the left bar of apps)


	/**
     * @ORM\Column(name="short_description", type="text")
	 */
    private $shortdescription = "";

	/**
	 * @ORM\Column(name="description", type="text")
	 */
	private $description = "";

	/**
     * @ORM\Column(name="price_monthly", type="cassandra_float")
	 */
    private $pricemonthly = 0;

    /**
     * @ORM\Column(name="price_user", type="cassandra_float")
     */
    private $priceuser = 0;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
	private $workspace;

	/**
     * @ORM\Column(name="user_count", type="integer")
	 */
    private $usercount = 0;

	/**
     * @ORM\Column(name="vote_count", type="integer")
	 */
    private $votecount = 0;

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
    protected $messagemodule;

    /**
     * @ORM\Column(name="message_module_url", type="text")
     */
    private $messagemoduleurl = "";

    /**
     * @ORM\Column(name="editable_rights" , type="cassandra_boolean")
     */
    protected $editablerights = 0;

	/**
     * @ORM\Column(type="cassandra_datetime")
	 */
	protected $date;

	/**
     * @ORM\Column(name="privatekey", type="text")
	 */
    protected $privatekey;

	/**
     * @ORM\Column(name="publickey", type="text",nullable=true, options={"index"=true})
	 */
    protected $publickey;

	/**
     * @ORM\Column(type="cassandra_boolean" )
	 */
    protected $enabled = 0;

	/**
     * @ORM\Column(name="filestypes", type="text" )
	 */
    protected $filestypes;

	/**
     * @ORM\Column(name="userrights", type="text" )
	 */
    protected $userrights;

	/**
     * @ORM\Column(name="applicationrights",type="text")
	 */
    protected $applicationrights;

    /**
     * @ORM\Column(name="install_count", type="integer")
     */
    private $installcount = 0;

    /**
     * @ORM\Column(name="cgu", type="text")
     */
    private $cgu = "";

    /**
     * @ORM\Column(name="urlapp", type="cassandra_boolean")
     */
    private $urlapp = false;

    /**
     * @ORM\Column(type="string", length = 256, nullable = true)
     */
    private $domain_name;

    /**
     * @ORM\Column(name="searchwords", type="text")
     */
    private $searchwords;


    public function __construct()
	{
		$this->date = new \DateTime();
        $this->privatekey = Application::generatePrivateKey();
		$this->setUserRights(Array());
		$this->setFilesTypes(Array());
		$this->setApplicationRights(Array());
		$this->enabled = false;
        $this->messagemodule = false;
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
        return $this->privatekey;
	}

	public function setPrivateKey($key)
	{
        $this->privatekey = $key;
	}

	public function getUserRights()
	{
        return json_decode($this->userrights, 1);
	}

	public function getApplicationRights()
	{
        return json_decode($this->applicationrights, 1);
	}

	public function setUserRights($rights)
	{
        $this->userrights = json_encode($rights);
	}

	public function setApplicationRights($rights)
	{
        $this->applicationrights = json_encode($rights);
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
        return json_decode($this->filestypes, true);
	}

	/**
     * @param mixed $filestypes
	 */
    public function setFilesTypes($filestypes)
    {
        $this->filestypes = json_encode($filestypes);
	}

	/**
	 * @return mixed
	 */
	public function getFilesTypesRaw()
	{
        return $this->filestypes;
	}

	/**
     * @param mixed $filestypes
	 */
    public function setFilesTypesRaw($filestypes)
    {
        $this->filestypes = $filestypes;
	}

	public function changePrivateKey()
	{
        $this->privatekey = Application::generatePrivateKey();
	}

	public function getPublicKey()
	{
        return $this->publickey;
	}

	public function setPublicKey($x)
	{
        $this->publickey = $x;
	}

	public function newVote($score)
	{
        $scoretotal = $this->score * $this->votecount;
        $scoretotal += $score;
		$this->voteCount++;
        $this->score = $scoretotal / (float)$this->votecount;
    }

    public function replaceVote($oldscore, $score)
    {
        $scoretotal = $this->score * $this->votecount;
        $scoretotal += $score - $oldscore;
        $this->score = $scoretotal / (float)$this->votecount;
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
        $scoretotal = $this->score * $this->votecount;
        $scoretotal -= $score;
		$this->voteCount--;
        $this->score = $scoretotal / (float)$this->votecount;
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
        $this->shortdescription = $descr;
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
        return $this->usercount;
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
        return $this->votecount;
	}

    public function getInstallCount()
    {
        return $this->installcount;
    }

    public function increaseInstall()
    {
        return $this->installcount = $this->installCount + 1;
    }

    public function decreaseInstall()
    {
        return $this->installcount = $this->installCount - 1;
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
        return $this->cancreatefile;
	}

	/**
     * @param mixed $cancreatefile
	 */
    public function setCanCreateFile($cancreatefile)
    {
        $this->cancreatefile = $cancreatefile;
	}

	/**
	 * @return mixed
	 */
	public function getCreateFileData()
	{
        return json_decode($this->createfiledata, 1);
	}

	/**
     * @param mixed $createfiledata
	 */
    public function setCreateFileData($createfiledata)
    {
        $this->createfiledata = json_encode($createfiledata);
	}

	/**
	 * @return mixed
	 */
	public function getCreateFileDataRaw()
	{
        return $this->createfiledata;
	}

	/**
     * @param mixed $createfiledata
	 */
    public function setCreateFileDataRaw($createfiledata)
    {
        $this->createfiledata = $createfiledata;
	}

	/**
	 * @return mixed
	 */
	public function getisCapable()
	{
        return $this->iscapable;
	}

	/**
     * @param mixed $iscapable
	 */
    public function setIsCapable($iscapable)
    {
        $this->iscapable = $iscapable;
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
        return $this->messagemodule;
    }

    /**
     * @param mixed $messagemodule
     */
    public function setMessageModule($messagemodule)
    {
        $this->messagemodule = $messagemodule;
    }

    /**
     * @return mixed
     */
    public function getMessageModuleUrl()
    {
        return $this->messagemoduleurl;
    }

    /**
     * @param mixed $messagemodulurl
     */
    public function setMessageModuleUrl($messagemoduleurl)
    {
        $this->messagemoduleurl = $messagemoduleurl;
    }

    /**
     * @return mixed
     */
    public function getEditableRights()
    {
        return $this->editablerights;
    }

    /**
     * @param mixed $editablerights
     */
    public function setEditableRights($editablerights)
    {
        $this->editablerights = $editablerights;
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
        return $this->pricemonthly;
    }

    /**
     * @param mixed $pricemonthly
     */
    public function setPriceMonthly($pricemonthly)
    {
        $this->pricemonthly = $pricemonthly;
    }

    /**
     * @return mixed
     */
    public function getPriceUser()
    {
        return $this->priceuser;
    }

    /**
     * @param mixed $priceuser
     */
    public function setPriceUser($priceuser)
    {
        $this->priceuser = $priceuser;
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
        return $this->urlapp;
    }

    /**
     * @param mixed $urlapp
     */
    public function setUrlApp($urlapp)
    {
        $this->urlapp = $urlapp;
    }


    public function getAsArray()
	{
		return Array(
			"id" => $this->id,
			"name" => $this->name,
			"score" => $this->score,
            "nbvote" => $this->votecount,
            "nbInstall" => $this->installcount,
            "nbUsers" => $this->usercount,
			"description" => $this->description,
            "shortDescription" => $this->shortdescription,
            "priceMonthly" => $this->pricemonthly,
            "priceUser" => $this->priceuser,
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
        return $this->searchwords;
    }

    /**
     * @param mixed $searchwords
     */
    public function setSearchWords($searchwords)
    {
        $this->searchwords = $searchwords;
    }

    public function addSearchWord($searchword)
    {
        $this->searchwords .= " " . $searchword;
    }

}
