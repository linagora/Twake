<?php

namespace WebsiteApi\ObjectLinksBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ObjectLinksController extends Controller
{

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
     if(array_key_exists($typeA,$tab) && array_key_exists($typeB,$tab)) {

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
