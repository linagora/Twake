<?php

namespace BuiltInConnectors\Common\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * BuiltInConnectorsEntity
 *
 * @ORM\Table(name="built_in_connectors_entity",options={"engine":"MyISAM",
 *  "scylladb_keys": {{"connector_id":"ASC", "document_id":"ASC"}}
 * })
 * @ORM\Entity
 */
class BuiltInConnectorsEntity
{
    /**
     * @ORM\Column(type="twake_timeuuid")
     * @ORM\Id
     */
    private $connector_id;

    /**
     * @ORM\Column(type="twake_no_salt_text")
     * @ORM\Id
     */
    private $document_id;

    /**
     * @ORM\Column(type="twake_text")
     */
    private $value;

    /**
     * BuiltInConnectorsEntity constructor.
     * @param $connector_id
     */
    public function __construct($connector_id, $document_id)
    {
      $this->connector_id = $connector_id;
      $this->document_id = $document_id;
    }


    /**
     * @return mixed
     */
    public function getConnectorId()
    {
        return $this->connector_id;
    }

    /**
     * @return mixed
     */
    public function getDocumentId()
    {
        return $this->document_id;
    }

    /**
     * @return mixed
     */
    public function getValue()
    {
        return json_decode($this->value, 1);
    }

    /**
     * @param mixed $value
     */
    public function setValue($value): void
    {
        $this->value = json_encode($value);
    }

}
