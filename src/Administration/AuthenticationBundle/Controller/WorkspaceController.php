<?php


namespace Administration\AuthenticationBundle\Controller;

use CMEN\GoogleChartsBundle\GoogleCharts\Charts\PieChart;
use CMEN\GoogleChartsBundle\GoogleCharts\Charts\AreaChart;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Matcher\RedirectableUrlMatcher;

class WorkspaceController extends Controller
{
    public function showAction()
    {

        $data = Array();

        return $this->render('AdministrationAuthenticationBundle:Workspace:workspace.html.twig', $data);
    }

    public function showGroupAction()
    {

        $data = Array();

        return $this->render('AdministrationAuthenticationBundle:Workspace:group.html.twig', $data);
    }

}
