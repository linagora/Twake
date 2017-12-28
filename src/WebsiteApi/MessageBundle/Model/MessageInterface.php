<?php

namespace WebsiteApi\MessageBundle\Model;

interface MessageInterface
{
    public function createMessage($user, $discussionType, $discussionId, $content, $parent=null);
}