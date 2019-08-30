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

    public function TestIndexAction(Request $request)
    {

        $this->get('globalsearch.file')->index();
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

//        $scroll_id = $request->request->get("scroll_id");
//        $repository = $request->request->get("repository");
//        $scroll_id = "DnF1ZXJ5VGhlbkZldGNoBQAAAAAAAAezFnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAHtBZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FRAAAAAAAAB7UWeFZ5Z1FkT0VScXV4VVFzMWhyWWNRUQAAAAAAAAe2FnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAHtxZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FR";
//        $repository = "TwakeGlobalSearchBundle:Bloc";

        if(isset($scroll_id) && isset($repository)){
            $globalresult = $this->get('globalsearch.pagination')->getnextelement($scroll_id,$repository);
        }
        else{
            $current_user = $this->getUser();
            $words = $identifier = $request->request->get("words");
            $group_id = $request->request->get("group_id");
            $workspace_id = $request->request->get("workspace_id");
            $current_user_id = $current_user->getId();

            //$globalresult = $this->get('globalsearch.quicksearch')->QuickSearch($current_user_id, $words, $group_id, $workspace_id);
            $channels = Array("db2c2b9e-c357-11e9-933e-0242ac1d0005");
            //$tests
            $globalresult= $this->get('globalsearch.advancedsearch')->AdvancedSearch($current_user_id,$words,$channels);
        }



        $data = Array("data" => $globalresult);
        //return new Response("Hello !");
        return new JsonResponse($data);

    }

    public function AdvancedSearchAction(Request $request)
    {
        //$words = $identifier = $request->request->get("words");
        //$group_id = $request->request->get("group_id");
        $options =  $request->request->get("options");
        $channels= $request->request->get("channel_id");

        //$current_user = $this->getUser();
        //$current_user_id = $current_user->getId();

        $options = Array(
            "words" => Array("salut","blabla"),
            "date_before" => "2019-08-30",
            "date_after" => "2019-08-20",
            "reactions" => Array("sun"),
            "mentions" => Array("3aa48caa-ad60-11e9-8cdf-0242ac1d0005","3af5c99e-ad60-11e9-9e16-0242ac1d0005"),
            "sender" => "3aa48caa-ad60-11e9-8cdf-0242ac1d0005"

        );

        if(!(isset($current_user)))
        {
            $current_user_id = "3aa48caa-ad60-11e9-8cdf-0242ac1d0005";
        }
        else
        {
            $current_user_id= $current_user->getId();
        }
        $channels = Array("db2c2b9e-c357-11e9-933e-0242ac1d0005");
        $globalresult = $this->get('globalsearch.advancedsearch')->AdvancedSearch($current_user_id,$options,$channels);
        $data = Array("data" => $globalresult);
        return new JsonResponse($data);

    }
}
