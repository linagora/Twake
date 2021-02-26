<?php


namespace Twake\Market\Entity;

use Doctrine\ORM\Mapping as ORM;

use Twake\Workspaces\Entity\Workspace;
use Twake\Core\Entity\SearchableObject;

/**
 * ApplicationResourceNode
 *
 * @ORM\Table(name="application_resource_node",options={"engine":"MyISAM", "scylladb_keys": {{"application_id": "ASC", "workspace_id": "ASC", "id": "ASC"}, {"id": "ASC"}, {"resource_id": "ASC"}}})
 * @ORM\Entity()
 */
class ApplicationResourceNode
{

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    protected $id;

    /**
     * @ORM\Column(name="workspace_id", type="twake_text")
     * @ORM\Id
     */
    protected $workspace_id;

    /**
     * @ORM\Column(name="application_id", type="twake_text")
     * @ORM\Id
     */
    protected $application_id;

    /**
     * @ORM\Column(name="resource_type", type="twake_no_salt_text")
     */
    protected $resource_type; //directory, channel, workspace, group

    /**
     * @ORM\Column(name="resource_id", type="twake_text")
     */
    protected $resource_id;

    /**
     * @ORM\Column(name="application_hooks", type="twake_text")
     */
    protected $application_hooks;

    /**
     * ApplicationResourceNode constructor.
     * @param $id
     * @param $workspace_id
     * @param $application_id
     * @param $resource_type
     * @param $resource_id
     */
    public function __construct($workspace_id, $application_id, $resource_type, $resource_id)
    {
        $this->workspace_id = $workspace_id;
        $this->application_id = $application_id;
        $this->resource_type = $resource_type;
        $this->resource_id = $resource_id;
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
    public function getResourceType()
    {
        return $this->resource_type;
    }

    /**
     * @param mixed $resource_type
     */
    public function setResourceType($resource_type)
    {
        $this->resource_type = $resource_type;
    }

    /**
     * @return mixed
     */
    public function getResourceId()
    {
        return $this->resource_id;
    }

    /**
     * @param mixed $resource_id
     */
    public function setResourceId($resource_id)
    {
        $this->resource_id = $resource_id;
    }

    /**
     * @return mixed
     */
    public function getApplicationHooks()
    {
        if (!$this->application_hooks) {
            return Array();
        }
        return json_decode($this->application_hooks, true);
    }

    /**
     * @param mixed $application_hooks
     */
    public function setApplicationHooks($application_hooks)
    {
        $this->application_hooks = json_encode($application_hooks);
    }


}
