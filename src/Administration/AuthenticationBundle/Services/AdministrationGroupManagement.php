<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 05/12/17
 * Time: 16:55
 */

namespace Administration\AuthenticationBundle\Services;


class AdministrationGroupManagement
{
    public function listGroup($pageNumber,$nbGroupByPage,$filters=null,&$total){
        $repository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        return $repository->search($pageNumber,$nbGroupByPage,$filters,$total);
    }
}