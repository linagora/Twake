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

    public function ReindexAction(Request $request)
    {

        $this->get('globalsearch.reindex')->Reindex();

        return new Response("Hello !");

    }

    public function MappingAction(Request $request)
    {

        $this->get('globalsearch.mapping')->Mapping();

        return new Response("Hello !");

    }

    public function QuickSearchAction(Request $request)
    {
        $current_user = $this->getUser();
        $words = $identifier = $request->request->get("words");
        $group_id = $request->request->get("group_id");
        $workspace_id = $request->request->get("workspace_id");
        $group_id="480f11b4-4747-11e9-aa8e-0242ac120005";
        if(!(isset($current_user)))
        {
            $current_user_id = "d8a1136c-544e-11e9-9f85-0242ac120005";
        }
        else
        {
            $current_user_id= $current_user->getId();
        }
        //$current_user_id= $current_user->getId();
        //var_dump($current_user);
        $globalresult = $this->get('globalsearch.quicksearch')->QuickSearch($current_user_id, $words, $group_id, $workspace_id);
        $data = Array("data" => $globalresult);
        //var_dump($data);
        return new Response("Hello !");
        //return new JsonResponse($data);

    }

    public function AdvancedSearchAction(Request $request)
    {

        $current_user = $this->getUser();
        //error_log(print_r($current_user,true));
        $group_id="480f11b4-4747-11e9-aa8e-0242ac120005";
        if(!(isset($current_user)))
        {
            $current_user_id = "d8a1136c-544e-11e9-9f85-0242ac120005";
        }
        else
        {
            $current_user_id= $current_user->getId();
        }
        $globalresult = $this->get('globalsearch.advancedsearch')->AdvancedSearch($current_user_id,$group_id);
        $data = Array("data" => $globalresult);
        return new JsonResponse($data);

    }
}
