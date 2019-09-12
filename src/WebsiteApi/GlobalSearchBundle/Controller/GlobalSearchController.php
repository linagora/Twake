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
//

        if(isset($scroll_id) && isset($repository)){
            $globalresult = $this->get('globalsearch.pagination')->getnextelement($scroll_id,$repository);
        }
        else{
            $current_user = $this->getUser();
            //$words = $identifier = $request->request->get("words");
            $group_id = $request->request->get("group_id");
            $workspace_id = $request->request->get("workspace_id");
            //$current_user_id = $current_user->getId();
            if (!(isset($current_user))) {
                $current_user_id = "3aa48caa-ad60-11e9-8cdf-0242ac1d0005";
            } else {
                $current_user_id = $current_user->getId();
            }
            $words = Array("test");
            $globalresult = $this->get('globalsearch.quicksearch')->QuickSearch($current_user_id, $words, $group_id, $workspace_id);
        }

        $this->get("administration.counter")->incrementCounter("total_quicksearch", 1);

        $data = Array("data" => $globalresult);
        //return new Response("Hello !");
        return new JsonResponse($data);

    }

    public function AdvancedBlocAction(Request $request)
    {
         $scroll_id = $request->request->get("scroll_id");
        //$scroll_id = "DnF1ZXJ5VGhlbkZldGNoBQAAAAAAABgNFnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAYDBZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FRAAAAAAAAGA4WeFZ5Z1FkT0VScXV4VVFzMWhyWWNRUQAAAAAAABgPFnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAYEBZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FR";
        $repository = "TwakeGlobalSearchBundle:Bloc";

        $options = $request->request->get("options");
        $channels = $request->request->get("channel_id");

        if(isset($scroll_id) && isset($repository)){
            $options["scroll_id"] = $scroll_id;
        }

        $current_user = $this->getUser();
        $current_user_id = $current_user->getId();

//            $options = Array(
//                "words" => Array("romar"),
//                "date_before" => "2019-09-30",
//                "date_after" => "2019-08-20",
//                "reactions" => Array("sun"),
//                "mentions" => Array("3aa48caa-ad60-11e9-8cdf-0242ac1d0005"),
//                "sender" => "3aa48caa-ad60-11e9-8cdf-0242ac1d0005",
//                //"application_id" => "31e572d0-c356-11e9-a2bc-0242ac1d0005"
//                "pinned" => true,
//                //"tags" => Array("4f3b9286-cef7-11e9-9732-0242ac1d0005")
//            );

//            if (!(isset($current_user))) {
//                $current_user_id = "3aa48caa-ad60-11e9-8cdf-0242ac1d0005";
//            } else {
//                $current_user_id = $current_user->getId();
//            }
//            $channels = Array("db2c2b9e-c357-11e9-933e-0242ac1d0005");
        $globalresult = $this->get('globalsearch.advancedbloc')->AdvancedBloc($current_user_id, $options, $channels);

        $this->get("administration.counter")->incrementCounter("total_search", 1);

        $data = Array("data" => $globalresult);
        return new JsonResponse($data);
    }

    public function AdvancedFileAction(Request $request)
    {

        $scroll_id = $request->request->get("scroll_id");
        //$scroll_id = "DnF1ZXJ5VGhlbkZldGNoBQAAAAAAABgNFnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAYDBZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FRAAAAAAAAGA4WeFZ5Z1FkT0VScXV4VVFzMWhyWWNRUQAAAAAAABgPFnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAYEBZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FR";
        $repository = "TwakeGlobalSearchBundle:Bloc";

        if(isset($scroll_id) && isset($repository)){
            $globalresult = $this->get('globalsearch.pagination')->getnextelement($scroll_id,$repository);
        }
        else {
            $options = $request->request->get("options");
            $workspaces = $request->request->get("workspace_id");

            $current_user = $this->getUser();
            $current_user_id = $current_user->getId();

//            $options = Array(
//                "name" => "jack",
//                "date_create_before" => "2019-09-30",
//                "date_create_after" => "2019-08-20",
//                "date_modified_before" => "2019-09-30",
//                "date_modified_after" => "2019-08-20",
//                "size_gte" => 0,
//                "size_lte" => 2000000000,
//                "type" => "png",
//                "creator" => "3aa48caa-ad60-11e9-8cdf-0242ac1d0005",
//                "tags" => Array("4f3b9286-cef7-11e9-9732-0242ac1d0005")
//
//            );
//
//            if (!(isset($current_user))) {
//                $current_user_id = "3aa48caa-ad60-11e9-8cdf-0242ac1d0005";
//            } else {
//                $current_user_id = $current_user->getId();
//            }
//            $workspaces = Array("52a05d64-c356-11e9-8117-0242ac1d0005");
            $globalresult = $this->get('globalsearch.advancedfile')->AdvancedFile($current_user_id, $options, $workspaces);
        }
        $data = Array("data" => $globalresult);
        //return new Response("Hello !");
        return new JsonResponse($data);
    }

    public function AdvancedTaskAction(Request $request)
    {

        $scroll_id = $request->request->get("scroll_id");
        //$scroll_id = "DnF1ZXJ5VGhlbkZldGNoBQAAAAAAABgNFnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAYDBZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FRAAAAAAAAGA4WeFZ5Z1FkT0VScXV4VVFzMWhyWWNRUQAAAAAAABgPFnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAYEBZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FR";
        $repository = "TwakeTasksBundle:Task";

        if(isset($scroll_id) && isset($repository)){
            $globalresult = $this->get('globalsearch.pagination')->getnextelement($scroll_id,$repository);
        }
        else {
            $options = $request->request->get("options");
            $workspaces = $request->request->get("workspace_id");

//            $current_user = $this->getUser();
//            $current_user_id = $current_user->getId();

            $options = Array(
                "title" => "final",
                "description" => "description",
                "date_to" => "2019-09-30",
                "date_from" => "2019-08-20",
                "date_modified_before" => "2019-09-30",
                "date_modified_after" => "2019-08-20",
                "owner" => "3aa48caa-ad60-11e9-8cdf-0242ac1d0005",
//                "tags" => Array("4f3b9286-cef7-11e9-9732-0242ac1d0005"),
                "participants" => Array("3aa48caa-ad60-11e9-8cdf-0242ac1d0005")

            );
            if (!(isset($current_user))) {
                $current_user_id = "3aa48caa-ad60-11e9-8cdf-0242ac1d0005";
            } else {
                $current_user_id = $current_user->getId();
            }
            $workspaces = Array("52a05d64-c356-11e9-8117-0242ac1d0005");
            $globalresult = $this->get('globalsearch.advancedtask')->AdvancedTask($current_user_id, $options, $workspaces);
        }
        $data = Array("data" => $globalresult);
        //return new Response("Hello !");
        return new JsonResponse($data);
    }

    public function AdvancedEventAction(Request $request)
    {

        $scroll_id = $request->request->get("scroll_id");
        //$scroll_id = "DnF1ZXJ5VGhlbkZldGNoBQAAAAAAABgNFnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAYDBZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FRAAAAAAAAGA4WeFZ5Z1FkT0VScXV4VVFzMWhyWWNRUQAAAAAAABgPFnhWeWdRZE9FUnF1eFVRczFoclljUVEAAAAAAAAYEBZ4VnlnUWRPRVJxdXhVUXMxaHJZY1FR";
        $repository = "TwakeCalendarBundle:Event";

        if(isset($scroll_id) && isset($repository)){
            $globalresult = $this->get('globalsearch.pagination')->getnextelement($scroll_id,$repository);
        }
        else {
            $options = $request->request->get("options");
            $workspaces = $request->request->get("workspace_id");

//            $current_user = $this->getUser();
//            $current_user_id = $current_user->getId();

            $options = Array(
                "title" => "final",
                "description" => "description",
                "date_to" => "2019-09-30",
                "date_from" => "2019-08-20",
                "date_modified_before" => "2019-09-30",
                "date_modified_after" => "2019-08-20",
//                "owner" => "3aa48caa-ad60-11e9-8cdf-0242ac1d0005",
//                "tags" => Array("4f3b9286-cef7-11e9-9732-0242ac1d0005"),
                "participants" => Array("3aa48caa-ad60-11e9-8cdf-0242ac1d0005", "benoit")

            );
            if (!(isset($current_user))) {
                $current_user_id = "3aa48caa-ad60-11e9-8cdf-0242ac1d0005";
            } else {
                $current_user_id = $current_user->getId();
            }
            $workspaces = Array("52a05d64-c356-11e9-8117-0242ac1d0005");
            $globalresult = $this->get('globalsearch.advancedevent')->AdvancedEvent($current_user_id, $options, $workspaces);
        }
        $data = Array("data" => $globalresult);
        //return new Response("Hello !");
        return new JsonResponse($data);
    }

}
