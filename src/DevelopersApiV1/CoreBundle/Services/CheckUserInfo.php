<?php


namespace DevelopersApiV1\CoreBundle\Services;


class CheckUserInfo
{
    /**
     * AccessLog constructor.
     */
    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;

    }

    public function getInfo($token){
        return $this->doctrine->getRepository("TwakeMarketBundle:AccessToken")->findOneBy(Array("atoken" => $token));
    }

}