<?php
namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;

/**
 * WorkspaceUserByMail
 *
 * @ORM\Table(name="workspace_user_by_mail",options={"engine":"MyISAM", "scylladb_keys": {{"workspace_id":"ASC", "mail": "DESC", "id":"ASC"}, {"id":"ASC"}, {"mail":"ASC"}}})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\WorkspaceUserByMailRepository")
 */
class WorkspaceUserByMail
{
	/**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 * @ORM\Id
	 */
	private $workspace;

	/**
     * @ORM\Column(name="mail", type="string", length=255)
	 * @ORM\Id
	 */
	private $mail;

    /**
     * @ORM\Column(name="is_externe", type="twake_boolean")
     */
    private $externe;

    /**
     * @ORM\Column(name="is_auto_add_externe", type="twake_boolean")
     */
    private $is_auto_add_externe;


	function __construct($workspace, $mail)
	{
		$this->workspace = $workspace;
		$this->mail = $mail;
        $this->externe = false;
        $this->is_auto_add_externe = false;
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
    /**
     * @return mixed
     */
    public function getAutoAddExterne()
    {
        return $this->is_auto_add_externe;
    }

    /**
     * @param mixed $isclient
     */
    public function setAutoAddExterne($externe)
    {
        $this->is_auto_add_externe = $externe;
    }


}

?>
