<?php


namespace WebsiteApi\MarketBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;
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
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=500)
     */
    private $token;

    /**
     * @ORM\Column(type="integer")
     */
    private $workspaceid;

    /**
     * @ORM\Column(type="integer")
     */
    private $userid;

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
        return $this->userid;
    }

    /**
     * @param mixed $userid
     */
    public function setUserId($userid)
    {
        $this->userid = $userid;
    }

    /**
     * @return mixed
     */
    public function getWorkspaceId()
    {
        return $this->workspaceid;
    }

    /**
     * @param mixed $workspaceid
     */
    public function setWorkspaceId($workspaceid)
    {
        $this->workspaceid = $workspaceid;
    }

    public function __construct($workspaceid, $userid)
    {
        $this->setId(1);
        $this->resetToken();
        $this->setUserId($userid);
        $this->setWorkspaceId($workspaceid);
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