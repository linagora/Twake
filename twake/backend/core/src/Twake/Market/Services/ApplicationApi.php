<?php

namespace Twake\Market\Services;

use Twake\Market\Entity\AccessToken;
use Twake\Market\Entity\Application;
use Twake\Market\Entity\ApplicationResourceNode;
use App\App;

class ApplicationApi
{
    private $app;
    private $doctrine;
    private $rest_client;

    public function __construct(App $app)
    {
        $this->app = $app;
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->rest_client = $app->getServices()->get("app.restclient");
    }


    public function generatedToken($app_id, $workspace_id, $group_id, $user_id)
    {

        $entity = new AccessToken($app_id, $workspace_id, $group_id, $user_id);
        $this->doctrine->useTTLOnFirstInsert(60 * 60);
        $this->doctrine->persist($entity);
        $this->doctrine->flush();

        return $entity->getToken();

    }

    /**
     * @param $request
     * @param array $capabilities
     * @param array $privileges
     * @return array|Application
     */
    public function getAppFromRequest($request, $capabilities = [], $privileges = [])
    {

        $header = $request->headers->get("Authorization");
        $explode1 = explode(" ", $header);

        if (count($explode1) == 2 && $explode1[0] == "Basic") {

            $exploser2 = explode(":", base64_decode($explode1[1]));

            if (count($exploser2) == 2) {
                $id = $exploser2[0];
                $privateKey = $exploser2[1];

                $application = $this->get($id);

                if ($application != null) {
                    $key = $application->getApiPrivateKey();

                    if ($key == $privateKey) {

                        $group_id = $request->request->get("group_id", null);

                        $group_app = $this->doctrine->getRepository("Twake\Workspaces:GroupApp")->findOneBy(Array("app_id" => $application->getId(), "group" => $group_id));

                        if($group_app->getPrivileges() === null){
                            return $application;
                        }

                        if ((!$group_id || !$group_app) && (count($capabilities) > 0 || count($privileges) > 0)) {
                            return Array("error" => "you_need_to_provide_a_valid_group_id_field_in_any_api_request", "group_id" => $group_id);
                        }

                        $can_do_it = false;
                        if ($group_id) {
                            $can_do_it = $this->hasCapability($application->getId(), $group_id, $capabilities, $group_app);
                        }
                        if (!$can_do_it) {
                            return Array("error" => "you_do_not_have_this_set_of_required_capabilities", "capabilities" => $capabilities);
                        }

                        if ($group_id) {
                            $can_do_it = $this->hasPrivilege($application->getId(), $group_id, $privileges, $group_app);
                        }
                        if (!$can_do_it) {
                            return Array("error" => "you_do_not_have_this_set_of_required_privileges", "privileges" => $privileges);
                        }

                        return $application;
                    }

                }
            }

        }

        return Array("error" => "unknown_application_or_bad_private_key");

    }

    /**
     * @param $app_id
     * @return Application
     */
    public function get($app_id)
    {
        return $this->doctrine->getRepository("Twake\Market:Application")->findOneBy(Array("id" => $app_id));
    }

    public function hasCapability($app_id, $group_id, $capabilities = [], $group_app = null)
    {
        $app = $this->get($app_id);
        $group_app = $group_app ? $group_app : $this->doctrine->getRepository("Twake\Workspaces:GroupApp")->findOneBy(Array("app_id" => $app_id, "group" => $group_id));

        if (!$group_app || !$app) {
            return false;
        }

        if (count($capabilities) == 0) {
            return true;
        }

        $accepted_capabilities = $group_app->getCapabilities();

        $ok = true;
        foreach ($capabilities as $capability) {
            if ($accepted_capabilities && !in_array($capability, $accepted_capabilities)) {
                $ok = false;
            }
        }
        if ($ok) {
            return true;
        }

        $app_capabilities = $app->getCapabilities();

        $ok = true;
        foreach ($capabilities as $capability) {
            if (!in_array($capability, $app_capabilities)) {
                $ok = false;
            }
        }
        if (!$ok) {
            return false;
        }

        //This app is developed by the group
        if ($group_id == $app->getGroupId()) {
            return true;
        }

        //TODO send an email to the group managers to update the app because it was not updated with latest capabilities

        return false;
    }

    public function hasPrivilege($app_id, $group_id, $privileges = [], $group_app = null)
    {
        $app = $this->get($app_id);
        $group_app = $group_app ? $group_app : $this->doctrine->getRepository("Twake\Workspaces:GroupApp")->findOneBy(Array("app_id" => $app_id, "group" => $group_id));

        if (!$group_app || !$app) {
            return false;
        }

        if (count($privileges) == 0) {
            return true;
        }

        $accepted_privileges = $group_app->getPrivileges();

        $ok = true;
        foreach ($privileges as $privilege) {
            if (!in_array($privilege, $accepted_privileges)) {
                $ok = false;
            }
        }
        if ($ok) {
            return true;
        }

        $app_privileges = $app->getPrivileges();

        $ok = true;
        foreach ($privileges as $privilege) {
            if (!in_array($privilege, $app_privileges)) {
                $ok = false;
            }
        }
        if (!$ok) {
            return false;
        }

        //This app is developed by the group
        if ($group_id == $app->getGroupId()) {
            return true;
        }

        //TODO send an email to the group managers to update the app because it was not updated with latest privileges

        return false;
    }

    public function hasResource($app_id, $workspace_id, $resource_type, $resource_id)
    {
    }

    public function setAsync()
    {
        $this->async = true;
    }

    public function unsetAsyncAndFlush()
    {
        $this->async = false;
        if ($this->curl_rcx) {
            $this->curl_rcx->execute();
        }
    }

    public function getResources($workspace_id, $resource_type, $resource_id)
    {
        $repo = $this->doctrine->getRepository("Twake\Market:ApplicationResourceNode");
        $list = $repo->findBy(Array("resource_id" => $resource_id));
        $final_list = [];
        foreach ($list as $el) {
            if ($el->getWorkspaceId() == $workspace_id) {
                $final_list[] = $el;
            }
        }
        return $final_list;
    }

    public function addResource($app_id, $workspace_id, $resource_type, $resource_id, $current_user_id = null)
    {
        $repo = $this->doctrine->getRepository("Twake\Market:Application");
        $app = $repo->findOneBy(Array("id" => $app_id));

        if (!$app) {
            return false;
        }

        $repo = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
        $workspace = $repo->findOneBy(Array("id" => $workspace_id));

        if (!$workspace) {
            return false;
        }

        $current_user = null;
        if ($current_user_id) {
            $repo = $this->doctrine->getRepository("Twake\Users:User");
            $current_user = $repo->findOneBy(Array("id" => $current_user_id));
        }

        //Verify we do not have this resource
        $repo = $this->doctrine->getRepository("Twake\Market:ApplicationResourceNode");
        $candidates = $repo->findBy(Array("application_id" => $app_id, "workspace_id" => $workspace_id));

        foreach ($candidates as $candidate) {
            if ($candidate->getResourceId() == $resource_id) { //No necessity to verufy type as uuid are universaly unique
                return true;
            }
        }

        $resource = new ApplicationResourceNode($workspace_id, $app_id, $resource_type, $resource_id);
        $resource->setApplicationHooks($app->getHooks());
        $this->doctrine->persist($resource);
        $this->doctrine->flush();

        $this->notifyApp($app_id, "resource", "add", Array(
            "workspace" => $workspace,
            "resource" => Array(
                "id" => $resource_id,
                "type" => $resource_type
            ),
            "user" => $current_user
        ));

        return true;

    }

    public function notifyApp($app_id, $type, $event, $data)
    {

        $event = Array(
            "type" => $type,
            "event" => $event,
            "data" => $data
        );

        if(isset($event["data"]["message"])){
            $event["data"]["message"]["channel_id"] = $event["data"]["message"]["cache"]["channel_id"];
            $event["data"]["message"]["workspace_id"] = $event["data"]["message"]["cache"]["workspace_id"];
        }

        if (!$this->curl_rcx) {
            $this->curl_rcx = new RollingCurlX(10);
            $this->curl_rcx->setOptions([
                CURLOPT_SSL_VERIFYPEER => false
            ]);
            $this->curl_rcx->setTimeout(3000);
            $this->curl_rcx->setHeaders(['Content-Type: application/json']);
        }

        $repo = $this->doctrine->getRepository("Twake\Market:Application");
        $app = $repo->findOneBy(Array("id" => $app_id));

        if (!$app) {
            return false;
        }

        $event_route = $app->getApiEventsUrl();

        //Check route is correct
        if (!parse_url($event_route, PHP_URL_HOST)) {
            return false;
        }
        $event_route = preg_replace("/^\/+/", "", $event_route);

        //Hack for having same set of apps in beta and web
        $betaHack = explode("/bundle/connectors/", $event_route);
        if(count($betaHack) > 1){
            $server_route = rtrim($this->app->getContainer()->getParameter("env.internal_server_name")?:$this->app->getContainer()->getParameter("env.server_name"), "/");
            $event_route = $server_route . "/bundle/connectors/" . $betaHack[1];
        }
        //Hack to send to connectors wich server to respond
        $event["_origin"] = $this->app->getContainer()->getParameter("env.server_name");

        $use_https = false;
        if (strpos($event_route, "https") === 0) {
            $use_https = true;
        }

        $event_route = preg_replace("/^https?+:\/\//", "", $event_route);
        $event_route = preg_replace("/\/+/", "/", $event_route);
        $parts = explode("/", $event_route);
        if (count($parts) == 1 || $parts[1] == "" || $parts[0] == "") {
            return false; //No domain or no route
        }

        if ($use_https) {
            $event_route = "https://" . $event_route;
        } else {
            $event_route = "http://" . $event_route;
        }


        $data = json_encode($event);

        try {

            $this->curl_rcx->addRequest($event_route, $data);

            if (!$this->async) {
                $this->curl_rcx->execute();
            }

        } catch (\Exception $e) {
            //Timeout exceeded maybe
        }

        return true;

    }

    public function removeResource($app_id, $workspace_id, $resource_type, $resource_id, $current_user_id = null)
    {
        $repo = $this->doctrine->getRepository("Twake\Market:Application");
        $app = $repo->findOneBy(Array("id" => $app_id));

        if (!$app) {
            return false;
        }

        $repo = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
        $workspace = $repo->findOneBy(Array("id" => $workspace_id));

        if (!$workspace) {
            return false;
        }

        $current_user = null;
        if ($current_user_id) {
            $repo = $this->doctrine->getRepository("Twake\Users:User");
            $current_user = $repo->findOneBy(Array("id" => $current_user_id));
        }

        //Verify we have this resource
        $repo = $this->doctrine->getRepository("Twake\Market:ApplicationResourceNode");
        $candidates = $repo->findBy(Array("application_id" => $app_id, "workspace_id" => $workspace_id));

        $choosen = null;
        foreach ($candidates as $candidate) {
            if ($candidate->getResourceId() == $resource_id) { //No necessity to verufy type as uuid are universaly unique
                $choosen = $candidate;
            }
        }

        if ($choosen) {
            $this->doctrine->remove($choosen);
            $this->doctrine->flush();
        }

        $this->notifyApp($app_id, "resource", "remove", Array(
            "workspace" => $workspace,
            "resource" => Array(
                "id" => $resource_id,
                "type" => $resource_type
            ),
            "user" => $current_user
        ));

        return true;

    }

}
