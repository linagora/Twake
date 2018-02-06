<?php

namespace WebsiteApi\CallsBundle\Model;

interface CallSystemInterface{


    /**
     * get information of call
     * @param $user
     * @param $discussionKey
     * @return mixed
     */
    public function getCallInfo($user, $discussionKey);


    /**
     * join call
     * @param $user
     * @param $discussionKey
     * @return mixed
     */
    public function joinCall($user, $discussionKey);


    /**
     *
     * @param $coucou
     * @return mixed
     */
    public function exitCalls($user);


}