<?php

namespace BuiltInConnectors\Connectors\QuickLinks\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;
use BuiltInConnectors\Connectors\QuickLinks\ConnectorDefinition;

class Index extends BaseController
{
    public function icon()
    {
      $configuration = (new ConnectorDefinition($this->app))->getDefinition();
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

    public function read(Request $request)
    {
      //Récupérer les paramètres (type, et id) avec des $param = $request->request->get()
      $channel_id = $request->request->get("channel_id");
      $link_id = $request->request->get("link_id");
      //Appeler le "service" pour récupérer les liens
      $res = $this->get("connectors.quicklinks.links_service")->readLink($channel_id, $link_id);

      //Renvoyer la liste de liens
      return new Response(["response" => $res]);
    }


    public function save(Request $request)
    {
      // channel id, nouveau lien obj 
      $channel_id = $request->request->get("channel_id");
      $link = $request->request->get("link");
      $user_id = $request->request->get("user_id");
      $group_id = $request->request->get("group_id");
      $connection_id = $request->request->get("connection_id");


      $this->get("connectors.quicklinks.links_service")->generateForm($channel_id, $group_id, $user_id, $connection_id, $link);

      return new Response(["status"=>$link]);
    }

    public function remove(Request $request)
    {
      $channel_id = $request->request->get("channel_id");
      $link = $request->request->get("link");

      $res = $this->get("connectors.quicklinks.links_service")->deleteLink($channel_id, $link);

      return new Response(["status"=>$res]);
    }


    public function event(Request $request)
    {
        $data = $request->request->get("data");
        $event = $request->request->get("event");
        $type = $request->request->get("type");

        $this->get('connectors.quicklinks.event')->proceedEvent($type, $event, $data);

        return new Response([]);
    }

    public function app(Request $request)
    {

      $user_id = $request->query->get("twake_user", false);

      $id = explode("__", explode("twake_", array_pop(explode("/", $_SERVER['REQUEST_URI'])))[1]);

      $group_id = str_replace("_", "-", $id[0]);
      $id = str_replace("_", "", $id[1]);
      
      $channel_id = $request->query->get("channel_id", "default");
  
      $loader = new \Twig\Loader\FilesystemLoader(realpath(__DIR__.'/../Views/'));
      $twig = new \Twig\Environment($loader, [
          'debug' => true,
          'cache' => $this->app->getAppRootDir() . "/" . $this->app->getContainer()->get("configuration", "twig.cache"),
      ]);
      $twig->addExtension(new \Twig\Extension\DebugExtension());
      $template = $twig->load("Templates/call.html.twig");

      $icon = rtrim($this->get('connectors.common.main')->getServerBaseUrl(), "/") . "/quicklinks/icon";

      $configuration = (new ConnectorDefinition($this->app))->getConfiguration();
      return new Response($template->render(
        Array(
          "icon" => $icon,
          "ids" => [
            "link" => $request->query->get("link_id"),
            "user" => $request->query->get("user_id", "default"),
            "group" => $request->query->get("group_id", "default"),
            "channel" => $request->query->get("channel_id"),
            "connection" => $request->query->get("connection_id")
          ],
          "server_url" => rtrim($this->get('connectors.common.main')->getServerBaseUrl(), "/")
        )
      ));
    }
}
