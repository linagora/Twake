<?php

namespace WebsiteApi\UsersBundle\Services;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Http\Event\InteractiveLoginEvent;
use WebsiteApi\CoreBundle\Services\Translate;
use WebsiteApi\UsersBundle\Entity\Device;
use WebsiteApi\UsersBundle\Entity\Mail;
use WebsiteApi\UsersBundle\Entity\VerificationNumberMail;
use WebsiteApi\UsersBundle\Model\UserInterface;

/**
 * This service is responsible for subscribtions, unsubscribtions, request for new password
 */
class Users
{

    private $em;
    private $es;

    public function __construct($em, $es)
    {
        $this->em = $em;
        $this->es = $es;
    }

    public function search($query, $options = Array())
    {

        //TODO make a true search with elastic search
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $users = $userRepository->findBy(Array("username" => $query));

        $options = Array(
            "query" => Array()
        );

        $this->get("app.twake_elastic_search")->search($options, "users");

        $result = [];
        foreach ($users as $user) {
            $result[] = $user->getAsArray();
        }

        return $result;
    }

    public function getById($id)
    {
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->find($id);
        if ($user) {
            $this->em->persist($user);
            $this->em->flush();
            return $user->getAsArray();
        }
        return false;
    }
}
