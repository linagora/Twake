<?php

namespace WebsiteApi\DriveBundle\Repository;

/**
 * DriveFileRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class DriveFileRepository extends \Doctrine\ORM\EntityRepository
{

	public function sumSize($group, $directory = null)
	{
		$qb = $this->createQueryBuilder('f')
			->select('sum(f.size)')
			->where('f.group = :group')
			->setParameter("group", $group);

		if ($directory == null) {
			$qb = $qb->andWhere('f.parent IS NULL');
		} else {
			$qb = $qb->andWhere('f.parent = :directory')
				->setParameter("directory", $directory);
		}

		return $qb->getQuery()->getSingleScalarResult();
	}

	public function listDirectory($group, $directory = null, $trash = false)
	{

		return $this->findBy(Array(
			"group" => $group,
			"parent" => $directory,
			"isInTrash" => $trash
		), Array("name" => "ASC"));

	}

	public function search($group, $query, $offset = 0, $max = 20)
	{
		//TODO implement search method
		return [];
	}

	public function countEachExtension(){
        $req = $this->createQueryBuilder('f')
            ->select('f.extension, count(f.extension)')
            ->groupBy('f.extension');
        return $req->getQuery()->getResult();
    }
}
