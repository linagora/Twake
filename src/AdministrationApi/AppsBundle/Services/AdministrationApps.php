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
        //TODO Faire le listing avec une nouvelle facon de faire
    }

    public function getOneApp($id) {
        $appsRepository = $this->em->getRepository("TwakeMarketBundle:Application");

        $app = $appsRepository->find($id);

        return $app;
    }

}