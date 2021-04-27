<?php

namespace Twake\Workspaces\Entity;


use Doctrine\ORM\Mapping as ORM;


/**
 * WorkspaceUser
 *
 * @ORM\Table(name="workspace_user",options={"engine":"MyISAM", "scylladb_keys": {{"workspace_id":"ASC", "user_id": "DESC", "id":"ASC"}, {"level_id":"ASC"}, {"user_id": "DESC"}} })
 * @ORM\Entity()
 */
class WorkspaceUser
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
    private $workspace_id;

    /**
     * @ORM\Column(name="user_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $user_id;

    /**
     * @ORM\Column(name="role", type="string")
     */
    private $role = "member"; // "member" | "moderator"

    /**
     * @ORM\Column(name="level_id", type="twake_timeuuid")
     */
    private $level_id; //Depreciated

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $date_added;

    /**
     * @ORM\Column(type="twake_datetime", options={"default" : "1970-01-02"})
     */
    private $last_access;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $hasnotifications = false;

    /**
     * @ORM\Column(name="is_externe", type="twake_boolean")
     */
    private $externe;

    /**
     * @ORM\Column(name="is_auto_add_externe", type="twake_boolean")
     */
    private $auto_add_externe;

    public function __construct($workspace, $user, $level_id)
    {
        $this->workspace_id = $workspace->getId();
        $this->user_id = $user->getId();

        $this->level_id = $level_id;
        $this->date_added = new \DateTime();
        $this->last_access = new \DateTime();
    }

    /**
     * @return int
     */
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
    public function getWorkspace($em)
    {
        $workspacesRepository = $em->getRepository("Twake\Workspaces:Workspace");
        return $workspacesRepository->find($this->workspace_id);
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
    public function getUser($em)
    {
        $repo = $em->getRepository("Twake\Users:User");
        return $repo->find($this->user_id);
    }

    /**
     * @return mixed
     */
    public function getUserId()
    {
        return $this->user_id;
    }

    /**
     * @return mixed
     */
    public function getRole()
    {
        return $this->role ?: "member";
    }

    /**
     * @param mixed $level
     */
    public function setRole($role)
    {
        $this->role = $role;
    }

    /**
     * @return mixed
     */
    public function getLevelId()
    {
        return $this->level_id;
    }

    /**
     * @param mixed $level
     */
    public function setLevelId($level)
    {
        $this->level_id = $level;
    }

    /**
     * @return mixed
     */
    public function getDateAdded()
    {
        return $this->date_added;
    }

    /**
     * @return mixed
     */
    public function getLastAccess()
    {
        return $this->last_access;
    }

    /**
     * @param mixed $last_access
     */
    public function setLastAccess()
    {
        $this->last_access = new \DateTime();
    }

    /**
     * @return mixed
     */
    public function getisHidden()
    {
        //return $this->ishidden;
    }

    /**
     * @param mixed $ishidden
     */
    public function setIsHidden($ishidden)
    {
        //$this->ishidden = $ishidden;
    }

    /**
     * @return mixed
     */
    public function getisFavorite()
    {
        //return $this->isfavorite;
    }

    /**
     * @param mixed $isfavorite
     */
    public function setIsFavorite($isfavorite)
    {
        //$this->isfavorite = $isfavorite;
    }

    /**
     * @return mixed
     */
    public function getHasNotifications()
    {
        return $this->hasnotifications;
    }

    /**
     * @param mixed $hasnotifications
     */
    public function setHasNotifications($hasnotifications)
    {
        $this->hasnotifications = $hasnotifications;
    }

    /**
     * @return mixed
     */
    public function getExterne()
    {
        return $this->externe;
    }

    /**
     * @param mixed $isclient
     */
    public function setExterne($externe)
    {
        $this->externe = $externe;
    }

    /**
     * @return mixed
     */
    public function getAutoAddExterne()
    {
        return $this->auto_add_externe;
    }

    /**
     * @param mixed $isclient
     */
    public function setAutoAddExterne($auto_add_externe)
    {
        $this->auto_add_externe = $auto_add_externe;
    }

    public function getAsArray($em)
    {
        return Array(
            "id" => $this->getId(),
            "user" => $this->getUser($em),
            "user_id" => $this->getUserId(),
            "workspace_id" => $this->getWorkspaceId(),
            "workspace" => $this->getWorkspace($em),
            "role" => $this->getRole(),
            "level_id" => $this->getLevelId(),
            "date_added" => $this->getDateAdded(),
            "last_access" => $this->getLastAccess(),
            "hasnotifications" => $this->getHasNotifications(),
            "externe" => $this->getExterne(),
            "auto_add_externe" => $this->getAutoAddExterne()
        );
    }

}
