<?php

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * DriveFile
 *
 * @ORM\Table(name="drive_file",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DriveBundle\Repository\DriveFileRepository")
 */
class DriveFile
{
    /**
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace",cascade={"persist"})
     */
    private $group;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DriveBundle\Entity\DriveFile")
     * @ORM\JoinColumn(nullable=true)
     */
    private $parent;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $name;

    /**
     * @ORM\Column(type="string", length=16)
     */
    private $extension;

    /**
     * @ORM\Column(type="string", length=2048)
     */
    private $description;

    /**
     * @ORM\Column(type="boolean")
     */
    private $isDirectory;

    /**
     * @ORM\Column(type="boolean")
     */
    private $isInTrash;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DriveBundle\Entity\DriveFile")
     * @ORM\JoinColumn(nullable=true)
     */
    private $oldParent;

    /**
     * @ORM\OneToMany(targetEntity="WebsiteApi\DriveBundle\Entity\DriveFile", mappedBy="parent")
     */
    private $children;

    /**
     * @ORM\Column(type="datetime")
     */
    private $added;

    /**
     * @ORM\Column(type="datetime")
     */
    private $last_modified;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DriveBundle\Entity\DriveFileVersion")
     * @ORM\JoinColumn(nullable=true)
     */
    private $last_version;

    /**
     * @ORM\Column(type="bigint")
     */
    private $size;

    /**
     * @ORM\Column(type="string", length=2048)
     */
    private $cache;

    /**
     * @ORM\Column(type="boolean")
     */
    private $detached_file = false;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\DriveBundle\Entity\DriveFile")
	 */
	private $copyOf;

	/**
    * @ORM\Column(type="boolean")
    */
    private $shared = false;

    /**
     * @ORM\Column(type="string", length=2048, nullable = true)
     */
    private $url;

    /**
     * @ORM\Column(type="decimal")
     */
    private $opening_rate;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\MarketBundle\Entity\Application")
     * @ORM\JoinColumn(nullable=true)
     */
    private $default_app;


    public function __construct($group, $parent, $name, $isDirectory = false,$directoryToCopy = null, $url = null)
    {
        $this->group = $group;
        $this->setParent($parent);
        $this->setName($name);
        $this->setDescription("");
        $this->setSize(0);
        $this->isDirectory = $isDirectory;
        $this->setIsInTrash(false);
        $this->added = new \DateTime();
        $this->cache = "{}";
        $this->setLastModified();
        if ($directoryToCopy){
            $this->copyOf = $directoryToCopy;
        }
        if ($url != null){
            $this->setUrl($url);
        }
        $this->opening_rate = 0;
        $this->default_app = null;
    }

    public function getId()
    {
        return $this->id;
    }
    public function setId($newId)
    {
        return $this->id = $newId;
    }

    /**
     * @return mixed
     */
    public function getGroup()
    {
        return $this->group;
    }

    /**
     * @return mixed
     */
    public function getParent()
    {
        return $this->parent;
    }

    /**
     * @param mixed $parent
     */
    public function setParent($parent)
    {
        $this->parent = $parent;
    }

    /**
     * @return mixed
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param mixed $name
     */
    public function setName($name)
    {
        $this->name = $name;
        $array = explode(".", $name);
        $ext = array_pop($array);
        $this->setExtension($ext);
    }

    /**
     * @return mixed
     */
    public function getIsDirectory()
    {
        return $this->isDirectory;
    }

    /**
     * @return mixed
     */
    public function getIsInTrash()
    {
        return $this->isInTrash;
    }

    /**
     * @param mixed $isInTrash
     */
    public function setIsInTrash($isInTrash)
    {
        $this->isInTrash = $isInTrash;
    }

    /**
     * @return mixed
     */
    public function getOldParent()
    {
        return $this->oldParent;
    }

    /**
     * @param mixed $oldParent
     */
    public function setOldParent($oldParent)
    {
        $this->oldParent = $oldParent;
    }

    /**
     * @return mixed
     */
    public function getChildren()
    {
        return $this->children;
    }

    /**
     * Generate path from group id and realName
     */
    public function getPath()
    {
        if($this->getLastVersion() == null){
            return null;
        }
        if($this->getDetachedFile()){
            return "detached/".$this->group->getId() . "/" . $this->getLastVersion()->getRealName();
        }
        return $this->group->getId() . "/" . $this->getLastVersion()->getRealName();
    }

    /**
     * Generate preview path from group id and realName
     */
    public function getPreviewPath()
    {
        if($this->getLastVersion() == null){
            return null;
        }
        if($this->getDetachedFile()){
            return "detached/".$this->group->getId() . "/preview/" . $this->getLastVersion()->getRealName().".png";
        }
        return $this->group->getId() . "/preview/" . $this->getLastVersion()->getRealName().".png";
    }

    /**
     * @return mixed
     */
    public function getDescription()
    {
        return $this->description;
    }

    /**
     * @param mixed $description
     */
    public function setDescription($description)
    {
        $this->description = $description;
    }

    /**
     * @return mixed
     */
    public function getAdded()
    {
        return $this->added;
    }

    /**
     * @param mixed $added
     */
    public function setAdded($added)
    {
        $this->added = $added;
    }

    /**
     * @return mixed
     */
    public function getLastModified()
    {
        return $this->last_modified;
    }

    /**
     * @param mixed $last_modified
     */
    public function setLastModified()
    {
        $this->last_modified = new \DateTime();
    }

    /**
     * @return mixed
     */
    public function getLastVersion()
    {
        return $this->last_version;
    }

    /**
     * @param mixed $last_version
     */
    public function setLastVersion($last_version)
    {
        $this->last_version = $last_version;
    }

    /**
     * @return mixed
     */
    public function getSize()
    {
        return $this->size;
    }

    /**
     * @param mixed $size
     */
    public function setSize($size)
    {
        $this->size = $size;
        if($this->size < 10){
            $this->size = 10;
        }
    }

    /**
     * @return mixed
     */
    public function getExtension()
    {
        return strtolower($this->extension);
    }

    /**
     * @param mixed $extension
     */
    public function setExtension($extension)
    {
        $this->extension = $extension;
    }

    /**
     * @return mixed
     */
    public function getCache()
    {
        $cache = json_decode($this->cache, 1);
        return ($cache)?$cache:Array();
    }

    /**
     * @param mixed $cache
     */
    public function setCache($key, $cache)
    {
        $val = $this->getCache();
        $val[$key] = $cache;
        $this->cache = json_encode($val);
    }

    /**
     * @return mixed
     */
    public function getDetachedFile()
    {
        return $this->detached_file;
    }

    /**
     * @param mixed $detached_file
     */
    public function setDetachedFile($detached_file)
    {
        $this->detached_file = $detached_file;
    }

    /**
     * @return mixed
     */
    public function getCopyOf()
    {
        return $this->copyOf;
    }

    /**
     * @param mixed $copyOf
     */
    public function setCopyOf($copyOf)
    {
        $this->copyOf = $copyOf;
    }

    /**
     * @return mixed
     */
    public function getShared()
    {
        return $this->shared;
    }

    /**
     * @param mixed $shared
     */
    public function setShared($shared)
    {
        $this->shared = $shared;
    }

    /**
     * @return mixed
     */
    public function getUrl(){
        return $this->url;
    }

    /**
     * @param $url
     */
    public function setUrl($url){
        $this->url = $url;
    }

    /**
     * @return mixed
     */
    public function getOpeningRate(){
        return $this->opening_rate;
    }

    /**
     * @param $opening_rate
     */
    public function setOpeningRate($opening_rate){
        $this->opening_rate = $opening_rate;
    }

    /**
     * @return mixed
     */
    public function getDefaultApp(){
        return $this->default_app;
    }

    /**
     * @param $default_app
     */
    public function setDefaultApp($default_app){
        $this->default_app = $default_app;
    }

    public function getAsArray()
    {
        return Array(
            'id' => $this->getId(),
            'name' => $this->getName(),
            'description' => $this->getDescription(),
            'size' => $this->getSize(),
            'added' => $this->getAdded()->getTimestamp(),
            'parent' => (($this->getParent())?$this->getParent()->getId():0),
            'modified' => (($this->getLastModified())?$this->getLastModified()->getTimestamp():0),
            'isDirectory' => $this->getIsDirectory(),
            "extension" => $this->getExtension(),
            "groupId" => ($this->getGroup()) ? $this->getGroup()->getId() : "",
            "detached" => $this->getDetachedFile(),
            "cache" => $this->getCache(),
            "preview" => $this->getPreviewPath(),
            "copyOf" => ($this->getCopyOf()?$this->getCopyOf()->getId():null),
            "shared" => $this->getShared(),
            "url" => $this->getUrl(),
            "opening_rate" => $this->getOpeningRate(),
            "default_app" => $this->getDefaultApp()
        );
    }

}
