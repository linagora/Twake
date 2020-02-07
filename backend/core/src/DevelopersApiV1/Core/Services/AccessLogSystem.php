<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 08/06/18
 * Time: 10:33
 */

namespace DevelopersApiV1\Core\Services;

use DevelopersApiV1\Core\Entity\AccessLog;

class AccessLogSystem
{
    /**
     * AccessLog constructor.
     */
    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;

    }

    public function record($applicationId, $rightLevel)
    {
        $accessLogger = $this->doctrine->getRepository("DevelopersApiV1Core:AccessLog")->findOneBy(Array("appid" => $applicationId));

        if ($accessLogger == null) {
            $accessLogger = new AccessLog();
            $accessLogger->setAppId($applicationId);
        }

        $minutes = $accessLogger->getMinutes();

        if ($minutes != date("i"))
            $accessLogger->clear(date("i"));

        if ($rightLevel == 1) //read
            $accessLogger->readAccessIncrease();
        elseif ($rightLevel == 2) //write
            $accessLogger->writeAccessIncrease();
        elseif ($rightLevel == 3) //manage
            $accessLogger->manageAccessIncrease();

        $this->doctrine->persist($accessLogger);
        $this->doctrine->flush();

        return true;
    }
}