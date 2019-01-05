<?php

namespace WebsiteApi\DriveBundle\Services;

use WebsiteApi\DriveBundle\Entity\DriveActivity;
use WebsiteApi\DriveBundle\Model\DriveActivityInterface;
use WebsiteApi\DriveBundle\Repository\DriveActivityRepository;
use WebsiteApi\NotificationsBundle\Services\Notifications;


/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 25/06/18
 * Time: 09:25
 */

/**
 * Class DriveActivity
 * @package WebsiteApi\DriveBundle\Services
 */
class DriveAdapterSelector
{

    public function __construct($aws, $openstack, $aws_file_system, $openstack_file_system, $file_system)
    {
        $this->aws = $aws;
        $this->openstack = $openstack;
        $this->aws_file_system = $aws_file_system;
        $this->openstack_file_system = $openstack_file_system;
        $this->file_system = $file_system;
    }

    public function getFileSystem()
    {

        if (isset($this->aws["S3"]["use"]) && $this->aws["S3"]["use"]) {
            return $this->aws_file_system;
        }
        if (isset($this->openstack["use"]) && $this->openstack["use"]) {
            return $this->openstack_file_system;
        }
        return $this->file_system;

    }

}
