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
            var_dump($e->getTraceAsString());
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
            var_dump($e->getTraceAsString());
            die("ERROR with findOneBy");
        }
        return $a;
    }

    public function queryBuilderUuid($list)
    {

        $not_array = false;
        if (!is_array($list)) {
            $not_array = true;
            $list = [$list];
        }

        $return = Array();
        foreach ($list as $el) {
            if (!is_integer($el)) {
                $hex = str_replace("-", "", $el);
                $value = substr($hex, 12, 4) . substr($hex, 8, 4) . substr($hex, 0, 8) . substr($hex, 16, 4) . substr($hex, 20);
                $return[] = $value;
            } else {
                $return[] = $el;
            }
        }

        if ($not_array) {
            $return = $return[0];
        }

        return $return;

    }

}