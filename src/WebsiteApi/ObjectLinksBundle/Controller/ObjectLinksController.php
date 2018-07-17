<?php

namespace WebsiteApi\ObjectLinksBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ObjectLinksController extends Controller
{

    public function getLinksAction(Request $request){

        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $id = $request->request->get("id");

        $message = $this->get('app.objectLinks')->getObjectLinksById($id);

        if($message){
            $tab = Array();
            foreach ($message as $link){
                array_push($tab,$link->getAsArrayFormated());
            }
            $data["data"] = $tab;
        }else{
             $data["errors"] = "fail";
        }

        return new JsonResponse($data);
    }
    public function createLinkAction(Request $request){
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $tab = ["file","event","task"];

        $typeA = $request->request->get("typeA");
        $typeB = $request->request->get("typeB");
        $idA = $request->request->get("idA");
        $idB = $request->request->get("idB");

        if(in_array($typeA,$tab) && in_array($typeB,$tab)) {

            $message = $this->get("app.objectLinks")->createObjectLinkFromType($typeA, $typeB, $idA, $idB);

            if ($message == "success") {

                $data['data'] = $message;
            } else {
                $data['errors'] = $message;
            }
        }else{
            $data['errors'] = 'wrong data sent';
        }
        return new JsonResponse($data);

    }

}
