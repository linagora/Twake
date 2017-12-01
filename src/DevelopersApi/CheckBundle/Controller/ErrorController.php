<?php

namespace DevelopersApi\CheckBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class ErrorController extends Controller
{
	public function BadRequestAction()
	{
		return new JsonResponse(Array("errors" => "0000", "description" => "Bad request"));
	}

}