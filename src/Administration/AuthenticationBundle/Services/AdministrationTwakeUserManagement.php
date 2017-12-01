<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 28/11/17
 * Time: 14:56
 */

namespace Administration\AuthenticationBundle\Services;


use Administration\AuthenticationBundle\Model\AdministrationTwakeUserManagementInterface;

class AdministrationTwakeUserManagement implements AdministrationTwakeUserManagementInterface
{
    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function listTwakeUsers($pageNumber, $nbUserByPage, $filters = null)
    {

        $offset = ($pageNumber - 1) * $nbUserByPage;
        $limit = $nbUserByPage;

        $repository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        $req = $repository->createQueryBuilder('U');

        if ($filters != null) {
            if(isset($filters['username'])){
                $req->where('U.username_clean LIKE \'%' . $filters['username'].'%\'');
            }
            if(isset($filters['lastname'])){
                $req->where('U.lastname LIKE \'%' . $filters['lastname'].'%\'');
            }
            if(isset($filters['email'])){
                $req->where('U.email LIKE \'%' . $filters['email'].'%\'');
            }
            if(isset($filters['firstname'])){
                $req->where('U.firstname LIKE \'%' . $filters['firstname'].'%\'');
            }
            if(isset($filters['gender'])){
                $req->where('U.gender LIKE \'' . $filters['gender'].'\'');
            }
            if(isset($filters['enable'])){
                $req->where('U.enable = \'' . $filters['enable'].'\'');
            }
        }

        $req = $req->setFirstResult($offset)
            ->setMaxResults($limit)
            ->getQuery()->getResult();

        return $req;
    }

	public function getNumberOfTwakeUsers($filters = null){

		//TODO implement filters without duplicating "listTwakeUsers" code
		$repository = $this->doctrine->getRepository("TwakeUsersBundle:User");
		$req = $repository->createQueryBuilder('U')
			->select('count(U.id)');
		$req = $req->getQuery()->getSingleScalarResult();

		return $req;

	}

    public function setEnableTwakeUser($idTwakeUser,$bool)
    {
        $em = $this->doctrine;
        $repository = $em->getRepository("TwakeUsersBundle:User");
        $twakeUser =  $repository->findOnBy(Array("id"=>$idTwakeUser));
        $twakeUser->setEnabled($bool);
        $em->persist($twakeUser);
        $em->flush($twakeUser);
        return $twakeUser;
    }

}