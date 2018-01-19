<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Security\Core\User\UserInterface;

use Doctrine\ORM\Mapping as ORM;
use FOS\UserBundle\Model\User as BaseUser;

/**
 * WorkspaceStats
 *
 * @ORM\Table(name="workspace_stats",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\WorkspaceStatsRepository")
 */
class WorkspaceStats
{
    /**
     * @ORM\Id/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace", inversedBy="stat")
     */
    protected $workspace;

    /**
     * @var int
     * @ORM\Column(name="public_msg_count", type="integer")
     */
    protected $publicMsgCount;
    /**
     * @var int
     * @ORM\Column(name="private_msg_count", type="integer")
     */
    protected $privateMsgCount;

    public function getPublicMsgCount(){
        return $this->publicMsgCount;
    }
}
