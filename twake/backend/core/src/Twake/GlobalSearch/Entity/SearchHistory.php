<?php


namespace Twake\GlobalSearch\Entity;

use Doctrine\ORM\Mapping as ORM;

use Twake\Core\Entity\SearchableObject;

/**
 * Bloc
 *
 * @ORM\Table(name="searchhistory",options={"engine":"MyISAM", "scylladb_keys": { {"user_id": "ASC"}, {"id": "ASC"} } })
 * @ORM\Entity()
 */
class SearchHistory
{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    protected $id;
    /**
     * @ORM\Column(name="user_id", type="twake_timeuuid")
     * @ORM\Id
     */
    protected $user_id;

    /**
     * @ORM\Column(name ="search", type="twake_text", nullable=true)
     */
    protected $search;


    public function __construct($user_id, $search)
    {
        $this->user_id = $user_id;
        $this->search = $search;
    }

    public function getAsArray()
    {
        $return = Array(
            "id" => $this->getId(),
            "user_id" => $this->getUserId(),
            "search" => $this->getSearch()
        );
        return $return;
    }

    public function addSearch($temp)
    {
        $this->search[] = $temp;
    }

    /**
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param int $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return mixed
     */
    public function getUserId()
    {
        return $this->user_id;
    }

    /**
     * @param mixed $user_id
     */
    public function setUserId($user_id)
    {
        $this->user_id = $user_id;
    }

    /**
     * @return mixed
     */
    public function getSearch()
    {
        return $this->search;
    }

    /**
     * @param mixed $search
     */
    public function setSearch($search)
    {
        $this->search = $search;
    }


}


