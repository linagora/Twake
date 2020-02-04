<?php


namespace AdministrationApi\CounterBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class CounterController extends Controller
{

    public function getCounterAction(Request $request)
    {

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $validation = $this->get("administration.validation");
        $token = $request->request->get("token");
        $validate_token = $validation->validateAuthentication($token);

        if ($validate_token) {

            $keys = $request->request->get("key");

            $begin_date = $request->request->get("begin");

            $end_date = $request->request->get("end");

            $counter_service = $this->get("administration.counter");

            $counter_data = array();

            if (is_array($keys)) {
                foreach ($keys as $key) {
                    $counter_tab = $counter_service->getCounter($key, $begin_date, $end_date);
                    if ($counter_tab) {
                        $counter_data[$key] = $counter_tab;
                    }
                }
                if (count($counter_data) == 0) {
                    $data['errors'][] = "key_not_found";
                }
            } elseif ($keys) {
                $counter_tab = $counter_service->getCounter($keys, $begin_date, $end_date);
                if ($counter_tab) {
                    $counter_data[$keys] = $counter_tab;
                } else {
                    $data['errors'][] = "counter_not_found";
                }
            } else {
                $data['errors'][] = "key_not_found";
            }

            $data['data'] = $counter_data;

        } else {
            $data["errors"][] = "invalid_authentication_token";
        }

        return new JsonResponse($data);
    }

}