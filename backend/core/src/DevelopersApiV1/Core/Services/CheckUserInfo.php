<?php


namespace DevelopersApiV1\Core\Services;


class CheckUserInfo
{
    /**
     * AccessLog constructor.
     */
    public function __construct($doctrine)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");

    }

    public function getInfo($token)
    {
        return $this->doctrine->getRepository("Twake\Market:AccessToken")->findOneBy(Array("atoken" => $token));
    }

}