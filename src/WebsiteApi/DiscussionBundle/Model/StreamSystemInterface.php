<?php

namespace WebsiteApi\DiscussionBundle\Model;

interface StreamSystemInterface
{

	// @getStream returns a stream array object or null
	// Array(
	//   "type" : "user", "stream", "public"
	//   "object" : stream entity or other user entity
	//   "key" : websocket chamber key
	// )
	public function getStream($streamKey, $currentUser=null);

	// @isInPrivate returns true or false if is in private stream
	public function isInPrivate($streamObject, $currentUser);

	// @isAllowed returns true or false
	public function isAllowed($streamObject, $currentUser, $action="read");

	public function createStream($user, $workspaceId, $streamName, $streamDescription, $streamIsPrivate);

	public function deleteStream($user, $streamKey);

	public function editStream($user, $streamKey, $name, $description, $isPrivate, $members);

}