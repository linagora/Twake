<?php

namespace WebsiteApi\TagsBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ScriptsController extends Controller
{
    public function scriptsAction(Request $request, $script)
    {

	    if($script=="search"){
		    return $this->search($request);
	    }

	    if($script=="verify"){
		    return $this->verify($request);
	    }

	    return new JsonResponse(array('status'=>"error",'errors'=>Array('no_such_script')));
    }

	public function search($request){

		$q = $this->get('app.string_cleaner')->simplify($request->request->get('term'));
		$type = $request->request->get('type');

		if(strlen($q)<3) {
			$response["errors"][] = "tooshort";
		}elseif(!$this->get('app.tags')->isAllowedType($type)){
			$response["errors"][] = "badtype";
		}else{
			$response["data"] = $this->get('app.tags')->searchTags($type,$q,5);
		}


		return new JsonResponse($response);
	}

	public function verify($request){

		$q = $this->get('app.string_cleaner')->simplify($request->request->get('term'));
		$type = $request->request->get('type');

		if(strlen($q)<3){
			return new JsonResponse(array('status'=>"error",'errors'=>Array('tooshort')));
		}

		if(!$this->get('app.tags')->isAllowedType($type)){
			return new JsonResponse(array('status'=>"error",'errors'=>Array('badtype')));
		}

		if($this->get('app.tags')->isPresent($type,$q)){
			return new JsonResponse(array('status'=>"success"));
		}

		return new JsonResponse(array('status'=>"error",'errors'=>Array('notpresent')));

	}

}
