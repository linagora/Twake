<?php


namespace AdministrationApi\Apps\Services;


use App\App;

class AdministrationApps
{

    private $em;

    public function __construct(App $app)
    {
        $this->em = $app->getServices()->get("app.twake_doctrine");
    }

    public function getAllApps($limit, $offset)
    {

        $appsRepository = $this->em->getRepository("Twake\Market:Application");

        $apps_entities = $appsRepository->findBy(array(), array(), $limit, $offset/*, "__TOKEN__id"*/);

        $apps = array();

        foreach ($apps_entities as $app) {
            $apps[] = $app->getAsArray();
        }

        return $apps;

    }

    public function getOneApp($id)
    {
        $appsRepository = $this->em->getRepository("Twake\Market:Application");

        $app_tab = $appsRepository->findBy(array("id" => $id));

        $app = false;

        if (count($app_tab) == 1) {
            $app = $app_tab[0];
        }

        return $app;
    }

    public function toggleAppValidation($id)
    {
        $appsRepository = $this->em->getRepository("Twake\Market:Application");

        $app_tab = $appsRepository->findBy(array("id" => $id));

        $rep = false;

        if (count($app_tab) == 1) {
            if ($app_tab[0]->getPublic()) {
                $app_tab[0]->setIsAvailableToPublic(!$app_tab[0]->getIsAvailableToPublic());
                $this->em->persist($app_tab[0]);
                $rep = true;
            }
        }

        $this->em->flush();

        return $rep;
    }

}