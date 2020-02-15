<?php

namespace Twake\Core\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * @ORM\MappedSuperclass
 */
class SearchableObject extends FrontObject
{

    /**
     * @ORM\Column(name="es_indexed", type="twake_boolean")
     */
    protected $es_indexed = false;

    protected $es_type = "misc";

    protected $es_index = "twake";

    protected $on_construct_indexation_array;

    public function __construct()
    {
        parent::__construct();
        $this->setEsIndexed(false);
    }

    /**
     * @return mixed
     */
    public function getEsIndexed()
    {
        return $this->es_indexed;
    }

    /**
     * @param mixed $es_indexed
     */
    public function setEsIndexed($es_indexed)
    {
        $this->es_indexed = $es_indexed;
    }

    /**
     * @return mixed
     */
    public function getEsType()
    {
        return $this->es_type;
    }

    /**
     * @param mixed $es_type
     */
    public function setEsType($es_type)
    {
        $this->es_type = $es_type;
    }

    /**
     * @return mixed
     */
    public function getEsIndex()
    {
        return $this->es_index;
    }

    /**
     * @param mixed $es_index
     */
    public function setEsIndex($es_index)
    {
        if (!$es_index) {
            $this->on_construct_indexation_array = "";
        }
        $this->es_index = $es_index;
    }

    public function getIndexationArray()
    {
        return Array();
    }

    public function updatePreviousIndexationArray()
    {
        $this->on_construct_indexation_array = json_encode($this->getIndexationArray());
    }

    public function changesInIndexationArray()
    {
        if (json_encode($this->getIndexationArray()) != $this->on_construct_indexation_array) {
            return true;
        }
        return false;
    }

}
