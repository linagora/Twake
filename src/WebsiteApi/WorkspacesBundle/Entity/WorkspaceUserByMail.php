<?php
namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

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
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	protected $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
	private $workspace;

	/**
	 * @ORM\Column(name="mail", type="string", length=255)
	 */
	private $mail;

	function __construct($workspace, $mail)
	{
		$this->workspace = $workspace;
		$this->mail = $mail;
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




}

?>
