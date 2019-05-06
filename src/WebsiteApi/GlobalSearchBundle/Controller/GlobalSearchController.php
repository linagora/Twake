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

        $this->get('globalsearch.event')->TestSearch();

        return new Response("Hello !");

    }

    public function ESGlobalAction(Request $request)
    {
        $this->get('globalsearch.global')->GlobalSearch();

        return new Response("Hello !");

    }
}
