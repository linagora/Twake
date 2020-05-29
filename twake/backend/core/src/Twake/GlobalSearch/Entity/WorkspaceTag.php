<?php

namespace Twake\GlobalSearch\Entity;

use Doctrine\ORM\Mapping as ORM;

use Twake\Core\Entity\FrontObject;

/**
 * Tag
 *
 * @ORM\Table(name="workspacetag",options={"engine":"MyISAM", "scylladb_keys": {{"workspace_id": "ASC", "id": "DESC"}, {"id": "ASC"} } })
 * @ORM\Entity()
 */
class WorkspaceTag extends FrontObject
{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="workspace_id", type="twake_timeuuid")
     * @ORM\Id
     */
    protected $workspace_id;

    /**
     * @ORM\Column(name ="name", type="twake_text", nullable=true)
     */
    protected $name;

    /**
     * @ORM\Column(name ="color", type="twake_text", nullable=true)
     */
    protected $color;

    public function __construct($workspace_id, $name)
    {
        $this->workspace_id = $workspace_id;
        $this->name = $name;

    }

    public function getAsArray()
    {
        $return = Array(
            "id" => $this->getId(),
            "front_id" => $this->getFrontId(),
            "workspace_id" => $this->getWorkspaceId(),
            "name" => $this->getName(),
            "color" => $this->getColor()
        );
        return $return;
    }

    /**
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param int $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }


    /**
     * @return mixed
     */
    public function getWorkspaceId()
    {
        return $this->workspace_id;
    }

    /**
     * @param mixed $workspace_id
     */
    public function setWorkspaceId($workspace_id)
    {
        $this->workspace_id = $workspace_id;
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


}