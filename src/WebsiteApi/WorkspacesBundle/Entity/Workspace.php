<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;




/**
 * Workspace
 *
 * @ORM\Table(name="workspace",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\WorkspaceRepository")
 */
class Workspace
{
	static $primary_number = 982451653.0;
	static $max_users = 10000000000.0;
	static $retrieve_number = 5907842317.0;
	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UploadBundle\Entity\File")
	 */
	protected $logo;
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;
	/**
	 * @ORM\Column(name="name", type="string", length=50)
	 */
	private $name;
	/**
	 * @ORM\Column(name="cleanName", type="string", length=50)
	 */
	private $cleanName;
	/**
	 * @ORM\Column(name="type", type="string", length=1)
	 */
	private $type;
	/**
	 * @ORM\Column(name="description", type="text")
	 */
	private $description = "";
	/**
	 * @ORM\Column(name="memberCount", type="integer")
	 */
	private $memberCount = 0;
	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceUser", mappedBy="Workspace")
	 */
	private $members;
	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\MarketBundle\Entity\LinkAppWorkspace", mappedBy="workspace")
	 */
	private $apps;
	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Level", mappedBy="groupe")
	 */
	private $levels;
	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\DiscussionBundle\Entity\Channel", mappedBy="workspace")
	 */
	private $channels;
	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\MarketBundle\Entity\LinkAppWorkspace", mappedBy="workspace")
	 */
	private $applications;
	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceParent", mappedBy="parent")
	 */
	private $children;
	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\PaymentsBundle\Entity\PaymentsHistory", mappedBy="workspace")
	 */
	private $paymentsHistory;
	/**
	 * @ORM\Column(name="privacy", type="string", length=1)
	 */
	private $privacy;
	/**
	 * @ORM\Column(name="street", type="string", length=255)
	 */
	private $street = "";
	/**
	 * @ORM\Column(name="city", type="string", length=255)
	 */
	private $city = "";
	/**
	 * @ORM\Column(name="zipCode", type="string", length=20)
	 */
	private $zipCode = "";
	/**
	 * @ORM\Column(name="country", type="string", length=255)
	 */
	private $country = "";
	/**
	 * @ORM\Column(name="phones", type="array")
	 */
	private $phones = Array();
	/**
	 * @ORM\Column(name="emails", type="array")
	 */
	private $emails = Array();
	/**
	 * @ORM\Column(name="rna", type="string", length=10)
	 */
	private $rna = "";
	/**
	 * @ORM\Column(name="siret", type="string", length=14)
	 */
	private $siret = "";
	/**
	 * @ORM\Column(name="official", type="boolean")
	 */
	private $official = false;
	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $paymaster = null;
	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\PaymentsBundle\Entity\PriceLevel")
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $priceLevel = null;
	/**
	 * @ORM\Column(name="abonnement", type="datetime",nullable=true)
	 */
	private $abonnement;
	/**
	 * @ORM\Column(name="keyCode", type="string", length=255)
	 */
	private $keyCode = "";
	/**
	 * @ORM\Column(name="driveSize", type="integer")
	 */
	private $driveSize = 1000; //In Mo
	/**
	 * @ORM\Column(name="customizationData", type="text")
	 */
	private $customizationData = "{}";
    /**
     * @ORM\Column(name="isDeleted", type="boolean")
     */
    private $isDeleted = false;

	static function fromAlphabeticalCode($str)
	{
		return base_convert($str, 36, 10);
	}

	static function getIdFromKey($identifier)
	{
		//$number = bcmod(bcmul($identifier - Workspace::$max_users, Workspace::$retrieve_number), Workspace::$max_users);
        $number = 0;
        return $number;
	}

	public function getPaymentsHistory()
	{
		return $this->paymentsHistory;
	}

	public function getChildrenWorkspaces()
	{
		$children = Array();
		foreach ($this->children as $child) {
			$children[] = $child->getChild();
		}

		return $children;
	}

	public function getApplications()
	{

		$applications = Array();
		foreach ($this->applications as $application) {
			$applications[] = $application->getApplication();
		}

		return $applications;
	}

	public function getCleanName()
	{
		return $this->cleanName;
	}

	public function setCleanName($cname)
	{
		$this->cleanName = $cname;
	}

	public function getType()
	{
		return $this->type;
	}

	public function setType($type)
	{
		$this->type = $type;
	}

	public function getMemberCount()
	{
		return $this->memberCount;
	}

	public function setMemberCount($memberCount)
	{
		$this->memberCount = $memberCount;
	}

	public function getPrivacy()
	{
		return $this->privacy;
	}

	public function setPrivacy($privacy)
	{
		$this->privacy = $privacy;
	}

	public function getStreet()
	{
		return $this->street;
	}

	public function setStreet($street)
	{
		$this->street = $street;
	}

	public function getCity()
	{
		return $this->city;
	}

	public function setCity($city)
	{
		$this->city = $city;
	}

	public function getZipCode() {
		return $this->zipCode;
	}

	public function setZipCode($zipCode)
	{
		$this->zipCode = $zipCode;
	}

	public function getCountry() {
		return $this->country;
	}

	public function setCountry($country)
	{
		$this->country = $country;
	}

	public function getPhones() {
		return $this->phones;
	}

	public function setPhones($phones)
	{
		$this->phones = $phones;
	}

	public function getEmails() {
		return $this->emails;
	}

	public function setEmails($emails)
	{
		$this->emails = $emails;
	}

	public function getRna() {
		return $this->rna;
	}

	public function setRna($rna)
	{
		$this->rna = $rna;
	}

	public function getSiret() {
		return $this->siret;
	}

	public function setSiret($siret)
	{
		$this->siret = $siret;
	}

	public function getLevels()
	{
		return $this->levels;
	}

	/**
	 * @return mixed
	 */
	public function getOfficial()
	{
		return $this->official;
	}

	/**
	 * @param mixed $official
	 */
	public function setOfficial($official)
	{
		$this->official = $official;
	}

	/**
	 * @return mixed
	 */
	public function getMembers()
	{
		return $this->members;
	}

	/**
	 * @param mixed $members
	 */
	public function setMembers($members)
	{
		$this->members = $members;
	}

	/**
	 * @return mixed
	 */
	public function getMembersUsers()
	{
		$users = Array();

		foreach ($this->members as $member) {
			if ($member->getStatus() == "A") {
				$users[] = $member->getUser();
			}
		}

		return $users;
	}

	public function getChannels()
	{

		return $this->channels;
	}

	public function getAsSimpleArray($sendApps = true)
	{
		return Array(
			"id" => $this->getId(),
			"key" => $this->getKey(),
			"name" => $this->getName(),
			"description" => $this->getDescription(),
			"csslogo" => $this->getCssLogo(),
			"logo" => $this->getUrlLogo(),
			"customization" => $this->getCustomizationData(),
			"apps" => $sendApps ? $this->getAppsAsArray() : Array(),
			"levelId" => $this->getPriceLevel() == null ? 0 : $this->getPriceLevel()->getAsArray(),
			"abonnement" => $this->getAbonnementRec()
		);
	}

	public function getId()
	{
		return $this->id;
	}

	public function getKey()
	{
		return mb_strtoupper(Workspace::toAlphabeticalCode(Workspace::getKeyFromId($this->getId())));
	}

	static function toAlphabeticalCode($nb)
	{
		return base_convert($nb, 10, 36);
	}

	static function getKeyFromId($id)
	{
		//$number = Workspace::$max_users + bcmod($id * Workspace::$primary_number, Workspace::$max_users);
        $number = 0;
        return $number;
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

	public function setDescription($description)
	{
		$this->description = $description;
	}

	public function getCssLogo()
	{
		if ($this->getUrlLogo() != "") {
			return "background-image: url('" . $this->getUrlLogo() . "')";
		}
		return "";
	}

	public function getUrlLogo()
	{
		if ($this->getLogo() == null) {
			return "";
		}
		return $this->getLogo()->getPublicURL(2);
	}

	/**
	 * @return mixed
	 */
	public function getLogo()
	{
		return $this->logo;
	}

	/**
	 * @param mixed $logo
	 */
	public function setLogo($logo)
	{
		$this->logo = $logo;
	}

	public function getAppsAsArray()
	{
		$apps = $this->getApps();
		$arr = Array();
		foreach ($apps as $app) {
			$appli = $app->getApplication()->getAsSimpleArray();

			if (!(substr($appli['url'], 0, 4) === "http")) {
				$appli['internal'] = true;
			}
			$arr[] = $appli;

		}

		return $arr;
	}

	public function getApps()
	{
		return $this->apps;
	}

	public function getPriceLevel()
	{
		return $this->priceLevel;
	}

	public function setPriceLevel($priceLevel)
	{
		$this->priceLevel = $priceLevel;
	}

	public function getAbonnementRec()
	{
		if ($this->abonnement == null) {
			if ($this->getPaymaster() == null) {
				return null;
			}
			return $this->getPaymaster()->getAbonnement();
		} else {
			return $this->getAbonnement();
		}
	}

	public function getPaymaster()
	{
		return $this->paymaster;
	}

	public function setPaymaster($paymaster)
	{
		$this->paymaster = $paymaster;
	}

	public function getAbonnement()
	{
		return $this->abonnement;
	}

	public function setAbonnement($x)
	{
		$this->abonnement = $x;
	}

	public function getKeyCode(){
		return $this->keyCode;
	}
	public function setKeyCode($x){
		return $this->keyCode = $x;
	}

	/**
	 * @return mixed
	 */
	public function getDriveSize()
	{
		return $this->driveSize * 1000000;
	}

	/**
	 * @param mixed $driveSize
	 */
	public function setDriveSize($driveSize)
	{
		$this->driveSize = intval($driveSize / 1000000);
	}

    /**
     * @return mixed
     */
    public function getisDeleted()
    {
        return $this->isDeleted;
    }

    /**
     * @param mixed $isDeleted
     */
    public function setIsDeleted($isDeleted)
    {
        $this->isDeleted = $isDeleted;
    }

	/**
	 * @return mixed
	 */
	public function getCustomizationData()
	{
		return json_decode($this->customizationData, true);
	}

	/**
	 * @param mixed $customizationData
	 */
	public function setCustomizationData($customizationData)
	{
		$encoded = json_encode($customizationData);
		if (strlen($encoded) < 2048) {
			$this->customizationData = $encoded;
		}
	}

}
