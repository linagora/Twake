<?php

namespace Twake\Market\Services;

use Twake\Market\Entity\Application;
use Twake\Market\Model\MarketApplicationInterface;
use App\App;

class MarketApplication
{
    private $doctrine;
    private $gms;

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->gms = $app->getServices()->get("app.group_managers");
    }

    public function findBySimpleName($name, $entity = false)
    {
        $repo = $this->doctrine->getRepository("Twake\Market:Application");
        $app = $repo->findOneBy(Array("simple_name" => $name));
        return ($app && !$entity) ? $app->getAsArray() : $app;
    }

    public function getCredentials($simple_name){
      $repo = $this->doctrine->getRepository("Twake\Market:Application");
      $app = $repo->findOneBy(Array("simple_name" => $simple_name));
      return ($app) ? $app->getAsCredentialArray() : false;
    }

    public function find($id, $entity = false)
    {
        $repo = $this->doctrine->getRepository("Twake\Market:Application");
        $app = $repo->findOneBy(Array("id" => $id));
        return ($app && !$entity) ? $app->getAsArray() : $app;
    }

    public function createApp($workspace_id, $name, $simple_name, $app_group_name, $current_user_id)
    {

        $group_id = "00000000-0000-1000-0000-000000000000";
        if($workspace_id || $current_user_id != null){
          $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
          $workspace = $groupRepository->findOneBy(Array("id" => $workspace_id));
          $group_id = $workspace->getGroup();
        }

        if ($current_user_id == null
            || $this->gms->hasPrivileges(
                $this->gms->getLevel($group_id, $current_user_id),
                "MANAGE_APPS"
            )
        ) {

            if (!$name || !$simple_name || (!$workspace_id && $current_user_id != null)) {
                return false;
            }

            $application = new Application($group_id, $name);
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

        $group_id = "00000000-0000-1000-0000-000000000000";
        if($workspace_id || $current_user_id != null){
          $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
          $workspace = $groupRepository->findOneBy(Array("id" => $workspace_id));
          $group_id = $workspace->getGroup();
        }

        if ($current_user_id == null
            || $this->gms->hasPrivileges(
                $this->gms->getLevel($group_id, $current_user_id),
                "MANAGE_APPS"
            )
        ) {

            $repo = $this->doctrine->getRepository("Twake\Market:Application");
            $apps = $repo->findBy(Array("group_id" => $group_id));

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

        $repo = $this->doctrine->getRepository("Twake\Market:Application");

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

        $applicationRepository = $this->doctrine->getRepository("Twake\Market:Application");
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

    public function toggleAppDefault($application_id, $status = null){
      $appsRepository = $this->doctrine->getRepository("Twake\Market:Application");
      $app = $appsRepository->findOneBy(array("id" => $application_id));

      $rep = false;

      if ($app) {

          $app->setEsIndexed(false);

          if($status === null){
            $status = !$app->getDefault();
          }

          $app->setDefault($status);
          $this->doctrine->persist($app);
      }

      $this->doctrine->flush();
    }

    public function toggleAppValidation($application_id, $status = null){
      $appsRepository = $this->doctrine->getRepository("Twake\Market:Application");
      $app = $appsRepository->findOneBy(array("id" => $application_id));

      $rep = false;

      if ($app) {

          $app->setEsIndexed(false);

          if ($app->getPublic()) {

              if($status === null){
                $status = !$app->getIsAvailableToPublic();
              }

              $app->setIsAvailableToPublic($status);
              if(!$status){
                $app->setPublic(false);
              }
              $this->doctrine->persist($app);
          }
      }

      $this->doctrine->flush();
    }

    public function remove($application_id, $current_user_id)
    {

        $applicationRepository = $this->doctrine->getRepository("Twake\Market:Application");
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

                    $this->doctrine->getRepository("Twake\Market:ApplicationResourceNode")->removeBy(Array("application_id" => $application->getId()));
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
            "repository" => "Twake\Market:Application",
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

        if(count($result) === 0){
          $app = $this->findAppBySimpleName($query);
          if($app){
            $result[] = $app;
          }else{
            $app = $this->findAppBySimpleName("twake.".$query);
            if($app){
              $result[] = $app;
            }
          }
        }

        return $result;
    }

}
