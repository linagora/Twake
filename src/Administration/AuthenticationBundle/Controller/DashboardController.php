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
        $connections_usage_array = [['Date', 'Connected']];
        foreach ($_connections_usage_array as $datum) {
            $connections_usage_array[] = [date("d/m/Y H:i", $datum["datesave"]), $datum["connected"]];
        }
        $connections_usage_chart = new AreaChart();
        $connections_usage_chart->getData()->setArrayToDataTable($connections_usage_array);
        $connections_usage_chart->getOptions()->setHeight(200);
        $data["users"]["users_by_hours"] = $connections_usage_chart;

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

		return $this->render('AdministrationAuthenticationBundle:Dashboard:dashboard.html.twig', $data);
	}
}
