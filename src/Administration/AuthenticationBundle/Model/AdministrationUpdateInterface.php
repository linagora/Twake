<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 21/11/17
 * Time: 11:33
 */

namespace Administration\AuthenticationBundle\Model;


interface AdministrationUpdateInterface
{
    //@addUser return the user who has been added in admin list
    public function addUser($id);
    //@removeUser return the user who has been removed from the admin list
    public function removeUser($id);
    //@updateUser return the user who has been updated
    public function updateUser( $id, $role);
    //@listUserAdmin list all admins
    public function listUserAdmin();

}