<?php

namespace WebsiteApi\UsersBundle\Model;


interface ContactsInterface
{

    // @ask ask a contact to become a contact
    public function ask($current_user, $user);

    // @searchByUsername search user by username
    public function searchByUsername($username);

    // @remove remove a contact
    public function remove($current_user, $user);

    // @accept accept a contact request
    public function accept($current_user, $user);

    // @get return state with an user
    public function get($current_user, $user);

    // @getAll return all contacts
    public function getAll($current_user);

    // @getAllRequests return all contacts requests (unaccepted)
    public function getAllRequests($current_user);

    // @getAllRequestsFromMe return all contacts requested by the current user (unaccepted)
    public function getAllRequestsFromMe($current_user);

}