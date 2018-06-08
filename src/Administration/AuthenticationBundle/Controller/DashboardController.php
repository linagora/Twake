<?php


namespace Administration\AuthenticationBundle\Controller;

use CMEN\GoogleChartsBundle\GoogleCharts\Charts\PieChart;
use CMEN\GoogleChartsBundle\GoogleCharts\Charts\AreaChart;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Matcher\RedirectableUrlMatcher;

class DashboardController extends Controller
{
	public function showAction(){

		$data = Array(
			"users" =>  Array("count"=>0, "connected"=>0),
			"workspaces" =>  Array("count"=>0, "drive_usage"=>Array()),
			"groups" => Array("count"=>0),
			"ram" => Array("percent"=>"0", "mo" => "0")
		);

		//users
		$data["users"]["connected"] = $this->get('admin.TwakeStatistics')->numberOfUserCurrentlyConnected();
		$data["users"]["count"] = $this->get('admin.TwakeStatistics')->numberOfUsers();

        //users by hour
        $_connections_usage_array = $this->get("admin.TwakeServerStats")->getUsersConnected(1000);
        $_connections_usage_array = array_reverse($_connections_usage_array);
        $connections_usage_array = [['Date', 'Connected']];
        foreach ($_connections_usage_array as $datum) {
            $connections_usage_array[] = [date("d/m/Y H:i", $datum["datesave"]), $datum["connected"]];
        }
        $connections_usage_chart = new AreaChart();
        $connections_usage_chart->getData()->setArrayToDataTable($connections_usage_array);
        $connections_usage_chart->getOptions()->setHeight(200);
        $data["users"]["users_by_hours"] = $connections_usage_chart;

        //accounts by hour
        $accounts_array = [['Date', 'Accounts']];
        foreach ($_connections_usage_array as $datum) {
            $accounts_array[] = [date("d/m/Y H:i", $datum["datesave"]), $datum["accounts"]];
        }
        $accounts_chart = new AreaChart();
        $accounts_chart->getData()->setArrayToDataTable($accounts_array);
        $accounts_chart->getOptions()->setHeight(200);
        $data["users"]["accounts_by_hours"] = $accounts_chart;


        $_connections_usage_array = $this->get("admin.TwakeServerStats")->getUsersConnected(1000, "hourly");
        $_connections_usage_array = array_reverse($_connections_usage_array);


        //messages by hour
        $array = [['Date', 'Messages']];
        $last = 0;
        foreach ($_connections_usage_array as $datum) {
            $array[] = [date("d/m/Y H:i", $datum["datesave"]), $datum["messages"]-$last];
            $last = $datum["messages"];
        }
        $messages_chart = new AreaChart();
        $messages_chart->getData()->setArrayToDataTable($array);
        $messages_chart->getOptions()->setHeight(200);
        $data["messages_by_hours"] = $messages_chart;

        //files by hour
        $array = [['Date', 'Files']];
        $last = 0;
        foreach ($_connections_usage_array as $datum) {
            $array[] = [date("d/m/Y H:i", $datum["datesave"]), $datum["files"]-$last];
            $last = $datum["files"];
        }
        $files_chart = new AreaChart();
        $files_chart->getData()->setArrayToDataTable($array);
        $files_chart->getOptions()->setHeight(200);
        $data["files_by_hours"] = $files_chart;

        //event by hour
        $array = [['Date', 'Events']];
        $last = 0;
        foreach ($_connections_usage_array as $datum) {
            $array[] = [date("d/m/Y H:i", $datum["datesave"]), $datum["event"]-$last];
            $last = $datum["event"];
        }
        $event_chart = new AreaChart();
        $event_chart->getData()->setArrayToDataTable($array);
        $event_chart->getOptions()->setHeight(200);
        $data["events_by_hours"] = $event_chart;

		//workspaces
		$data["workspaces"]["count"] = $this->get('admin.TwakeGroupManagement')->countWorkspace();
		$data["workspaces"]["drive_usage"]= $this->get('admin.TwakeStatistics')->numberOfExtensions();
		$drive_data = [['Extension', 'Number of files']];
		foreach ($data["workspaces"]["drive_usage"] as $ext){
			$drive_data[] = [$ext["extension"], intval($ext["nb"])];
		}
		$drive_usage_chart = new PieChart();
		$drive_usage_chart->getData()->setArrayToDataTable($drive_data);
        $drive_usage_chart->getOptions()->setHeight(200);
		$data["workspaces"]["drive_usage_chart"] = $drive_usage_chart;

		//groups
		$data["groups"]["count"] = $this->get('admin.TwakeGroupManagement')->countGroup();

		//ram
		$data["ram"]["percent"] = $this->get("admin.TwakeServerStats")->getRamUsage()["used"];
		$data["ram"]["mo"] = $this->get("admin.TwakeServerStats")->getTotalRam() * $data["ram"]["percent"]/100;

        $data["nbmessages"] = $this->get("admin.TwakeServerStats")->getNumberMessages();
        $data["nbevents"] = $this->get("admin.TwakeServerStats")->getNumberEvents();
        $data["nbfiles"] = $this->get("admin.TwakeServerStats")->getNumberFiles();

		return $this->render('AdministrationAuthenticationBundle:Dashboard:dashboard.html.twig', $data);
	}
}
