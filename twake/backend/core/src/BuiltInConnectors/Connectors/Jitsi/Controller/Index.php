<?php

namespace BuiltInConnectors\Connectors\Jitsi\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;
use BuiltInConnectors\Connectors\Jitsi\ConnectorDefinition;

class Index extends BaseController
{
    public function icon()
    {
      $configuration = (new ConnectorDefinition())->definition;
      $route = realpath(__DIR__."/../Resources/medias/".$configuration["icon_url"]);

      $filename = basename($route);
      $file_extension = strtolower(substr(strrchr($filename,"."),1));

      switch( $file_extension ) {
          case "gif": $ctype="image/gif"; break;
          case "png": $ctype="image/png"; break;
          case "jpeg":
          case "jpg": $ctype="image/jpeg"; break;
          case "svg": $ctype="image/svg+xml"; break;
          default:
      }

      header('Content-type: ' . $ctype);

      return new Response(file_get_contents($route));
    }

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

        $id = explode("__", explode("twake_", array_pop(explode("/", $_SERVER['REQUEST_URI'])))[1]);

        $group_id = str_replace("_", "-", $id[0]);
        $id = str_replace("_", "", $id[1]);
        $user = $this->get('connectors.jitsi.event')->getUserFromId(str_replace("twake-", "", str_replace("_", "-", $id)), $user_id, $group_id);

        $loader = new \Twig\Loader\FilesystemLoader(realpath(__DIR__.'/../Views/'));
        $twig = new \Twig\Environment($loader, [
            'cache' =>  $this->app->getAppRootDir() . "/" . $this->app->getContainer()->get("configuration", "twig.cache"),
        ]);
        $template = $twig->load("Templates/call.html.twig");

        $configuration = (new ConnectorDefinition())->configuration;

        return new Response($template->render(
          Array(
            "id" => $id,
            "user" => $user,
            "jitsi_domain" => $this->getParameter("defaults.connectors.jitsi.jitsi_domain", $configuration["jitsi_domain"])
          )
        ));
    }

}
