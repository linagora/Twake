<?php


namespace WebsiteApi\MarketBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
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
 */
    private $id;

    /**
     * @ORM\Column(type="string", length=500)
     */
    private $token;

    /**
     * @ORM\Column(type="string", length=256)
     */
    private $workspaceid;

    /**
     * @ORM\Column(type="string", length=256)
     */
    private $userid;

    /**
     * @return mixed
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

    /**
     * @return mixed
     */
    public function getToken()
    {
        return $this->token;
    }

}