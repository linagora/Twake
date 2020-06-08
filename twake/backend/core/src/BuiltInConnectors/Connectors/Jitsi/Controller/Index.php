<?php

namespace BuiltInConnectors\Connectors\Jitsi\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;
use BuiltInConnectors\Connectors\Jitsi\ConnectorDefinition;

class Index extends BaseController
{

    public function event(Request $request)
    {
        $data = $request->request->get("data");
        $event = $request->request->get("event");
        $type = $request->request->get("type");

        $this->get('connectors.jitsi.event')->proceedEvent($type, $event, $data);

        return new Response([]);
    }

    public function call(Request $request){
        $user_id = $request->query->get("twake_user", false);
        $group_id = $request->query->get("twake_group", false);
        $user = $this->get('connectors.jitsi.event')->getUserFromId(str_replace("twake-", "", str_replace("_", "-", $id)), $user_id, $group_id);

        $loader = new \Twig\Loader\FilesystemLoader(__DIR__.'/../Views/');
        $twig = new \Twig\Environment($loader, [
            'cache' =>  $this->app->getAppRootDir() . "/" . $this->app->getContainer()->get("configuration", "twig.cache"),
        ]);
        $twig->load("index.html.twig");

        $configuration = (new ConnectorDefinition())->configuration;

        return $twig->render(
          Array(
            "id" => $id,
            "user" => $user,
            "jitsi_domain" => $configuration["jitsi_domain"]
          )
        );
    }

}
