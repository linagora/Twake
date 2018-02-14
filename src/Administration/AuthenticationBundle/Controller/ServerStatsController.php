<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 14/02/18
 * Time: 10:39
 */

namespace Administration\AuthenticationBundle\Controller;

namespace Administration\AuthenticationBundle\Controller;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Matcher\RedirectableUrlMatcher;

class ServerStatsController extends Controller
{

    public function saveCpuUsageAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $data["data"] = $this->get('admin.TwakeServerStats')->saveCpuUsage();

        return new JsonResponse($data);
    }
}