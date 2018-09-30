<?php


namespace Administration\AuthenticationBundle\Services;

use FOS\UserBundle\Model\UserInterface;
use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorage;
use Administration\AuthenticationBundle\Entity\UserTrackedSessions;

class AdministrationUserTracking
{

    public function __construct($doctrine, TokenStorage $oSecurityContext)
    {
        $this->doctrine = $doctrine;
        $this->oSecurityContext = $oSecurityContext;
    }

    public function onKernelResponse(FilterResponseEvent $event)
    {

        if ($event->getRequest()->getMethod() != "POST") {
            return;
        }
        $url = $event->getRequest()->getRequestUri();

        if ($url == "/ajax/users/alive") {
            return;
        }

        $user = $this->oSecurityContext->getToken()->getUser();

        if ($user && is_object($user) && $user instanceof UserInterface) {

            $session = $this->doctrine->getRepository("AdministrationAuthenticationBundle:UserTrackedSessions")->findBy(Array("user" => $user), Array("id" => "desc"), 1);

            if (count($session) == 0) {
                $session = new UserTrackedSessions($user, Array());
            } else {
                $session = $session[0];

                if (date("U") - $session->getDate()->getTimestamp() > 60 * 30) { //30 minutes innactivity
                    $session = new UserTrackedSessions($user, Array());
                }
            }

            $session->addData(Array(
                "time" => date("U"),
                "url" => $url
            ));

            $this->doctrine->persist($session);
            $this->doctrine->flush();

        }

    }

}
