<?php


namespace Administration\AuthenticationBundle\Controller;

use CMEN\GoogleChartsBundle\GoogleCharts\Charts\PieChart;
use CMEN\GoogleChartsBundle\GoogleCharts\Charts\AreaChart;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Matcher\RedirectableUrlMatcher;

class UserController extends Controller
{
    public function showAction(Request $request)
    {

        $id = $request->query->get('id');

        $em = $this->get("app.twake_doctrine")->getManager();
        $repository = $em->getRepository("TwakeUsersBundle:User");

        $user = $repository->find($id);

        if (!$user) {
            return new JsonResponse(Array("user not found"));
        }

        $data = Array();

        $workspaces = [];
        $private_workspace = Array();
        $ws_repository = $em->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
        foreach ($ws_repository->findBy(Array("user" => $user)) as $ws_link) {
            if (!$ws_link->getWorkspace()->getUser()) {
                $workspaces[] = $ws_link->getWorkspace();
            } else {
                $private_workspace = $ws_link->getWorkspace();
            }
        }

        $data["user"] = $user;
        $data["workspaces"] = $workspaces;
        $data["private_workspace"] = $private_workspace;

        return $this->render('AdministrationAuthenticationBundle:User:user.html.twig', $data);
    }

}
