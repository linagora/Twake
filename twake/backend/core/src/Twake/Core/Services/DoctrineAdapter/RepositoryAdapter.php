<?php

namespace Twake\Core\Services\DoctrineAdapter;

use Doctrine\DBAL\Types\Type;

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

            if ($a) {
                if (method_exists($a, "getEsIndexed")) {
                    $a->updatePreviousIndexationArray();
                }
            }

        } catch (\Exception $e) {
            error_log($e);
            error_log("ERROR with find");
            $a = null;
        }
        return $a;
    }

    public function findOneBy(Array $filter, array $sort = null)
    {
        try {
            $a = parent::findOneBy($filter, $sort);

            if ($a) {
                if (method_exists($a, "getEsIndexed")) {
                    $a->updatePreviousIndexationArray();
                }
            }

        } catch (\Exception $e) {
            error_log($e);
            error_log("ERROR with findOneBy");
            $a = null;
        }
        return $a;
    }

    public function findRange(Array $filters, $limit = false, $order_field = null, $min = null, $max = null, $view_to_use = null)
    {

        try {

            $mapping = Array();
            if (isset($this->getClassMetadata()->associationMappings)) {
                foreach ($this->getClassMetadata()->associationMappings as $field => $data) {
                    $mapping[] = $field;
                }
            }
            if (isset($this->getClassMetadata()->fieldMappings)) {
                foreach ($this->getClassMetadata()->fieldMappings as $field => $data) {
                    if ($data["type"] == "twake_timeuuid" || $data["type"] == "twake_uuid") {
                        $mapping[] = $field;
                    }
                }
            }

            //Cassandra
            $qb = $this->createQueryBuilder('e');

            foreach ($filters as $filter => $value) {
                $qb = $qb->andWhere($qb->expr()->eq('e.' . $filter, ":" . $filter . "_param"));
                if (in_array($filter, $mapping)) {
                    if (is_object($value)) {
                        $qb = $qb->setParameter($filter . "_param", new FakeCassandraTimeuuid($value->getId()));
                    } else {
                        $qb = $qb->setParameter($filter . "_param", new FakeCassandraTimeuuid($value));
                    }
                } else {
                    $qb = $qb->setParameter($filter . "_param", $value);
                }
            }

            if ($min) {
                if (is_string($min)) {
                    new FakeCassandraTimeuuid($min);
                }
                $qb = $qb->andWhere($qb->expr()->gte('e.' . $order_field, ":offset_min"));
                $qb = $qb->setParameter("offset_min", $min);
            }
            if ($max) {
                if (is_string($max)) {
                    new FakeCassandraTimeuuid($max);
                }
                $qb = $qb->andWhere($qb->expr()->lte('e.' . $order_field, ":offset_max"));
                $qb = $qb->setParameter("offset_max", $max);
            }

            if ($view_to_use) {
                $this->_em->getConnection()->getWrappedConnection()->changeTableToView($view_to_use);
            }

            if ($limit) {
                $qb = $qb->setMaxResults(abs($limit));
            }

            $qb = $qb->getQuery();
            $a = $qb->execute();


            foreach ($a as $e) {
                if (method_exists($e, "getEsIndexed")) {
                    $e->updatePreviousIndexationArray();
                }
            }

        } catch (\Exception $e) {
            error_log($e);
            error_log("ERROR with findRange");
            $a = [];
        }
        return $a;
    }

    public function findBy(Array $filters, ?array $sort = null, $limit = null, $offset = null, $order_fields = null, $order_directions = "ASC", $view_to_use = null)
    {

        if (is_array($order_directions)) {
            $order_direction = $order_directions[count($order_directions) - 1];
            $order_field = $order_fields[count($order_fields) - 1];
        } else {
            $order_direction = $order_directions;
            $order_field = $order_fields;
        }

        $cassandra = strpos(get_class($this->_em->getConnection()->getDriver()), "PDOCassandra") >= 0;

        $offset_field = null;
        if ($offset && is_array($offset)) {
            if ($cassandra) {
                $sort = Array();
                $offset_field = $order_fields[1];
                $offset = $offset[1];
            } else {
                $offset_field = $order_fields[0];
                $offset = $offset[0];
            }
        }

        try {

            if (($view_to_use || $offset && $order_field) && $cassandra) {


                $mapping_timeuuid = Array();
                $mapping_uuid = Array();
                $mapping_twake_text = Array();
                if (isset($this->getClassMetadata()->associationMappings)) {
                    foreach ($this->getClassMetadata()->associationMappings as $field => $data) {
                        $mapping_timeuuid[] = $field;
                    }
                }
                if (isset($this->getClassMetadata()->fieldMappings)) {
                    foreach ($this->getClassMetadata()->fieldMappings as $field => $data) {
                        if ($data["type"] == "twake_no_salt_text") {
                            $mapping_twake_text[] = $field;
                        }
                        if ($data["type"] == "twake_timeuuid") {
                            $mapping_timeuuid[] = $field;
                        }
                        if ($data["type"] == "twake_uuid") {
                            $mapping_uuid[] = $field;
                        }
                    }
                }

                //Cassandra
                $qb = $this->createQueryBuilder('e');

                foreach ($filters as $filter => $value) {
                    $qb = $qb->andWhere($qb->expr()->eq('e.' . $filter, ":" . $filter . "_param"));
                    if (in_array($filter, $mapping_timeuuid)) {
                        if (is_object($value)) {
                            $qb = $qb->setParameter($filter . "_param", new FakeCassandraTimeuuid($value->getId()));
                        } else {
                            $qb = $qb->setParameter($filter . "_param", new FakeCassandraTimeuuid($value));
                        }
                    } else if (in_array($filter, $mapping_uuid)) {
                        $uuidType = Type::getType('twake_uuid');
                        if (is_object($value)) {
                            $value = $value->getId();
                        }
                        $value = $uuidType->convertToDatabaseValue($value, $this->_em->getConnection()->getDatabasePlatform());
                        $qb = $qb->setParameter($filter . "_param", new FakeCassandraTimeuuid($value));
                    } else if (in_array($filter, $mapping_twake_text)) {
                        /** \Doctrine\DBAL\Types\Type @var $encryptedStringType */
                        $encryptedStringType = Type::getType('twake_no_salt_text');
                        $encrypted = $encryptedStringType->convertToDatabaseValue($value, $this->_em->getConnection()->getDatabasePlatform());
                        $qb = $qb->setParameter($filter . "_param", $encrypted);
                    } else {
                        $qb = $qb->setParameter($filter . "_param", $value);
                    }
                }

                if ($offset) {
                    if (is_array($order_fields)) {
                        foreach ($order_fields as $i => $of) {
                            if ($limit > 0) {
                                $qb = $qb->addOrderBy('e.' . $of, $order_directions[$i]);
                            } else {
                                if ($order_directions[$i] == "ASC") {
                                    $qb = $qb->addOrderBy('e.' . $of, "DESC");
                                } else {
                                    $qb = $qb->addOrderBy('e.' . $of, "ASC");
                                }
                            }
                        }
                    }
                    if ($limit > 0) {
                        $qb = $qb->andWhere($qb->expr()->lte('e.' . $order_field, ":offset"));
                    } else {
                        $qb = $qb->andWhere($qb->expr()->gte('e.' . $order_field, ":offset"));
                    }
                    if (is_object($offset)) {
                        $offset = $offset->getId();
                    }

                    if (is_string($offset) && in_array($order_field, $mapping_timeuuid)) {
                        $offset = new FakeCassandraTimeuuid($offset);
                        if (strpos($order_field, "__TOKEN__") === 0) {
                            $offset = "__TOKEN__" . $offset . "";
                        }
                    }

                    $qb = $qb->setParameter("offset", $offset);
                }

                if ($limit) {
                    $qb = $qb->setMaxResults(abs($limit) + ($offset?1:0));
                }

                if ($view_to_use) {
                    $this->_em->getConnection()->getWrappedConnection()->changeTableToView($view_to_use);
                }

                $qb = $qb->getQuery();
                $a = $qb->execute();

            } else {
                $a = parent::findBy($filters, $sort, $limit, $offset);
            }

            foreach ($a as $e) {
                if (method_exists($e, "getEsIndexed")) {
                    $e->updatePreviousIndexationArray();
                }
            }

        } catch (\Exception $e) {
            error_log($e);
            foreach (explode("\n", $e->getTraceAsString()) as $line) {
                error_log($line);
            }
            error_log("ERROR with findBy");
            $a = [];
        }
        return $a;
    }

    public function removeBy($filters)
    {

        $qb = $this->createQueryBuilder("e");

        $qb = $qb->delete();

        $mapping = Array();
        if (isset($this->getClassMetadata()->associationMappings)) {
            foreach ($this->getClassMetadata()->associationMappings as $field => $data) {
                $mapping[] = $field;
            }
        }
        if (isset($this->getClassMetadata()->fieldMappings)) {
            foreach ($this->getClassMetadata()->fieldMappings as $field => $data) {
                if ($data["type"] == "twake_timeuuid" || $data["type"] == "twake_uuid") {
                    $mapping[] = $field;
                }
            }
        }

        foreach ($filters as $filter => $value) {
            $qb = $qb->andWhere($qb->expr()->eq('e.' . $filter, ":" . $filter . "_param"));
            if (in_array($filter, $mapping)) {
                if (is_object($value)) {
                    $qb = $qb->setParameter($filter . "_param", new FakeCassandraTimeuuid($value->getId()));
                } else {
                    $qb = $qb->setParameter($filter . "_param", new FakeCassandraTimeuuid($value));
                }
            } else {
                $qb = $qb->setParameter($filter . "_param", $value);
            }
        }

        $qb = $qb->getQuery();
        $qb->execute();

    }

    public function queryBuilderUuid($list)
    {

        $not_array = false;
        if (!is_array($list)) {
            if ($list === null) {
                return null;
            }
            $not_array = true;
            $list = [$list];
        }

        $return = Array();
        foreach ($list as $el) {
            if (is_object($el) && method_exists($el, "getId")) {
                $el = $el->getId();
            }
            if (is_string($el) || get_class($el) == "Ramsey\Uuid\Uuid") {
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
