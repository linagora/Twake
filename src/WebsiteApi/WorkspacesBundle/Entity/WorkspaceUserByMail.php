<?php
namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;

/**
 * WorkspaceUserByMail
 *
 * @ORM\Table(name="workspace_user_by_mail",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\WorkspaceUserByMailRepository")
 */
class WorkspaceUserByMail
{
	/**
	 * @var int
	 *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
 */
	protected $id;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
	private $workspace;

	/**
     * @ORM\Column(name="mail", type="string", length=255, options={"index": true})
	 */
	private $mail;

    /**
     * @ORM\Column(name="is_externe", type="twake_boolean")
     */
    private $externe;

	function __construct($workspace, $mail)
	{
		$this->workspace = $workspace;
		$this->mail = $mail;
        $this->externe = false;
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
	public function getWorkspace()
	{
		return $this->workspace;
	}

	/**
	 * @return mixed
	 */
	public function getMail()
	{
		return $this->mail;
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


}

?>
