<?php

namespace WebsiteApi\CoreBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class VersionController extends Controller
{

    public function getAction()
    {

        $data = Array(
            "use_cas" => false,
            "elastic_search_available" => !!$this->container->getParameter("ELASTIC_SERVER"),
            "help_link" => "https://go.crisp.chat/chat/embed/?website_id=9ef1628b-1730-4044-b779-72ca48893161",
            "version" => "1.2.0-0",
            "last_compatible_mobile_version" => "1.2.000"
        );

        if ($this->container->hasParameter("branding")) {
            $branding = $this->container->getParameter("branding");
            if ($branding && $branding["name"]) {
                $data["branding"] = $branding;
            }
        }

        return new JsonResponse(Array("data" =>
            $data
        ));


    }

}