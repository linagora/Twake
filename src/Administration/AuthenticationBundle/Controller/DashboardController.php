<?php


namespace Administration\AuthenticationBundle\Controller;

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

		//workspaces
		$data["workspaces"]["count"] = $this->get('admin.TwakeGroupManagement')->countWorkspace();
		$data["workspaces"]["drive_usage"]= $this->get('admin.TwakeStatistics')->numberOfExtensions();

		//groups
		$data["groups"]["count"] = $this->get('admin.TwakeGroupManagement')->countGroup();

		//ram
		$data["ram"]["percent"] = $this->get("admin.TwakeServerStats")->getRamUsage()["used"];
		$data["ram"]["mo"] = $this->get("admin.TwakeServerStats")->getTotalRam() * $data["ram"]["percent"]/100;

		return $this->render('AdministrationAuthenticationBundle:Dashboard:dashboard.html.twig', $data);
	}
}
