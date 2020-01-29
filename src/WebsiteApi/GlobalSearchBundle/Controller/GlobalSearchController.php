<?php


namespace WebsiteApi\GlobalSearchBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class GlobalSearchController extends Controller
{

    public function QuickSearchAction(Request $request)
    {

        $current_user = $this->getUser();
        $words = $identifier = $request->request->get("words");
        $group_id = $request->request->get("group_id");
        $workspace_id = $request->request->get("workspace_id");
        $current_user_id = $current_user->getId();

        $globalresult = $this->get('globalsearch.quicksearch')->QuickSearch($current_user_id, $words, $group_id, $workspace_id);


        $this->get("administration.counter")->incrementCounter("total_quicksearch", 1);

        $data = Array("data" => $globalresult);
        return new JsonResponse($data);

    }

    public function AdvancedBlocAction(Request $request)
    {

        $scroll_id = $request->request->get("scroll_id");
        $repository = "TwakeGlobalSearchBundle:Bloc";

        $options = $request->request->get("options");
        $channels = $request->request->get("channel_id");

        if (isset($scroll_id) && isset($repository)) {
            $options["scroll_id"] = $scroll_id;
        }

        $current_user = $this->getUser();
        $current_user_id = $current_user->getId();

        $options["words"] = $options["words"] ? $options["words"] : $request->request->get("words");

        $globalresult = $this->get('globalsearch.advancedbloc')->AdvancedBloc($current_user_id, $options, $channels);

        $this->get("administration.counter")->incrementCounter("total_search", 1);

        $data = Array("data" => $globalresult);
        return new JsonResponse($data);
    }

    public function AdvancedFileAction(Request $request)
    {

        $scroll_id = $request->request->get("scroll_id");
        $repository = "TwakeGlobalSearchBundle:Bloc";


        $options = $request->request->get("options");
        $workspaces = $request->request->get("workspace_id");

        if (isset($scroll_id) && isset($repository)) {
            $options["scroll_id"] = $scroll_id;
        }

        $current_user = $this->getUser();
        $current_user_id = $current_user->getId();

        $options["name"] = $options["name"] ? $options["name"] : join(" ", $request->request->get("words"));

        $globalresult = $this->get('globalsearch.advancedfile')->AdvancedFile($current_user_id, $options, $workspaces);

        $data = Array("data" => $globalresult);
        return new JsonResponse($data);
    }

    public function AdvancedTaskAction(Request $request)
    {

        $scroll_id = $request->request->get("scroll_id");
        $repository = "TwakeTasksBundle:Task";


        $options = $request->request->get("options");
        $workspaces = $request->request->get("workspace_id");

        if (isset($scroll_id) && isset($repository)) {
            $options["scroll_id"] = $scroll_id;
        }

        $current_user = $this->getUser();
        $current_user_id = $current_user->getId();

        $options["name"] = $options["name"] ? $options["name"] : join(" ", $request->request->get("words"));

        $globalresult = $this->get('globalsearch.advancedtask')->AdvancedTask($current_user_id, $options, $workspaces);

        $data = Array("data" => $globalresult);
        return new JsonResponse($data);
    }

    public function AdvancedEventAction(Request $request)
    {

        $scroll_id = $request->request->get("scroll_id");
        $repository = "TwakeCalendarBundle:Event";

        $options = $request->request->get("options");
        $workspaces = $request->request->get("workspace_id");

        if (isset($scroll_id) && isset($repository)) {
            $options["scroll_id"] = $scroll_id;
        }

        $current_user = $this->getUser();
        $current_user_id = $current_user->getId();

        $options["name"] = $options["name"] ? $options["name"] : join(" ", $request->request->get("words"));

        $globalresult = $this->get('globalsearch.advancedevent')->AdvancedEvent($current_user_id, $options, $workspaces);

        $data = Array("data" => $globalresult);
        return new JsonResponse($data);
    }

}
