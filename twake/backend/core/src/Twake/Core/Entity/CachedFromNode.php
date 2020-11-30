<?php

namespace Twake\Core\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * CachedFromNode
 * Components in this table should all have a TTL
 *
 * @ORM\Table(name="cached_from_node",options={"engine":"MyISAM",
 *     "scylladb_keys": {{"type":"ASC"}, {"key":"ASC"}}
 * })
 * @ORM\Entity()
 */
class CachedFromNode
{

    /**
     * @ORM\Column(name="key", type="twake_text")
     * @ORM\Id
     */
    private $type;

    /**
     * @ORM\Column(type="twake_text")
     */
    private $key;

    /**
     * @ORM\Column(type="twake_text")
     */
    private $data;
    
    public function __construct($type, $key, $data)
    {
        $this->type = $type;
        $this->key = $key;
        $this->data = json_encode($data);
    }
    
    public function getData()
    {
        return json_decode($this->data, 1);
    }

}
