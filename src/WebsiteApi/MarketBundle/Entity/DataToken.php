<?php


namespace WebsiteApi\MarketBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;

/**
 * Message
 *
 * @ORM\Table(name="data_token",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\MarketBundle\Repository\DataTokenRepository")
 */
class DataToken
{
    /**
     * @ORM\Column(name="id", type="cassandra_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=500)
     */
    private $token;

    /**
     * @ORM\Column(type="integer")
     */
    private $workspaceId;

    /**
     * @ORM\Column(type="integer")
     */
    private $userId;

    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param mixed $tokenaL21
     *
     */
    public function resetToken()
    {
        $this->token = bin2hex(random_bytes(64));
    }

    /**
     * @return mixed
     */
    public function getUserId()
    {
        return $this->userId;
    }

    /**
     * @param mixed $userId
     */
    public function setUserId($userId)
    {
        $this->userId = $userId;
    }

    /**
     * @return mixed
     */
    public function getWorkspaceId()
    {
        return $this->workspaceId;
    }

    /**
     * @param mixed $workspaceId
     */
    public function setWorkspaceId($workspaceId)
    {
        $this->workspaceId = $workspaceId;
    }

    public function __construct($workspaceId, $userId)
    {
        $this->setId(1);
        $this->resetToken();
        $this->setUserId($userId);
        $this->setWorkspaceId($workspaceId);
    }

    private function setId($int)
    {
        $this->id = $int;
    }

    /**
     * @return mixed
     */
    public function getToken()
    {
        return $this->token;
    }

}