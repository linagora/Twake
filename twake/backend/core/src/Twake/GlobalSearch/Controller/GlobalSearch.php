<?php


namespace Twake\GlobalSearch\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class GlobalSearch extends BaseController
{

    public function QuickSearch(Request $request)
    {

        $current_user = $this->getUser();
        $words = $identifier = $request->request->get("words");
        $group_id = $request->request->get("group_id");
        $workspace_id = $request->request->get("workspace_id");
        $current_user_id = $current_user->getId();

        $globalresult = $this->get('globalsearch.quicksearch')->QuickSearch($current_user_id, $words, $group_id, $workspace_id);

        $this->get("administration.counter")->incrementCounter("total_quicksearch", 1);

        $data = Array("data" => $globalresult);
        return new Response($data);

    }

    public function AdvancedBloc(Request $request)
    {

        $scroll_id = $request->request->get("scroll_id");
        $repository = "Twake\GlobalSearch:Bloc";

        $options = $request->request->get("options");
        $channels = $options["channel_id"] ?: $request->request->get("channel_id");

        if (isset($scroll_id) && isset($repository)) {
            $options["scroll_id"] = $scroll_id;
        }

        $current_user = $this->getUser();
        $current_user_id = $current_user->getId();

        $options["words"] = $options["words"] ? $options["words"] : $request->request->get("words");

        $globalresult = $this->get('globalsearch.advancedbloc')->AdvancedBloc($current_user_id, $options, $channels);

        $this->get("administration.counter")->incrementCounter("total_search", 1);

        $data = Array("data" => $globalresult);
        return new Response($data);
    }

    public function AdvancedFile(Request $request)
    {

        $scroll_id = $request->request->get("scroll_id");
        $repository = "Twake\GlobalSearch:Bloc";


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
        return new Response($data);
    }

    public function AdvancedTask(Request $request)
    {

        $scroll_id = $request->request->get("scroll_id");
        $repository = "Twake\Tasks:Task";


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
        return new Response($data);
    }

    public function AdvancedEvent(Request $request)
    {

        $scroll_id = $request->request->get("scroll_id");
        $repository = "Twake\Calendar:Event";

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
        return new Response($data);
    }

}
