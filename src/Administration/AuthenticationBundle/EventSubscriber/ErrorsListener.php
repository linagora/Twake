<?php

namespace Administration\AuthenticationBundle\EventSubscriber;

use Administration\AuthenticationBundle\Entity\Errors;
use Symfony\Component\HttpKernel\Event\GetResponseForExceptionEvent;

class ErrorsListener
{

	/**
	 * ExceptionListener constructor.
	 */
	public function __construct($doctrine)
	{
		$this->doctrine = $doctrine;
	}

	public function onKernelException(GetResponseForExceptionEvent $event)
	{

        /*
        $exception = $event->getException();

        $data = Array(
            "desc" => $exception->getMessage()." | ".$exception->getCode(),
            "line" => $exception->getLine()
        );

        $file = $exception->getFile();

        $repo = $this->doctrine->getRepository("AdministrationAuthenticationBundle:Errors");
        $record = $repo->findOneBy(Array("file"=>$file));

        if(!$record) {
            $record = new Errors($file, $data);
        }else {
            $record->addData($data);
        }


        $this->doctrine->persist($record);
        $this->doctrine->flush();

        */

	}
}