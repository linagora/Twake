<?php

namespace WebsiteApi\ProjectBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * linkBoardWorkspace
 *
 * @ORM\Table(name="linkBoardWorkspace",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\ProjectBundle\Repository\LinkBoardWorkspaceRepository")
 */

class LinkBoardWorkspace{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="cassandra_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
     */
    private $workspace;

    /**
     * @ORM\Column(name="boardright", type="boolean")
     */
    private $boardRight;

    /**
     * @ORM\Column(name="owner", type="boolean")
     */
    private $owner;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\ProjectBundle\Entity\Board")
     */
    private $board;

    public  function __construct($workspace,$board,$owner,$boardRight = true)
    {
        $this->setWorkspace($workspace);
        $this->setBoard($board);
        $this->setOwner($owner);
        $this->setBoardRight($boardRight);
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
    public function getWorkspace()
    {
        return $this->workspace;
    }

    /**
     * @param mixed $workspace
     */
    public function setWorkspace($workspace)
    {
        $this->workspace = $workspace;
    }

    /**
     * @return mixed
     */
    public function getBoard()
    {
        return $this->board;
    }

    /**
     * @param mixed $board
     */
    public function setBoard($board)
    {
        $this->board = $board;
    }

    /**
     * @return mixed
     */
    public function getBoardRight()
    {
        return $this->boardRight;
    }

    /**
     * @param mixed $right
     */
    public function setBoardRight($boardRight)
    {
        $this->boardRight = $boardRight;
    }

    /**
     * @return mixed
     */
    public function getOwner()
    {
        return $this->owner;
    }

    /**
     * @param mixed $owner
     */
    public function setOwner($owner)
    {
        $this->owner = $owner;
    }

    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "workspace" => $this->getWorkspace(),
            "board" => $this->getBoard(),
            "owner" => $this->getOwner(),
            "right" => $this->getBoardRight()
        );
    }


}