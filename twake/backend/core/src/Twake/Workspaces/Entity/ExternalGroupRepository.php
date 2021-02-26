<?php

namespace Twake\Workspaces\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * ExternalGroupRepository
 *
 * @ORM\Table(name="external_group_repository",options={"engine":"MyISAM", "scylladb_keys": {{"service_id":"ASC", "external_id":"ASC", "company_id":"ASC"}, {"service_id":"ASC", "company_id":"ASC", "external_id":"ASC"}} })
 * @ORM\Entity()
 */
class ExternalGroupRepository
{

    /**
     * @ORM\Column(name="service_id", type="string")
     * @ORM\Id
     */
    protected $service_id;

    /**
     * @ORM\Column(name="external_id", type="string")
     * @ORM\Id
     */
    protected $external_id;

    /**
     * @ORM\Column(type="string")
     */
    protected $company_id;

    /**
     * ExternalGroupRepository constructor.
     * @param int $service_id
     * @param int $external_id
     * @param $company_id
     */
    public function __construct($service_id, $external_id, $company_id)
    {
        $this->service_id = $service_id . "";
        $this->external_id = $external_id . "";
        $this->company_id = $company_id . "";
    }

    /**
     * @return string
     */
    public function getServiceId()
    {
        return $this->service_id;
    }

    /**
     * @return string
     */
    public function getExternalId()
    {
        return $this->external_id;
    }

    /**
     * @return mixed
     */
    public function getGroupId()
    {
        return $this->company_id;
    }

    /**
     * @return mixed
     */
    public function setGroupId($company_id)
    {
        $this->company_id = $company_id . "";
    }

}
