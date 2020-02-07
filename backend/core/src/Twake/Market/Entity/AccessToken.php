<?php


namespace Twake\Market\Entity;

use Doctrine\ORM\Mapping as ORM;

use Twake\Workspaces\Entity\Workspace;

/**
 * Message
 *
 * @ORM\Table(name="access_token",options={"engine":"MyISAM", "scylladb_keys": {{"atoken": "ASC", "id": "ASC"}}} )
 * @ORM\Entity()
 */
class AccessToken
{
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="atoken", type="twake_no_salt_text")
     */
    private $atoken;

    /**
     * @ORM\Column(name="application_id", type="twake_timeuuid")
     */
    private $application_id;

    /**
     * @ORM\Column(name="group_id", type="twake_timeuuid")
     */
    private $group_id;

    /**
     * @ORM\Column(name="workspace_id", type="twake_timeuuid")
     */
    private $workspace_id;

    /**
     * @ORM\Column(name="user_id", type="twake_timeuuid")
     */
    private $user_id;


    /**
     * @param mixed $tokenaL21
     *
     */
    public function resetToken()
    {
        $this->atoken = bin2hex(random_bytes(64));
    }


    public function __construct($application_id, $workspace_id, $group_id, $user_id)
    {
        $this->resetToken();
        $this->setApplicationId($application_id);
        $this->setWorkspaceId($workspace_id);
        $this->setGroupId($group_id);
        $this->setUserId($user_id);

    }

    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param mixed $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return mixed
     */
    public function getToken()
    {
        return $this->atoken;
    }

    /**
     * @param mixed $token
     */
    public function setToken($atoken)
    {
        $this->atoken = $atoken;
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
    public function getGroupId()
    {
        return $this->group_id;
    }

    /**
     * @param mixed $group_id
     */
    public function setGroupId($group_id)
    {
        $this->group_id = $group_id;
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
    public function getUserId()
    {
        return $this->user_id;
    }

    /**
     * @param mixed $user_id
     */
    public function setUserId($user_id)
    {
        $this->user_id = $user_id;
    }

    public function getAsArray()
    {
        return Array(
            "user_id" => $this->getUserId(),
            "workspace_id" => $this->getWorkspaceId(),
            "group_id" => $this->getGroupId(),
            "app_id" => $this->getApplicationId()
        );
    }


}