<?php

namespace Administration\AuthenticationBundle\Repository;
use Symfony\Bridge\Doctrine\RegistryInterface;
use Administration\AuthenticationBundle\Entity\Errors;

class ErrorsRepository extends \Doctrine\ORM\EntityRepository
{
    public function findAllIdOrderByOcc()
    {
        $req = $this->createQueryBuilder('U')
            ->select('U.id')
            ->orderBy('U.number', 'DESC');

        return $req->getQuery()->getResult();
    }
}
