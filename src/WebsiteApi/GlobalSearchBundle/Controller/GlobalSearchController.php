<?php


namespace WebsiteApi\GlobalSearchBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class GlobalSearchController extends Controller
{

    public function ESAction(Request $request)
    {

        $this->get('globalsearch.file')->TestSearch();

        return new Response("Hello !");

    }

    public function GlobalSearchUWCAction(Request $request)
    {
        $this->get('globalsearch.globaluwc')->GlobalSearch();

        return new Response("Hello !");
    }

    public function GlobalSearchMFAction(Request $request)
    {
        $this->get('globalsearch.globalmf')->GlobalSearch();

        return new Response("Hello !");
    }
}
