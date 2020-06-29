<?php

namespace BuiltInConnectors\Connectors\Linshare\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;
use BuiltInConnectors\Connectors\Linshare\ConnectorDefinition;

class Index extends BaseController
{
    public function icon()
    {
      $configuration = (new ConnectorDefinition())->definition;
      $route = realpath(__DIR__."/../Resources/medias/".$configuration["icon_url"]);
      error_log($route);

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

        $this->get('connectors.linshare.event')->proceedEvent($type, $event, $data);

        return new Response([]);
    }

}
