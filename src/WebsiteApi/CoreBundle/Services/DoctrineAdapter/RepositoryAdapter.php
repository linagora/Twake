<?php

namespace WebsiteApi\CoreBundle\Services\DoctrineAdapter;

/** Used to generate a false ID from string ID */
class FakeCassandraTimeuuid
{
    public function __construct($timeuuid)
    {
        $this->timeuuid = $timeuuid;
    }

    public function __toString()
    {
        return $this->timeuuid;
    }
}

class RepositoryAdapter extends \Doctrine\ORM\EntityRepository
{

    public function find($id)
    {

        if (!$id) {
            return null;
        }

        if (is_string($id)) {
            $id = new FakeCassandraTimeuuid($id);
        }

        try {
            $a = parent::find($id);
        } catch (\Exception $e) {
            error_log($e);
            die("ERROR with find");
        }
        return $a;
    }

    public function findOneBy(Array $filter, array $sort = null)
    {
        try {
            $a = parent::findOneBy($filter, $sort);
        } catch (\Exception $e) {
            error_log($e);
            var_dump($e->getTraceAsString());
            die("ERROR with findOneBy");
        }
        return $a;
    }

    public function findBy(Array $filter, ?array $sort = null, $limit = null, $offset = null)
    {
        try {
            $a = parent::findBy($filter, $sort, $limit, $offset);
        } catch (\Exception $e) {
            error_log($e);
            die("ERROR with findOneBy");
        }
        return $a;
    }

}