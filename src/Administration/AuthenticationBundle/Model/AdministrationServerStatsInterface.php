<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 14/02/18
 * Time: 10:35
 */

namespace Administration\AuthenticationBundle\Model;

interface AdministrationServerStatsInterface
{
    //save the CPU usage at the time the function is called
    public function saveCpuUsage();

}