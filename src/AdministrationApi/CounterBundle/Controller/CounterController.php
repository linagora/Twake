<?php


namespace AdministrationApi\CounterBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class CounterController extends Controller
{

    public function incrementValueAction(Request $request) {

        $data = array(
            "data" => array(),
            "errors" => array()
        );

        $counter_id = $request->request->get('key');

        $counter_value = $request->request->get('value');

        $counter_service = $this->get("administration.counter");

        if (isset($counter)) {
            $counter_service->incrementValue($counter_id, $counter_value);
        } else {
            $counter_service->incrementValue($counter_id);
        }

        return new JsonResponse($data);
    }

}