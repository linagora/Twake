<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 15/01/18
 * Time: 10:34
 */

namespace Administration\AuthenticationBundle\Model;


interface AdministrationStatisticsInterface
{
    //numberOfUserCurrentlyConnected count the number of user currently connected
    public function numberOfUserCurrentlyConnected();

    //numberOfUsers count the number of twake user
    public function numberOfUsers();

    //numberOfAppUser count the number of user using application
    public function numberOfAppUser($idApp);

    //numberOfWorkspaceByApp return the number of workspace using one app ($idApp)
    public function numberOfWorkspaceByApp($idApp);

    //numberOfExtensions return the number of each extension group by extension
    public function numberOfExtensions();

    //numberOfExtensions return the number of each extension group by extension by workspace
    public function numberOfExtensionsByWorkspace($workspace);
}