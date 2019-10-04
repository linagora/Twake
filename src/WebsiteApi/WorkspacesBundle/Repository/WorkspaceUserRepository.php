<?php

namespace WebsiteApi\WorkspacesBundle\Repository;

/**
 * WorkspaceUserRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class WorkspaceUserRepository extends \WebsiteApi\CoreBundle\Services\DoctrineAdapter\RepositoryAdapter
{
    public function getSomeUsers($workspace, $type, $offset, $length)
    {
        $qb = $this->createQueryBuilder("l")
            ->select('l')
            ->where('l.workspace = :workspace');
        //->andWhere('l.status = :type');
        if ($length > 0) {
            $qb = $qb->setMaxResults($length);
        }
        $qb = $qb->setFirstResult($offset)
            ->setParameter('workspace', $this->queryBuilderUuid($workspace));
        //->setParameter('type', $type);

        return $qb->getQuery()->getResult();
    }

    public function deleteUserFromGroup($workspaces_ids, $user)
    {
        $qb = $this->createQueryBuilder("l");

        $qb = $qb->delete('l')
            ->andWhere('l.user = :user')
            ->andWhere('l.workspace_id IN (:ids)')
            ->setParameter('user', $this->queryBuilderUuid($user))
            ->setParameter('ids', $this->queryBuilderUuid($workspaces_ids));

        return $qb->getQuery()->getResult();
    }

    public function getUserFromGroup($workspaces_ids)
    {
        $qb = $this->createQueryBuilder("l");

        $qb = $qb->select('l')
            ->andWhere('l.workspace_id IN (:ids)')
            ->setParameter('ids', $this->queryBuilderUuid($workspaces_ids));

        return $qb->getQuery()->getResult();
    }

    public function findOneBy(array $array)
    {
        return parent::findOneBy($array);
    }

}
