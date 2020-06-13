<?php

namespace Twake\Users\Services;

use App\App;
use Doctrine\ORM\NoResultException;

class UserProvider
{

    private $repository;

    public function __construct(App $app)
    {
        $this->repository = $app->getServices()->get("app.twake_doctrine")->getRepository("Twake\Core:User");
    }

    public function loadUserByUsername($username)
    {

        $q = $this->repository->createQueryBuilder('u')
            ->select('u')
            ->where('u.usernamecanonical = :username')
            ->setParameter('username', $username)
            ->getQuery();

        try {
            $user = $q->getSingleResult();
        } catch (NoResultException $e) {
            $message = sprintf('Unable to find active admin identified by %s', $username);
            throw new \Exception($message, 0, $e);
        }

        if ($user) {
            $user->setIdAsString();
        }

        return $user;
    }


    public function refreshUser($user)
    {

        $class = get_class($user);
        if (!$this->repository->supportsClass($user)) {
            $message = sprintf('Unsupported class type : %s', $class);
            throw new \Exception($message);
        }

        if ($user->id_as_string_for_session_handler) {
            $res = $this->repository->find($user->id_as_string_for_session_handler);
        } else {
            $res = $this->repository->find($user->getId() . "");
        }

        if (!$res || !gettype($res) || gettype($res) == "NULL") {
            error_log("refresh pass" . gettype($res) . " - " . $user->id_as_string_for_session_handler);
            error_log($user->getId());
        }

        return $res;
    }


    public function supportsClass($class)
    {
        return true;
    }

    public function find($id)
    {
        $res = parent::find($id);

        if ($res) {
            $res->setIdAsString();
        }

        return $res;
    }

    public function findOneBy(Array $arr)
    {
        $res = parent::findOneBy($arr);

        if ($res) {
            $res->setIdAsString();
        }

        return $res;
    }

}
