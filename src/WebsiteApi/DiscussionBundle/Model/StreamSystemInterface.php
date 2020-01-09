<?php

namespace WebsiteApi\DiscussionBundle\Model;

interface StreamSystemInterface
{

    public function createStream($user, $workspaceId, $streamName, $streamDescription, $streamIsPrivate);

    public function deleteStream($user, $streamKey);

    public function editStream($user, $streamKey, $name, $description, $isPrivate, $members);

    public function mute($user, $streamId, $mute = true);

}