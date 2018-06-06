<?php

namespace DevelopersApiV1\DriveBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Finder\Finder;

class FileSystemController extends Controller
{
    public function addObjectAction(Request $request, $workspace_id)
    {
        $a = $this->get("api.v1.check")->check($request);
        var_dump("Bienvenue = ".$workspace_id);

        $r = $this->get("api.v1.check")->isAllowedTo($a,"calendar:write");
        var_dump($r);
        return new JsonResponse();


    }
}
