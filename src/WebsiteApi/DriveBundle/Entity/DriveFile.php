<?php

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\CoreBundle\Entity\FrontObject;
use WebsiteApi\CoreBundle\Entity\SearchableObject;
use WebsiteApi\ObjectLinksBundle\Model\ObjectLinksInterface;

/**
 * DriveFile
 *
 * @ORM\Table(name="drive_file",options={"engine":"MyISAM", "scylladb_keys": {{"workspace_id":"ASC", "parent_id":"ASC", "isintrash": "ASC", "id":"DESC"}, {"id": "DESC"}, {"previewhasbeengenerated": "DESC"}} })
 * @ORM\Entity(repositoryClass="WebsiteApi\DriveBundle\Repository\DriveFileRepository")
 */
class DriveFile extends SearchableObject implements ObjectLinksInterface
{
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="workspace_id", type="text")
     * @ORM\Id
     */
    private $workspace_id;

    /**
     * @ORM\Column(name="parent_id", type="text")
     * @ORM\Id
     */
    private $parent_id;

    /**
     * @ORM\Column(type="twake_boolean")
     * @ORM\Id
     */
    private $isintrash = false;

    /**
     * @ORM\Column(name="root_group_folder_id", type="twake_timeuuid", nullable=true)
     */
    private $root_group_folder = NULL;

    /**
     * @ORM\Column(type="string", length=512)
     */
    private $public_access_key = "";

    /**
     * @ORM\Column(type="twake_text")
     * @Encrypted
     */
    private $name;

    /**
     * @ORM\Column(type="string", length=16)
     */
    private $extension;

    /**
     * @ORM\Column(type="twake_text")
     * @Encrypted
     */
    private $description;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $isdirectory;

    /**
     * @ORM\Column(name="old_parent", type="text")
     */
    private $old_parent;

    /**
     * @ORM\OneToMany(targetEntity="WebsiteApi\DriveBundle\Entity\DriveFile", mappedBy="parent")
     */
    private $children;

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $added;

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $last_modified;

    /**
     * @ORM\Column(name="last_version_id", type="text")
     */
    private $last_version_id;

    /**
     * @ORM\Column(name="creator", type="text")
     */
    private $creator;


    /**
     * @ORM\Column(type="twake_bigint")
     */
    private $size;

    /**
     * @ORM\Column(type="twake_text")
     * @Encrypted
     */
    private $cache;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $detached_file = false;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $previewhasbeengenerated = false;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $has_preview = false;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DriveBundle\Entity\DriveFile")
     */
    private $copyof;



    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $shared = false;

    /**
     * @ORM\Column(type="twake_text", nullable = true)
     * @Encrypted
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
    private $default_web_app;

    /**
     * @ORM\Column(type="twake_text", nullable = true)
     * @Encrypted
     */
    private $preview_link = "";

    /**
     * @ORM\Column(type="twake_text", nullable=true)
     * @Encrypted
     */
    private $object_link_cache;

    /**
     * @ORM\Column(name ="content_keywords", type="twake_text", nullable=true)
     */
    private $content_keywords;

    /**
     * @ORM\Column(name ="access_info", type="twake_text", nullable=true)
     */
    private $acces_info;

    /**
     * @ORM\Column(name="application_id", type="twake_text", nullable=true)
     */
    private $application_id = null;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $external_storage = false;

    /**
     * @ORM\Column(name="hidden_data", type="twake_text")
     */
    private $hidden_data = "{}";

    /**
     * @ORM\Column(name="last_user", type="twake_text", nullable=true)
     * @Encrypted
     */
    private $last_user;

    protected $es_type = "drive_file";

    public function __construct($workspace_id, $parent_id, $isdirectory = false)
    {
        parent::__construct();
        $this->workspace_id = $workspace_id;
        $this->setParentId($parent_id);
        $this->isdirectory = $isdirectory;

        $this->setName("");
        $this->setDescription("");
        $this->setSize(0);
        $this->setIsInTrash(false);
        $this->added = new \DateTime();
        $this->cache = "{}";
        $this->setLastModified();
        $this->opening_rate = 0;
        $this->default_web_app = null;
        $this->setPreviewHasBeenGenerated(false);
    }

    /**
     * @return mixed
     */
    public function getAccesInfo()
    {
        return json_decode($this->acces_info, true);
    }

    /**
     * @param mixed $acces_info
     */
    public function setAccesInfo($acces_info)
    {
        $this->acces_info = json_encode($acces_info);
    }


    public function getIndexationArray()
    {
        return Array(
            "id" => $this->getId()."",
            "type" => $this->getExtension(),
            "name"=> $this->getName(),
            "creation_date" => ($this->getAdded() ? $this->getAdded()->format('Y-m-d') : null),
            "creator" => $this->getCreator(),
            "size" => $this->getSize(),
            "date_last_modified" => ($this->getLastModified() ? $this->getLastModified()->format('Y-m-d') : null),
            "workspace_id" => $this->getWorkspaceId(),
            "keywords" => $this->getContentKeywords()
        );
    }

    /**
     * @return mixed
     */
    public function getCreator()
    {
        return $this->creator;
    }

    /**
     * @param mixed $creator
     */
    public function setCreator($creator)
    {
        $this->creator = $creator;
    }



    public function setId($id)
    {
        $this->id = $id;
    }

    public function getId()
    {
        return $this->id;
    }

    /**
     * @return mixed
     */
    public function getLastUser()
    {
        return $this->last_user;
    }

    /**
     * @param mixed $last_user
     */
    public function setLastUser($last_user)
    {
        $this->last_user = $last_user;
    }

    /**
     * @return mixed
     */
    public function getContentKeywords()
    {
        return json_decode($this->content_keywords, true);
    }

    /**
     * @param mixed $content_keywords
     */
    public function setContentKeywords($content_keywords)
    {
        $this->content_keywords = json_encode($content_keywords);
    }

    /**
     * @return mixed
     */
    public function getWorkspaceId()
    {
        return $this->workspace_id;
    }

    /**
     * @return mixed
     */
    public function setWorkspaceId($wid)
    {
        $this->workspace_id = $wid;
    }

    /**
     * @return mixed
     */
    public function getParentId()
    {
        return $this->parent_id;
    }

    /**
     * @param mixed $parent
     */
    public function setParentId($parent_id)
    {
        $this->parent_id = $parent_id . "";
        if ($parent_id) {
            $this->root_group_folder = NULL;
        } else {
            $this->root_group_folder = $this->getWorkspaceId() . "";
        }
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
        $ext = "";
        if (count($array) > 1) {
            $ext = array_pop($array);
        }
        $this->setExtension($ext);
    }

    /**
     * @return mixed
     */
    public function getPublicAccessKey()
    {
        return $this->public_access_key;
    }

    /**
     * @param mixed $public_access_key
     */
    public function setPublicAccessKey($public_access_key)
    {
        $this->public_access_key = $public_access_key;
    }

    /**
     * @return mixed
     */
    public function getIsDirectory()
    {
        return $this->isdirectory;
    }

    /**
     * @return mixed
     */
    public function getIsInTrash()
    {
        return $this->isintrash;
    }

    /**
     * @param mixed $isintrash
     */
    public function setIsInTrash($isintrash)
    {
        $this->isintrash = $isintrash;
    }

    /**
     * @return mixed
     */
    public function getOldParent()
    {
        return $this->old_parent;
    }

    /**
     * @param mixed $old_parent
     */
    public function setOldParent($old_parent)
    {
        $this->old_parent = $old_parent;
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
        if ($this->getLastVersionId() == null) {
            return null;
        }

        if($this->getDetachedFile()){
            return "" . $this->workspace_id . "/" . $this->getLastVersionId();
        }
        return $this->workspace_id . "/" . $this->getLastVersionId();
    }

    /**
     * Generate preview path from group id and realName
     */
    public function getPreviewPath()
    {
        if ($this->getLastVersionId() == null) {
            return null;
        }
        if($this->getDetachedFile()){
            return "" . $this->workspace_id . "/preview/" . $this->getLastVersionId() . ".png";
        }
        return $this->workspace_id . "/preview/" . $this->getLastVersionId() . ".png";
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
    public function getLastVersionId()
    {
        return $this->last_version_id;
    }

    /**
     * @param mixed $last_version
     */
    public function setLastVersionId($last_version_id)
    {
        $this->last_version_id = $last_version_id . "";
    }

    //TODO Very very bad to pass doctrine as parameter here...
    public function getLastVersion($doctrine)
    {
        $repo = $doctrine->getRepository("TwakeDriveBundle:DriveFileVersion");
        return $repo->find($this->getLastVersionId());
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
            $this->size = 0;
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
        if (!$this->getIsDirectory()) {
            $this->extension = $extension;
        } else {
            $this->extension = "";
        }
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
        return $this->copyof;
    }

    /**
     * @param mixed $copyof
     */
    public function setCopyOf($copyof)
    {
        $this->copyof = $copyof;
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
    public function getDefaultWebApp()
    {
        return $this->default_web_app;
    }

    /**
     * @param $default_web_app
     */
    public function setDefaultWebApp($default_web_app)
    {
        $this->default_web_app = $default_web_app;
    }

    public function getAsArray()
    {
        return Array(
            'id' => $this->getId(),
            'front_id' => $this->getFrontId(),
            "workspace_id" => $this->getWorkspaceId(),
            'parent_id' => $this->getParentId(),
            "detached" => $this->getDetachedFile(),
            "trash" => $this->getIsInTrash(),

            'is_directory' => $this->getIsDirectory(),
            "creator" => $this->getCreator(),
            'name' => $this->getName(),
            'description' => $this->getDescription(),
            "last_user" => $this->getLastUser(),
            'size' => $this->getSize()?$this->getSize():0,
            'added' => $this->getAdded() ? $this->getAdded()->getTimestamp() : null,
            'modified' => (($this->getLastModified())?$this->getLastModified()->getTimestamp():0),
            "extension" => $this->getExtension(),
            "cache" => $this->getCache(),
            "preview_link" => $this->getPreviewLink(),
            "copy_of" => ($this->getCopyOf() ? $this->getCopyOf()->getId() : null),
            "shared" => $this->getShared(),
            "url" => $this->getUrl(),
            "opening_rate" => $this->getOpeningRate(),
            "has_preview" => $this->getHasPreview(),
            "preview_has_been_generated" => $this->getPreviewHasBeenGenerated(),
            "default_web_app_id" => $this->getDefaultWebApp() ? $this->getDefaultWebApp()->getId() : null,
            "object_link_cache" => $this->getObjectLinkCache(),
            //"keywords" => $this->getContentKeywords()
            "acces_info" => $this->getAccesInfo(),
            "application_id" => $this->getApplicationId(),
            "external_storage" => $this->getExternalStorage(),
            "hidden_data" => $this->getHiddenData()

        );
    }

    /**
     * @return mixed
     */
    public function getExternalStorage()
    {
        return $this->external_storage;
    }

    /**
     * @param mixed $external_storage
     */
    public function setExternalStorage($external_storage)
    {
        $this->external_storage = $external_storage;
    }

    /**
     * @return mixed
     */
    public function getPreviewHasBeenGenerated()
    {
        return $this->previewhasbeengenerated;
    }

    /**
     * @param mixed $previewhasbeengenerated
     */
    public function setPreviewHasBeenGenerated($previewhasbeengenerated)
    {
        $this->previewhasbeengenerated = $previewhasbeengenerated;
    }


    public function getRepository(){
        return "TwakeDriveBundle:DriveFile";
    }

    public function getAsArrayFormated(){
        return Array(
            "id" => $this->getId(),
            "title" => "File",
            "object_name" => $this->getName(),
            "object_data" => Array(
                "preview_link" => $this->getPreviewLink(),
                "extension" => $this->getExtension(),
                "groupId" => ($this->getGroup()) ? $this->getGroup()->getId() : "",
                'parent' => (($this->getParent()) ? $this->getParent()->getId() : 0),
                "default_web_app_id" => $this->getDefaultWebApp() ? $this->getDefaultWebApp()->getId() : null
            ),
            "key" => "drive",
            "type" => "file",
            "code" => "twake/" . ($this->getParent() ? $this->getParent()->getId() : 0) . "/" . $this->getId(),
        );
    }

    public function synchroniseField($fieldname, $value)
    {
        if (!property_exists($this, $fieldname))
            return false;

        $setter = "set" . ucfirst($fieldname);
        $this->$setter($value);
        return true;
    }

    public function get($fieldname)
    {
        if (!property_exists($this, $fieldname))
            return false;

        $getter = "get" . ucfirst($fieldname);

        return $this->$getter();
    }

    public function getPushRoute()
    {
        return "drive/".$this->getId();
    }

    /**
     * @param mixed $group
     */
    public function setGroup($group)
    {
        $this->group = $group;
    }

    public function hasPreviewLink()
    {
        return !!$this->preview_link;
    }

    /**
     * @return mixed
     */
    public function getPreviewLink()
    {
        if (!$this->preview_link) {
            return "/ajax/drive/preview?f=" . $this->getLastVersionId() . "&w=" . $this->getWorkspaceId() . "&d=" . $this->getParentId() . "&t=" . $this->getIsInTrash();
        }
        return $this->preview_link;
    }

    /**
     * @param mixed $preview_link
     */
    public function setPreviewLink($preview_link)
    {
        $this->preview_link = $preview_link;
    }


    public function finishSynchroniseField($data)
    {
        // TODO: Implement finishSynchroniseField($data) method.
    }

    public function setObjectLinkCache($cache)
    {
        $this->object_link_cache = json_encode($cache);
    }

    public function getObjectLinkCache()
    {
        return json_decode($this->object_link_cache, 1);
    }

    /**
     * @return mixed
     */
    public function getHasPreview()
    {
        return $this->has_preview;
    }

    /**
     * @param mixed $haspreview
     */
    public function setHasPreview($has_preview)
    {
        $this->has_preview = $has_preview;
    }

    /**
     * @return mixed
     */
    public function getApplicationId()
    {
        return $this->application_id;
    }

    /**
     * @param mixed $application_id
     */
    public function setApplicationId($application_id)
    {
        $this->application_id = $application_id;
    }

    /**
     * @return mixed
     */
    public function getHiddenData()
    {
        if (!$this->hidden_data) {
            return Array();
        }
        return json_decode($this->hidden_data, 1);
    }

    /**
     * @param mixed $hidden_data
     */
    public function setHiddenData($hidden_data)
    {
        $this->hidden_data = json_encode($hidden_data);
    }


}
