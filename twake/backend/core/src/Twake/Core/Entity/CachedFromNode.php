<?php

namespace Twake\Core\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * CachedFromNode
 * Components in this table should all have a TTL
 *
 * @ORM\Table(name="cached_from_node",options={"engine":"MyISAM",
 *     "scylladb_keys": {{"company_id":"ASC", "type":"ASC", "key":"ASC"}}
 * })
 * @ORM\Entity()
 */
class CachedFromNode
{

    /**
     * @ORM\Column(name="company_id", type="twake_string")
     * @ORM\Id
     */
    private $company_id;

    /**
     * @ORM\Column(name="type", type="twake_string")
     * @ORM\Id
     */
    private $type;

    /**
     * @ORM\Column(name="key", type="twake_string")
     * @ORM\Id
     */
    private $key;

    /**
     * @ORM\Column(name="data", type="twake_text")
     */
    private $data;
    
    public function __construct($company, $type, $key, $data)
    {
        $this->company_id = $company;
        $this->type = $type;
        $this->key = $key;
        $this->data = json_encode($data);
    }
    
    public function getData()
    {
        return json_decode($this->data, 1);
    }

}
