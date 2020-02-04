<?php

namespace WebsiteApi\MarketBundle\Services;

use WebsiteApi\MarketBundle\Entity\Application;
use WebsiteApi\MarketBundle\Model\MarketApplicationInterface;

class MarketApplication
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

    public function findBySimpleName($name, $entity = false)
    {
        $repo = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $app = $repo->findOneBy(Array("simple_name" => $name));
        return ($app && !$entity) ? $app->getAsArray() : $app;
    }

    public function find($id, $entity = false)
    {
        $repo = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $app = $repo->findOneBy(Array("id" => $id));
        return ($app && !$entity) ? $app->getAsArray() : $app;
    }

    public function createApp($workspace_id, $name, $simple_name, $app_group_name, $current_user_id)
    {

        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        $workspace = $groupRepository->findOneBy(Array("id" => $workspace_id));
        $group = $workspace->getGroup();

        if ($current_user_id == null
            || $this->gms->hasPrivileges(
                $this->gms->getLevel($group->getId(), $current_user_id),
                "MANAGE_APPS"
            )
        ) {

            if (!$name || !$simple_name || !$workspace_id) {
                return false;
            }

            $application = new Application($group->getId(), $name);
            $application->setCreationDate(new \DateTime());
            $application->setAppGroupName($app_group_name);

            $application->setSimpleName($simple_name);

            $application->setApiPrivateKey(Application::generatePrivateApiKey());

            $this->doctrine->persist($application);
            $this->doctrine->flush();

            return $application->getAsArrayForDevelopers();

        }
        return false;
    }

    public function getGroupDevelopedApps($workspace_id, $current_user_id)
    {

        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        $workspace = $groupRepository->findOneBy(Array("id" => $workspace_id));
        $group = $workspace->getGroup();

        if ($current_user_id == null
            || $this->gms->hasPrivileges(
                $this->gms->getLevel($group->getId(), $current_user_id),
                "MANAGE_APPS"
            )
        ) {

            $repo = $this->doctrine->getRepository("TwakeMarketBundle:Application");
            $apps = $repo->findBy(Array("group_id" => $group->getId()));

            $list = [];

            foreach ($apps as $app) {
                $list[] = $app->getAsArrayForDevelopers();
            }

            return $list;

        }
        return [];
    }

    public function findAppBySimpleName($simple_name, $include_private_apps = false)
    {

        $repo = $this->doctrine->getRepository("TwakeMarketBundle:Application");

        $app = $repo->findOneBy(Array("simple_name" => $simple_name));

        if (!$app) {
            return false;
        }

        if (!$include_private_apps && !$app->getisAvailableToPublic()) {
            return false;
        }

        return $app->getAsArray();
    }

    public function update($application, $current_user_id)
    {

        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        /**
         * @var Application $application_original
         */
        $application_original = $applicationRepository->findOneBy(Array('id' => $application["id"]));

        if ($application_original) {

            $group_id = $application_original->getGroupId();
            if ($current_user_id == null
                || $this->gms->hasPrivileges(
                    $this->gms->getLevel($group_id, $current_user_id),
                    "MANAGE_APPS"
                )
            ) {

                if (!$application_original->getPublic()) {

                    $application_original->setSimpleName($application["simple_name"]);
                    $application_original->setName($application["name"]);
                    $application_original->setDescription($application["description"]);
                    $application_original->setIconUrl($application["icon_url"]);
                    $application_original->setWebsite($application["website"]);
                    $application_original->setCategories($application["categories"]);

                    $old_privileges = $application_original->getPrivileges();
                    $old_capabilities = $application_original->getCapabilities();
                    $changed = false;
                    foreach ($application["privileges"] as $pr) {
                        if (!in_array($pr, $old_privileges)) {
                            $changed = true;
                        }
                    }
                    foreach ($application["capabilities"] as $pr) {
                        if (!in_array($pr, $old_capabilities)) {
                            $changed = true;
                        }
                    }

                    if ($changed) {
                        $application_original->setPrivilegesCapabilitiesLastUpdate(new \DateTime());
                        $application_original->setTwakeTeamValidation(false);
                        $application_original->setIsAvailableToPublic(false);
                    }

                    $application_original->setPrivileges($application["privileges"]);
                    $application_original->setCapabilities($application["capabilities"]);
                    $application_original->setHooks($application["hooks"]);

                    $application_original->setDisplayConfiguration($application["display"]);
                }

                $application_original->setApiAllowedIp($application["api_allowed_ips"]);

                if (strpos($application["api_event_url"], "https") === 0 || !$application_original->getisAvailableToPublic()) {
                    $application_original->setApiEventsUrl($application["api_event_url"]);
                }

                $application_original->setPublic($application["public"]);
                if (!$application["public"]) {
                    $application_original->setTwakeTeamValidation(false);
                    $application_original->setIsAvailableToPublic(false);
                }

                $this->doctrine->persist($application_original);
                $this->doctrine->flush();

                return $application_original->getAsArrayForDevelopers();

            }

        }

        return false;

    }

    public function remove($application_id, $current_user_id)
    {

        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $application = $applicationRepository->findOneBy(Array('id' => $application_id));

        if ($application) {

            $group_id = $application->getGroupId();
            if ($current_user_id == null
                || $this->gms->hasPrivileges(
                    $this->gms->getLevel($group_id, $current_user_id),
                    "MANAGE_APPS"
                )
            ) {

                if (!$application->getisAvailableToPublic()) {

                    $this->doctrine->getRepository("TwakeMarketBundle:ApplicationResource")->removeBy(Array("application_id" => $application->getId()));
                    //TODO REMOVE EVERYWHERE

                    $this->doctrine->remove($application);
                    $this->doctrine->flush();

                    return true;

                }

            }

        }

        return false;

    }


    public function search($group_id, $query, $current_user_id = null)
    {

        $allows_unpublished_apps_from_group_id = "null";
        if ($current_user_id == null
            || $this->gms->hasPrivileges(
                $this->gms->getLevel($group_id, $current_user_id),
                "MANAGE_APPS"
            )
        ) {
            $allows_unpublished_apps_from_group_id = $group_id;
        }

        $options = Array(
            "repository" => "TwakeMarketBundle:Application",
            "index" => "applications",
            "fallback_keys" => Array(
                "name" => $query
            ),
            "query" => Array(
                "bool" => Array(
                    "filter" => Array(
                        "query_string" => Array(
                            "query" => "group_id:" . $allows_unpublished_apps_from_group_id . " OR public:true"
                        )
                    ),
                    "must" => Array(
                        "query_string" => Array(
                            "query" => "*" . $query . "*"
                        )
                    )
                )
            )
        );

        $applications = $this->doctrine->es_search($options);

        $result = [];
        foreach ($applications["result"] as $application) {
            $application = $application[0];
            if ($allows_unpublished_apps_from_group_id == $application->getGroupId() || $application->getPublic()) {
                $result[] = $application->getAsArray();
            }
        }

        return $result;
    }

}