<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 05/12/17
 * Time: 16:54
 */

namespace Administration\AuthenticationBundle\Model;


interface AdministrationGroupManagementInterface
{
    public function listGroup($pageNumber,$nbUserByPage,$filters=null,&$total);
}