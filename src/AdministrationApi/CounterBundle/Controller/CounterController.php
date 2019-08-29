<?php


namespace AdministrationApi\CounterBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class CounterController extends Controller
{

    public function getCounterAction(Request $request) {

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $validation = $this->get("administration.validation");
        $token = $request->request->get("token");
        $validate_token = $validation->validateAuthentication($token);

        if ($validate_token) {

            $keys = $request->request->get("key");

            $counter_service = $this->get("administration.counter");

            $counter_data = array();

            if (is_array($keys)) {
                foreach ($keys as $key) {
                    $counter_tab = $counter_service->getCounter($key);
                    if ($counter_tab) {
                        $counter_data[$key] = $counter_tab;
                    }
                }
            } elseif ($keys) {
                $counter_tab = $counter_service->getCounter($keys);
                if ($counter_tab) {
                    $counter_data[$keys] = $counter_tab;
                }
            }

        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new JsonResponse($data);
    }

}