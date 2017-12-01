<?php
/**
 * Created by PhpStorm.
 * User: Syma
 * Date: 30/06/2017
 * Time: 14:02
 */

namespace WebsiteApi\OrganizationsBundle\Services;

/**
 * Class UpdateGroup
 * @package WebsiteApi\OrganizationsBundle\Services
 *
 * Gestion des updates des groupes (par websocket)
 */
class UpdateGroup
{
  var $pusher;

  function __construct($pusher){
    $this->pusher = $pusher;
  }

  public function push($groupId, $data = Array()){

    $this->pusher->push($data, 'group_topic', ["id"=>$groupId]);
  }
}