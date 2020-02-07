<?php

namespace Twake\Users\Repository;

use Doctrine\ORM\NoResultException;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\Exception\UsernameNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

/**
 * UserRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class UserRepository extends \Twake\Core\Services\DoctrineAdapter\RepositoryAdapter implements UserProviderInterface
{

    public function loadUserByUsername($username)
    {

        $q = $this->createQueryBuilder('u')
            ->select('u')
            ->where('u.usernamecanonical = :username')
            ->setParameter('username', $username)
            ->getQuery();

        try {
            $user = $q->getSingleResult();
        } catch (NoResultException $e) {
            $message = sprintf('Unable to find active admin identified by %s', $username);
            throw new UsernameNotFoundException($message, 0, $e);
        }

        if ($user) {
            $user->setIdAsString();
        }

        return $user;
    }


    public function refreshUser(UserInterface $user)
    {

        $class = get_class($user);
        if (!$this->supportsClass($user)) {
            $message = sprintf('Unsupported class type : %s', $class);
            throw new UnsupportedUserException($message);
        }

        if ($user->id_as_string_for_session_handler) {
            $res = $this->find($user->id_as_string_for_session_handler);
        } else {
            $res = $this->find($user->getId() . "");
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
