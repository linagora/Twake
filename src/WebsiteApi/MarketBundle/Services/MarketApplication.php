<?php

namespace WebsiteApi\MarketBundle\Services;

use WebsiteApi\MarketBundle\Entity\Application;
use WebsiteApi\MarketBundle\Model\MarketApplicationInterface;
use WebsiteApi\WorkspacesBundle\Entity\AppPricingInstance;
use WebsiteApi\WorkspacesBundle\Entity\GroupApp;

class MarketApplication implements MarketApplicationInterface
{
    private $doctrine;
    private $gms;
    private $pricingPlan;

    public function __construct($doctrine, $group_managers_service, $pricing)
    {
        $this->doctrine = $doctrine;
        $this->gms = $group_managers_service;
        $this->pricingPlan = $pricing;
    }

    private function convertToEntity($var, $repository)
    {
        if (is_string($var)) {
            $var = intval($var);
        }

        if (is_int($var)) {
            return $this->doctrine->getRepository($repository)->find($var);
        } else if (is_object($var)) {
            return $var;
        } else {
            return null;
        }

    }
    public function getApps()
    {
        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $applications = $applicationRepository->findBy(Array('enabled'=>true),array('name' => 'ASC'), 18);

        return $applications;
    }

    public function getAppsByKeyword($keywords){
        if(count($keywords)==0)
            return false;
        $searchterm = "";
        foreach ($keywords as $keyword)
            $searchterm .= $keyword." ";
        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");

        $applications = $applicationRepository->createQueryBuilder('p')
            ->addSelect("MATCH_AGAINST (p.shortDescription, p.description, p.searchWords, :searchterm 'IN NATURAL MODE') as score")
            ->add('where', 'MATCH_AGAINST(p.shortDescription, p.description, p.searchWords, :searchterm) > 0.8')
            ->setParameter('searchterm', $searchterm)
            ->andWhere('p.enabled = true')
            ->andWhere('p.urlApp = true')
            ->orderBy('score', 'desc')
            ->getQuery()
            ->getResult();

        return $applications;
    }

    public function getDefaultUrlOpener(){
        return $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => "default_url_opener"));
    }

    public function addSearchWord($app, $searchWork){
        $app = $this->convertToEntity($app,"TwakeMarketBundle:Application");
        $app->addSearchWord($searchWork);
        $this->doctrine->persist($app);
        $this->doctrine->flush();
    }

    public function getAppsByName($name)
    {

        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $applications = $applicationRepository->findApplicationByName($name);

        return $applications;
    }

    public function getAppByPublicKey($publicKey){
        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $applications = $applicationRepository->findOneBy(Array("publicKey" => $publicKey));

        return $applications;
    }

    public function addFreeApplication($groupId, $appId, $currentUserId = null, $init = null)
    {
        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        /** @var Application $application */
        $application = $applicationRepository->find($appId);

        if ($application->getPriceMonthly() == 0 && $application->getPriceUser() == 0) {
            $this->addApplication($groupId, $appId);
        }

    }

    public function addApplication($groupId, $appId, $currentUserId = null, $init = null)
    {

        if($groupId == null || $appId == null){
            return false;
        }

        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $group = $groupRepository->find($groupId);

        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $application = $applicationRepository->find($appId);

        $groupAppRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");
        $groupApplication = $groupAppRepository->findOneBy(Array("group" => $group, "app" => $application));

        if($groupApplication!=null){
            return "app déjà existante";
        }

        $limit = $this->pricingPlan->getLimitation($groupId,"apps",PHP_INT_MAX);
        $listApp = $groupAppRepository->findBy(Array("group"=>$group));

        if(count($listApp) >= $limit){
            return "nombre d'application max atteinte" ;
        }

        if ( $currentUserId == null
            || $this->gms->hasPrivileges(
                $this->gms->getLevel($groupId, $currentUserId),
                "MANAGE_APPS"
            )
        ) {
            $groupapp = new GroupApp($group, $application);
            $appPricingInstance = new AppPricingInstance($groupapp);
            if($init){
                if($application->getDefault()) {
                    $groupapp->setWorkspaceDefault(true);
                }
            }
            $this->doctrine->persist($groupapp);
            $this->doctrine->persist($appPricingInstance);
            $application->increaseInstall();
            $this->doctrine->persist($application);

            $this->doctrine->flush();

            return true;
        }
        return false ;
    }

    public function getAppForUrl($url){
        if ($url != null){

            $pattern = '/\/\/([^\/]+)\//';
            $subject = $url;
            preg_match($pattern, $subject, $matches, PREG_OFFSET_CAPTURE);

            // if link is like "https://trello.com"
            if(count($matches)<2){
                return false;
            }

            $tmp = $matches[1][0];
            if(substr($tmp,0,4)=="www."){
                $domain_name = substr($tmp,4);
            }else{
                $domain_name = $tmp;
            }

            //Look up to 2 sub dir in url
            $url_tmp = str_replace("://", "", $url);
            $url_tmp = str_replace("//", "/", $url_tmp);
            $pattern = '/\/[^\/]+/';
            preg_match_all($pattern, $url_tmp, $matches, PREG_OFFSET_CAPTURE);

            //Test without first sub_domain (ex. twake.atlassian.net)
            $tmp = explode(".", $domain_name);
            array_shift($tmp);
            $domain_name_2 = join(".", $tmp);

            $i = 1;
            $to_test = Array($domain_name);
            foreach ($matches[0] as $match) {
                $to_test[] = $to_test[count($to_test) - 1] . $match[0];
                $i++;
                if ($i >= 2) {
                    break;
                }
            }
            $to_test[] = $domain_name_2;
            foreach ($matches[0] as $match) {
                $to_test[] = $to_test[count($to_test) - 1] . $match[0];
                $i++;
                if ($i >= 2) {
                    break;
                }
            }

            //For microsoft office apps...
            if (strpos($url, "app=") > 0) {
                preg_match("/(?:&|\?)app=([A-Za-z0-9]+)/", $url, $app, PREG_OFFSET_CAPTURE);
                $to_test[] = $domain_name . "/" . $app[1][0];
            }

            foreach ($to_test as $url) {
                $url = strtolower($url);
                $app = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("domain_name" => $url));
                if ($app) {
                    return $app;
                }
            }

            return false;
        }
    }
}