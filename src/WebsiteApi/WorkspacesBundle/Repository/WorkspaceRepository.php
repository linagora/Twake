<?php

namespace WebsiteApi\WorkspacesBundle\Repository;

/**
 * WorkspaceRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class WorkspaceRepository extends \Doctrine\ORM\EntityRepository
{
    public function search($pageNumber,$nbGroupByPage, $filters=null,&$total){
        $offset = ($pageNumber - 1) * $nbGroupByPage;
        $limit = $nbGroupByPage;

        $req = $this->createQueryBuilder('U')
            ->select('count(U.id)');
        $req = $this->searchMiddleQueryBuilder($req,$filters);
        $total = $req->getQuery()->getSingleScalarResult();

        $req1 = $this->createQueryBuilder('U');
        $req1 = $this->searchMiddleQueryBuilder($req1,$filters);
        $req1 = $req1->setFirstResult($offset)
            ->setMaxResults($limit)
            ->getQuery()->getResult();
        return $req1;
    }

    private function searchMiddleQueryBuilder($req,$filters){
        if ($filters != null) {
            if(isset($filters['name'])){
                $req->where('U.cleanName LIKE \'%' . $filters['name'].'%\'');
            }
            if(isset($filters['memberCount'])){
                $req->where('U.memberCount LIKE \'%' . $filters['memberCount'].'%\'');
            }
        }
        return $req;
    }



    public function findWorspaceByFilter($pageNumber,$nbWorkspaceByPage,$name=null,$memberCount=null,&$total=null){
        $offset = ($pageNumber - 1) * $nbWorkspaceByPage;
        $limit = $nbWorkspaceByPage;

        $req = $this->createQueryBuilder('U')
            ->select('count(U.id)');
        $req = $this->middleFindWorspaceQueryBuilder($req,$name,$memberCount);
        $total = $req->getQuery()->getSingleScalarResult();

        $req1 = $this->createQueryBuilder('U');
        $req1->where('1=1');
        $req1 = $this->middleFindWorspaceQueryBuilder($req1,$name,$memberCount);
        $req1 = $req1->setFirstResult($offset)
            ->setMaxResults($limit)
            ->getQuery()->getResult();
        return $req1;
    }

    public function middleFindWorspaceQueryBuilder($req,$name,$memberCount){
        if($name != null){
            $req->andWhere('U.cleanName LIKE \'%' . $name.'%\'');
        }
        if($memberCount != null){
            $req->andWhere('U.memberCount LIKE \'%' . $memberCount.'%\'');
        }
        return $req;
    }
}
