<?php


namespace AdministrationApi\AppsBundle\Services;


class AdministrationApps
{

    private $em;

    public function __construct($em) {
        $this->em = $em;
    }

    public function getAllApps() {
        //c'est quoi comme Repo pour toutes les apps ?
    }

}