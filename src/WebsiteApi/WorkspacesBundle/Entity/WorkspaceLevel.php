<?php
namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;

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
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
	 */
	protected $id;

	/**
     * @ORM\Column(name="label", type="twake_text")
     * @Encrypted
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
     * @ORM\Column(name="is_default", type="twake_boolean", length=1)
	 */
    protected $isdefault = false;

	/**
     * @ORM\Column(name="is_admin", type="twake_boolean", length=1)
	 */
    protected $isadmin = false;


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
        return $this->isdefault;
	}

	/**
     * @param mixed $isdefault
	 */
    public function setIsDefault($isdefault)
    {
        $this->isdefault = $isdefault;
	}

	/**
	 * @return mixed
	 */
	public function getisAdmin()
	{
        return $this->isadmin;
	}

	/**
     * @param mixed $isadmin
	 */
    public function setIsAdmin($isadmin)
    {
        $this->isadmin = $isadmin;
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
