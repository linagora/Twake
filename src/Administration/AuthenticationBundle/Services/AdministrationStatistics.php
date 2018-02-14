<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 15/01/18
 * Time: 10:32
 */

namespace Administration\AuthenticationBundle\Services;


use Administration\AuthenticationBundle\Model\AdministrationStatisticsInterface;

class AdministrationStatistics implements AdministrationStatisticsInterface
{
    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function numberOfUserCurrentlyConnected(){
        $repository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        return $repository->countUsersConnected();
    }

    public function numberOfUsers(){
        $repository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        return $repository->countUsers();
    }

    public function numberOfAppUser($idApp){
        $repository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $app = $repository->findOneBy(Array("id"=>$idApp));
        if($app != null){
            return $app->getUserCount();
        }
        return null;
    }
    
    public function numberOfWorkspaceByApp($idApp){
        $repository = $this->doctrine->getRepository("TwakeMarketBundle:LinkAppWorkspace");
        return $repository->countWorkspaceByApp($idApp);
    }

    public function numberOfExtensions(){
        $repository = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");
        $listExtension = $repository->countEachExtension();
        if($listExtension == null){
            return null;
        }
        return $listExtension;
    }

    public function sizeByExtension($idWorkspace)
    {
        $repository = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");
        $listExtension = $repository->sumSizeByExt($idWorkspace);
        if ($listExtension == null) {
            return null;
        }
        return $listExtension;
    }

    public function numberOfExtensionsByWorkspace($workspace)
    {
        $repository = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile");
        $listeExtension  = $repository->countEachExtensionByWorkspace($workspace);
        if($listeExtension == null)
        {
            return null;
        }
        return $listeExtension;
    }

    public function getCpuUsed()
    {
        $pos[0] = strpos(exec('uptime'), 'load') + 14;
        $uptime[0] = substr(exec('uptime'), $pos[0]);
        $pos[0] = strpos($uptime[0], ',');
        $uptime[1] = substr($uptime[0], 0, $pos[0]);

        return  "cpu : $uptime[1]%";

    }
}