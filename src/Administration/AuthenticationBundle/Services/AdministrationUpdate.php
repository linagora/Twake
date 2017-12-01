<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 21/11/17
 * Time: 11:43
 */

namespace Administration\AuthenticationBundle\Services;


use Administration\AuthenticationBundle\Entity\AdminUser;
use Administration\AuthenticationBundle\Model\AdministrationUpdateInterface;

class AdministrationUpdate implements AdministrationUpdateInterface
{

	/**
	 * AdministrationUpdate constructor.
	 */
	public function __construct($doctrine)
	{
		$this->doctrine = $doctrine;
	}

    public function addUser($id){
        $em = $this->doctrine;
        $adminUserRepo  = $em->getRepository("AdministrationAuthenticationBundle:AdminUser"); //Entity Repository
        $repo  = $em->getRepository("TwakeUsersBundle:User"); //Entity Repository
        $twakeUser =  $repo->findOneBy(Array("id"=>$id));
        $adminTwakeUser = $adminUserRepo->findOneBy(Array("user"=>$twakeUser));
        if($adminTwakeUser == null){
            if($twakeUser != null){
	            $newAdmin = new AdminUser();
	            $newAdmin->setUser($twakeUser);
                $em->persist($newAdmin);
	            $em->flush();
                return $newAdmin;
            }
        }
        return null;
    }

    public function removeUser($id){
        $em = $this->doctrine;
        $adminUserRepo  = $em->getRepository("AdministrationAuthenticationBundle:AdminUser"); //Entity Repository
        $repo  = $em->getRepository("TwakeUsersBundle:User"); //Entity Repository
        $twakeUser =  $repo->findOneBy(Array("id"=>$id));
        $adminTwakeUser = $adminUserRepo->findOneBy(Array("user"=>$twakeUser));
        if($adminTwakeUser != null){
            $em->remove($adminTwakeUser);
            $em->flush();
            return $twakeUser;
        }
        return null;
    }

    public function updateUser($id, $role){
	    $em = $this->doctrine;
	    $adminUserRepo  = $em->getRepository("AdministrationAuthenticationBundle:AdminUser"); //Entity Repository
	    $repo  = $em->getRepository("TwakeUsersBundle:User"); //Entity Repository
	    $twakeUser =  $repo->findOneBy(Array("id"=>$id));
	    $adminTwakeUser = $adminUserRepo->findOneBy(Array("user"=>$twakeUser));
        if($adminTwakeUser != null){
            $adminTwakeUser->setRoles($role);
            $em->persist($adminTwakeUser);
            $em->flush();
            return $adminTwakeUser;
        }
        return null;
    }

    public function listUserAdmin(){
        $em = $this->doctrine;
        $adminUserRepo  = $em->getRepository("AdministrationAuthenticationBundle:AdminUser"); //Entity Repository
	    $admins = $adminUserRepo->findBy(Array());
        return $admins;
    }
}