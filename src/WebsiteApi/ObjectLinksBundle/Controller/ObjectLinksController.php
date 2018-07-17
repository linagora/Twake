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

     $typeA = $request->request->get("typeA");
     $typeB = $request->request->get("typeB");
     $idA = $request->request->get("idA");
     $idB = $request->request->get("idB");
     $message = $this->get("app.objectLinks")->createObjectLinkFromType($typeA, $typeB, $idA,$idB);

     if($message=="success"){

         $data['data'] = $message;
     }else{
         $data['errors'] = $message;
     }

     return new JsonResponse($data);

 }

}
