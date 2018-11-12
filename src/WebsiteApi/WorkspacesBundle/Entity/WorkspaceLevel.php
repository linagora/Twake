<?php
namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * WorkspaceLevel
 *
 * @ORM\Table(name="workspace_level",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\WorkspaceLevelRepository")
 */
class WorkspaceLevel
{
	/**
	 * @var int
	 *
     * @ORM\Column(name="id", type="cassandra_timeuuid")
	 * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
	 */
	protected $id;

	/**
	 * @ORM\Column(name="label", type="string", length=255)
	 */
	protected $label;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
	protected $workspace;

	/**
	 * @ORM\Column(name="rights", type="string", length=100000)
	 */
	protected $rights;

	/**
	 * @ORM\Column(name="isDefault", type="boolean", length=1)
	 */
	protected $isDefault = false;

	/**
	 * @ORM\Column(name="isAdmin", type="boolean", length=1)
	 */
	protected $isAdmin = false;


	function __construct()
	{
		$this->rights = "{}";
	}

	public function getId()
	{
		return $this->id;
	}

	/**
	 * @return mixed
	 */
	public function getLabel()
	{
		return $this->label;
	}

	/**
	 * @param mixed $label
	 */
	public function setLabel($label)
	{
		$this->label = $label;
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
	public function getRights()
	{
		return json_decode($this->rights, true);
	}

	/**
	 * @param mixed $rights
	 */
	public function setRights($rights)
	{
		$this->rights = json_encode($rights);
	}

	/**
	 * @return mixed
	 */
	public function getisDefault()
	{
		return $this->isDefault;
	}

	/**
	 * @param mixed $isDefault
	 */
	public function setIsDefault($isDefault)
	{
		$this->isDefault = $isDefault;
	}

	/**
	 * @return mixed
	 */
	public function getisAdmin()
	{
		return $this->isAdmin;
	}

	/**
	 * @param mixed $isAdmin
	 */
	public function setIsAdmin($isAdmin)
	{
		$this->isAdmin = $isAdmin;
	}


	public function getAsArray()
	{
		return Array(
			"id" => $this->getId(),
			"name" => $this->getLabel(),
			"admin" => $this->getisAdmin(),
			"default" => $this->getisDefault(),
			"rights" => $this->getRights()
		);
	}
}

?>
