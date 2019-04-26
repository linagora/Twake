<?php


namespace WebsiteApi\GlobalSearchBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\CoreBundle\Entity\SearchableObject;

/**
 * Application
 *
 * @ORM\Table(name="file",options={"engine":"MyISAM", "scylladb_keys": {{"group_id": "ASC", "app_group_name": "ASC", "id": "ASC"}, {"id": "ASC"}, {"simple_name": "ASC"}, {"default": "ASC"}}})
 * @ORM\Entity(repositoryClass="WebsiteApi\GlobalSearhcBundle\Repository\FileRepository")
 */
class File extends SearchableObject
{

    protected $es_type = "file";

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    protected $id;
    /**
     * @ORM\Column(name="username", type="twake_text", options={"index": true})
     * @Encrypted
     */
    protected $name="";
    /**
     * @ORM\Column(name="fullname", type="twake_text", options={"index": true})
     * @Encrypted
     */
    protected $type="";
    /**
     * @ORM\Column(name="creation_date", type="date",options={"index": true})
     */
    protected $creation_date="";

    public function getAsArray()
    {
        $return = Array(
            "id" => $this->getId(),
            "name" => $this->getName(),
            "type" => $this->getType(),
            "creation_date" => $this->getDate(),
        );
        return $return;
    }

    public function getId()
    {
        return $this->id;
    }

    public function getName()
    {
        return $this->name;
    }

    public function getType()
    {
        return $this->type;
    }

    public function getDate()
    {
        return $this->creation_date;
    }


}