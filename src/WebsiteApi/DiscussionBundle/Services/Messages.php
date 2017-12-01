<?php


namespace WebsiteApi\DiscussionBundle\Services;

use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use WebsiteApi\DiscussionBundle\Entity\MessageLike;
use WebsiteApi\UsersBundle\Services\Notifications;
use WebsiteApi\UsersBundle\Entity\User;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;

/**
 * Manage contacts
 */
class Messages
{

	var $string_cleaner;
	var $doctrine;
	var $security;
	var $notifications;
	var $commandExecutorService;
	var $notificationsService;
	var $pusher;
	var $levelManager;

	function __construct(StringCleaner $string_cleaner, $doctrine, AuthorizationChecker $authorizationChecker,Notifications $notifications, $commandExecutorService, $notificationsService, $pusher, $levelManager){
		$this->string_cleaner = $string_cleaner;
		$this->doctrine = $doctrine;
		$this->security = $authorizationChecker;
		$this->notifications = $notifications;
		$this->commandExecutorService = $commandExecutorService;
		$this->notificationsService = $notificationsService;
		$this->pusher = $pusher;
		$this->levelManager = $levelManager;
	}

	/**
	 * Verify that the user is allowed to send messages in this discussion
	 */
	function isAllowed(User $user, $discussionType, $discussionId){

		//Verify user is logged in
		if ($user == null
			|| is_string($user)
			|| !($user instanceof User)
		) {

			return false;
		}

		//Cant message to himself
		if($user->getId()==$discussionId && $discussionType=='user'){
			return false;
		}


		if($discussionType=='channel'){


			//Verify that the user is in the channel
			$channelMember = $this->doctrine->getRepository("TwakeDiscussionBundle:ChannelMember");
			$channelMemberEntity = $channelMember->findOneBy(
				Array(
					"user"=>$user,
					"channel"=>$discussionId
				)
			);
			if(
				$channelMemberEntity==null
			){

				return false;
			}else{
				if(!$this->levelManager->hasRight($user, $channelMemberEntity->getChannel()->getGroup(), 'Messages:general:view')){
					return false;
				}
				return true;
			}

		}else if($discussionType=='user'){

			//Verify that this user is a friend or un colleague (share the same group)
			$reqContact = $this->doctrine
				->getRepository("TwakeUsersBundle:Contact")->createQueryBuilder('C')
				->where('(IDENTITY(C.userB) = '.$user->getId()
					.' AND '
					.'IDENTITY(C.userA) = '.intval($discussionId) . ')'
				)
				->orWhere('(IDENTITY(C.userA) = '.$user->getId()
					.' AND '
					.'IDENTITY(C.userB) = '.intval($discussionId) . ')'
				)
				->getQuery()->getResult();


			if(count($reqContact)>=1 && $reqContact[0]->getStatus()=="A"){ //Contact has been accepted, we can return ok
				return true;
			}

			//Search in user groups
			$linkOrgaUser =  $this->doctrine->getRepository("TwakeOrganizationsBundle:LinkOrgaUser")->findBy(Array("User" => $user));
			foreach($linkOrgaUser as $link){
				if($this->doctrine->getRepository("TwakeOrganizationsBundle:LinkOrgaUser")->findOneBy(Array("User"=>intval($discussionId), "Orga"=>$link->getGroup()))!=null){
					return true;
				}
			}

		}else{
			return false;
		}

		return false;

	}

	function isAllowedByKey(User $user, $discussionKey){

		if(count(explode("_", $discussionKey))==2){
			$discussionType = "user";
			$ids = explode("_", $discussionKey);
			if($ids[0] == $user->getId()){
				$discussionId = $ids[1];
			}else{
				$discussionId = $ids[0];
			}
		}else{
			$discussionType = "channel";
			$discussionId = intval($discussionKey);
		}

		return $this->isAllowed($user, $discussionType, $discussionId);
	}

  /**
   * Convertie une discussionKey en un array contenant le discussion type et le discussion ID
   * @param $discussionKey
   * @return array
   */
	function convertKey($discussionKey, $user){
	    if(count(explode("_", $discussionKey))==2){
	      $discussionType = "user";
	      $ids = explode("_", $discussionKey);
	      if($ids[0] == $user->getId()){
	        $discussionId = $ids[1];
	      }else{
	        $discussionId = $ids[0];
	      }
	    }else{
	      $discussionType = "channel";
	      $discussionId = intval($discussionKey);
	    }
	    return Array(
	      "type"=>$discussionType,
	      "id"=>$discussionId
	      );
	  }

	/**
	 * Like a message and send modifications to users
	 */
	function likeMessage($user, $discussionType, $discussionId, $messageId, $type, $topic = null)
	{

		if ($this->isAllowedByKey($user, $discussionId)) {

			$message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneById($messageId);

			if ($message != null) {

				$like = $this->doctrine->getRepository("TwakeDiscussionBundle:MessageLike")->findOneBy(Array("message" => $messageId, "user" => $user->getId()));

				$likeSummary = $message->getLikeSummary();

				if ($like != null) {

					if (isset($likeSummary[$like->getType()])) {
						$likeSummary[$like->getType()] += -1;
					}

					if ($type == "") {
						$this->doctrine->remove($like);
					} else {
						$like->setType($type);
						$this->doctrine->persist($like);

						if (!isset($likeSummary[$like->getType()])) {
							$likeSummary[$like->getType()] = 0;
						}
						$likeSummary[$like->getType()] += 1;

					}

				} else {

					if ($type != "") {

						$like = new MessageLike($user, $message, $type);
						$this->doctrine->persist($like);

						if (!isset($likeSummary[$like->getType()])) {
							$likeSummary[$like->getType()] = 0;
						}
						$likeSummary[$like->getType()] += 1;

					}

				}


				$message->setLikeSummary($likeSummary);
				$this->doctrine->persist($message);

				$this->doctrine->flush();

				$data = Array(
					'type' => 'E',
					'data' => $message->getAsArray()
				);

				if ($topic != null) {
					$topic->broadcast($data);
				} else {
					$this->pusher->push($data, "discussion_topic", Array("key" => $discussionId));
				}

				return;
			}
		}

		return;
	}

	/**
	 * Edit a message and send modifications to users
	 */
	function editMessage($user, $discussionType, $discussionId, $messageId, $content, $topic = null){

		$message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneById($messageId);

		if ($message != null && $message->getSender() == $user) {

			$message->setContent($content);
			$message->setCleanContent($this->string_cleaner->simplifyWithoutRemovingSpaces($content));
			$message->setEdited(true);
			$this->doctrine->persist($message);
			$this->doctrine->flush();

			$data = Array(
				'type' => 'E',
				'data' => $message->getAsArray()
			);

			if ($topic != null) {
				$topic->broadcast($data);
			} else {
				$this->pusher->push($data, "discussion_topic", Array("key" => $discussionId));
			}

			return;
		}

		return;
	}

	/**
	 * Pin a message and send modifications to users
	 */
	function pinMessage($user, $discussionType, $discussionId, $messageId, $pinned, $topic = null){

		$message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneById($messageId);

		$canPin = false;
		if ($discussionType == "channel") {
			$channel = $message->getReceiver();
			$canPin = $this->levelManager->hasRight($user, $channel->getGroup(), 'Messages:general:pin');
		}
		else {
			$canPin = $user == $message->getSender() || $user == $message->getReceiver();
		}


		if ($canPin) {

			$message->setPinned($pinned);
			$this->doctrine->persist($message);
			$this->doctrine->flush();

			$data = Array(
				'type' => 'P',
				'data' => Array(
					'id' => $message->getId(),
					'pinned' => $pinned
				)
			);

			if ($topic != null) {
				$topic->broadcast($data);
			} else {
				$this->pusher->push($data, "discussion_topic",Array("key"=>$discussionId));
			}
		}
	}


	/**
	 * Delete a message using message id (verify that it's our message)
	*/
	function deleteMessage($user, $discussionType, $discussionId, $messageId, $topic = null){


		$message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneById($messageId);

		if ($message != null && $message->getSender() == $user) {

			$data = Array(
				'type' => 'D',
				'data' => Array(
					"id" => $messageId
				)
			);

			if ($topic != null) {
            $topic->broadcast($data);
        } else {
		    $this->pusher->push($data, "discussion_topic",Array("key"=>$discussionId));
        }

			$this->doctrine->remove($message);
			$this->doctrine->flush();

		}

	}


	/**
	 * Get lasts messages and info about users of the discussion
	 */
	function getInit($user, $discussionType, $discussionId, $topic = null){


		//1. Get messages

		$messages = $this->doctrine->createQueryBuilder()
			->select('m')
			->from('TwakeDiscussionBundle:Message', 'm');

		if($discussionType=='user'){
			$messages = $messages->where('(m.sender = :currentUser AND m.userReceiver = :otherUser)')
				->orWhere('(m.sender = :otherUser AND m.userReceiver = :currentUser)')
				->setParameter('currentUser', $user->getId())
				->setParameter('otherUser', intval($discussionId));
			//Read my notifications
			$this->notificationsService->read(
				$user,
				$this->doctrine->getRepository("TwakeUsersBundle:User")->find($discussionId),
				"private_message"
			);
		}elseif($discussionType=='channel'){
			//channelReceiver
			$messages = $messages->where('m.channelReceiver = :currentChannel')
				->setParameter('currentChannel', intval($discussionId));

			//4. Read notifications
			$this->notificationsService->read(
				$user,
				null,
				"group_message_ch" . $discussionId
			);
		}else{
			return;
		}


		$messages = $messages->orderBy('m.id', 'DESC')
			->setMaxResults(30)
			->getQuery()
			->getResult();

		$resultMessages = [];
		foreach ($messages as $message) {
			$resultMessages[] = $message->getAsArray();
		}


		//2. Send result

		$data = Array(
			'type' => 'I',
			'data' => Array(
				'messages' => $resultMessages
			)
		);

		if ($topic != null) {
            $topic->broadcast($data);
        } else {
		    $this->pusher->push($data, "discussion_topic",Array("key"=>$discussionId));
        }

	}


  /**
   * Get older messages in a discussion
   */
  function getOlder($user, $discussionKey, $oldest){

    //1. Verify identity
    if (!$this->isAllowedByKey($user,$discussionKey)){
      return new JsonResponse(Array(
        "errors" => 'notallowed',
        "data" => Array()
      ));
    }

    //2. Get messages
    $arr = $this->convertKey($discussionKey, $user);
    $discussionType = $arr['type'];
    $discussionId = $arr['id'];
    $messages = $this->doctrine->createQueryBuilder()
      ->select('m')
      ->from('TwakeDiscussionBundle:Message', 'm');

    if($discussionType=='user'){
      $messages = $messages->where('(m.sender = :currentUser AND m.userReceiver = :otherUser AND m.id < :oldest)')
        ->orWhere('(m.sender = :otherUser AND m.userReceiver = :currentUser AND m.id < :oldest)')
        ->setParameter('currentUser', $user->getId())
        ->setParameter('otherUser', intval($discussionId))
        ->setParameter('oldest', intval($oldest));

    }elseif($discussionType=='channel'){
      //channelReceiver
      $messages = $messages->where('m.channelReceiver = :currentChannel AND m.id < :oldest')
        ->setParameter('currentChannel', intval($discussionId))
        ->setParameter('oldest', intval($oldest));
    }else{
      return;
    }


    $messages = $messages->orderBy('m.id', 'DESC')
      ->setMaxResults(20)
      ->getQuery()
      ->getResult();

    $resultMessages = [];
    foreach ($messages as $message) {
      $resultMessages[] = $message->getAsArray();
    }

    //3. Send result

    $data = Array(
      'errors' => [],
      'data' => Array(
        'messages' => $resultMessages,
      )
    );

    return new JsonResponse($data);
  }

	/**
	 * Send a message to a discussion
	 */
	function sendMessage($user, $discussionType, $discussionId, $content, $topic = null){

		//First datas

		$channel = null;
		$linkMemberRepo = null;
		$messagerieAppLink = null;
		$receiverUser = null;
		if($discussionType=='channel'){
			$channel = $this->doctrine->getRepository("TwakeDiscussionBundle:Channel")->find($discussionId);

			$linkMemberRepo = $this->doctrine->getRepository("TwakeDiscussionBundle:ChannelMember");

			if(!$this->levelManager->hasRight($user, $channel->getGroup(), 'Messages:general:post')){
				return;
			}

			//messagerieAppLink :
			$linksAppLink = $this->doctrine->getRepository("TwakeMarketBundle:LinkAppOrga")->findBy(Array("organization"=>$channel->getGroup()));
			foreach($linksAppLink as $link){
				if($link->getApplication()->getName()=="Messages"){
					$messagerieAppLink = $link;
				}
			}

			//Read my notifications
			$this->notificationsService->read(
				$user,
				$messagerieAppLink,
				"group_message_ch" . $channel->getId()
			);

		}else if($discussionType=='user'){
			$receiverUser = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($discussionId);
		}else{
			return;
		}


		// Parse content to find commands
		$command_result = Array();
		if (strlen($content) > 0 && $content[0] == '\\') {
			$command_result = $this->commandExecutorService->execute($content);
			if(isset($command_result["CONTENT"])) {
				$content = $command_result["CONTENT"];
			}
		}

		//Send a notification if allowed by the parser
		if(!(isset($command_result["NONOTIF"]) && $command_result["NONOTIF"])) {

			$receivers = $this->getMembers($user, $discussionType, $discussionId);

			$quoted = Array();
			preg_match_all("/@([a-z0-9_-]*)/i", $content, $output_array);
			$repoUser = $this->doctrine->getRepository("TwakeUsersBundle:User");
			if ($channel != null && isset($output_array[1])) {
				foreach ($output_array[1] as $username) {
					$quoteduser = $repoUser->findOneBy(Array("username_clean" => $username));
					if ($quoteduser != null) {
						$quoted[] = $quoteduser->getId();

						$this->notificationsService->push(
							$quoteduser,
							$messagerieAppLink,
							"group_message_ch" . $channel->getId(),
							["fast"],
							Array(
								"title" => $channel->getGroup()->getName() . " - " . $user->getUsername() . " vous a cité dans un message",
								"text" => htmlentities($content),
								"url" => "group/" . $channel->getGroup()->getId() . "/messages/channel/" . $channel->getId(),
								"img" => $user->getUrlProfileImage()
							)
						);

					}
				}
			}


			for ($i = count($receivers) - 1; $i >= 0; $i--) {
				if ($receivers[$i] == $user) {
					unset($receivers[$i]);
				}else {
					if($channel!=null) {
						if ($linkMemberRepo->findOneBy(
								Array("user" => $receivers[$i],
									"channel" => $channel,
									"mute" => true))
							!= null
						) {
							unset($receivers[$i]);
						}
					}
				}
			}

			if (count($receivers) > 0) {

				if($discussionType=='channel') {
					$this->notificationsService->push(
						$receivers,
						$messagerieAppLink,
						"group_message_ch" . $channel->getId(),
						["invisible", "fast"],
						Array(
							"title" => $channel->getGroup()->getName() . " - Nouveau message de " . $user->getUsername(),
							"text" => htmlentities($content),
							"url" => "group/" . $channel->getGroup()->getId() . "/messages/channel/" . $channel->getId(),
							"img" => $user->getUrlProfileImage()
						)
					);
				}else if($discussionType=='user'){
					$this->notificationsService->push(
						$receiverUser,
						$user,
						"private_message",
						["invisible", "fast"],
						Array(
							"title" => "Nouveau message de " . $user->getUsername(),
							"text" => htmlentities($content),
							"url" => "messages/" . $user->getUsernameClean(),
							"img" => $user->getUrlProfileImage()
						)
					);
				}

			}

		}

		//Create the message, one of $receiverUser and $channel will be null
		$message = new Message($user, $receiverUser, $channel, $content,$this->string_cleaner->simplifyWithoutRemovingSpaces($content));

		if ($receiverUser != null) {

			// Mise à jour de la date de dernier message entre deux contacts
			$contact = $this->doctrine->getRepository("TwakeUsersBundle:Contact")->findOneBy(Array("userA" => $user, "userB" => $receiverUser));
			if ($contact == null) {
				$contact = $this->doctrine->getRepository("TwakeUsersBundle:Contact")->findOneBy(Array("userB" => $user, "userA" => $receiverUser));
			}
			if($contact!=null){
				$contact->updateLastMessageDate();
				$this->doctrine->persist($contact);
			}
			$this->doctrine->flush();
		}


		// Sauvegarde du message et envoi au channel
		if(!(isset($command_result["NOSAVE"]) && $command_result["NOSAVE"])) {
				$this->doctrine->persist($message);
				$this->doctrine->flush();
		}


		$data = Array(
			'type' => 'M',
			'data' => $message->getAsArray()
		);

		if ($topic != null) {
            $topic->broadcast($data);
        } else {
		    $this->pusher->push($data, "discussion_topic",Array("key"=>$discussionId));
        }


	}

	function sendMessageUpload($user, $discussionType, $discussionId, $idFile, $fileIsInDrive, $topic = null){
		$channel = null;
		$linkMemberRepo = null;
		$receiverUser = null;
		if($discussionType=='channel'){
			$channel = $this->doctrine->getRepository("TwakeDiscussionBundle:Channel")->find($discussionId);
			$linkMemberRepo = $this->doctrine->getRepository("TwakeDiscussionBundle:ChannelMember");
			if(!$this->levelManager->hasRight($user, $channel->getGroup(), 'Messages:general:post')){
				return;
			}
		}else if($discussionType=='user'){
			$receiverUser = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($discussionId);
		}else{
			return;
		}
		//Send a notification if allowed by the parser
		$receivers = $this->getMembers($user, $discussionType, $discussionId);
		$quoted = Array();
		$repoUser = $this->doctrine->getRepository("TwakeUsersBundle:User");

		for ($i = count($receivers) - 1; $i >= 0; $i--) {
			if ($receivers[$i] == $user) {
				unset($receivers[$i]);
			}else {
				if($channel!=null) {
					if ($linkMemberRepo->findOneBy(
							Array("user" => $receivers[$i],
								"channel" => $channel,
								"mute" => true))
						!= null
					) {
						unset($receivers[$i]);
					}
				}
			}
		}
		if (count($receivers) > 0) {
			if($discussionType=='channel') {
				//Read my notifications
				$this->notificationsService->read(
					$user,
					null,
					"group_message_ch" . $channel->getId()
				);
				$this->notificationsService->push(
					$receivers,
					$channel->getGroup(),
					"group_message_ch" . $channel->getId(),
					["invisible"],
					Array(
						"title" => $channel->getGroup()->getName() . " - Nouveau message de " . $user->getUsername(),
						"text" => "Un fichier a été ajouté",
						"url" => "group/" . $channel->getGroup()->getId() . "/messages/channel/" . $channel->getId(),
						"img" => $user->getUrlProfileImage()
					)
				);
			}else if($discussionType=='user'){
				//Read my notifications
				$this->notificationsService->read(
					$user,
					$receiverUser,
					"private_message"
				);
				$this->notificationsService->push(
					$receiverUser,
					$user,
					"private_message",
					["invisible", "fast"],
					Array(
						"title" => "Nouveau message de " . $user->getUsername(),
						"text" => "Un fichier a été ajouté",
						"url" => "messages/" . $user->getUsernameClean(),
						"img" => $user->getUrlProfileImage()
					)
				);
			}

		}

		//Create the message, one of $receiverUser and $channel will be null
		$driveFile = $fileIsInDrive ? $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->find($idFile) : null;
		$tempFile = !$fileIsInDrive ? $this->doctrine->getRepository("TwakeUploadBundle:File")->find($idFile) : null;


		$content = "";
		$message = new Message($user, $receiverUser, $channel, $content, $this->string_cleaner->simplifyWithoutRemovingSpaces($content));
		$message->setDriveFile($driveFile);
		$message->setTempFile($tempFile);
		if ($receiverUser != null) {
			// Mise à jour de la date de dernier message entre deux contacts
			$contact = $this->doctrine->getRepository("TwakeUsersBundle:Contact")->findOneBy(Array("userA" => $user, "userB" => $receiverUser));
			if ($contact == null) {
				$contact = $this->doctrine->getRepository("TwakeUsersBundle:Contact")->findOneBy(Array("userB" => $user, "userA" => $receiverUser));
			}

			if($contact != null){
				$contact->updateLastMessageDate();
				$this->doctrine->persist($contact);
			}
			$this->doctrine->flush();
		}


		// Sauvegarde du message et envoi au channel
		if(!(isset($command_result["NOSAVE"]) && $command_result["NOSAVE"])) {
				$this->doctrine->persist($message);
				$this->doctrine->flush();
		}



		$data = Array(
			'type' => 'M',
			'data' => $message->getAsArray()
		);

		if ($topic != null) {
            $topic->broadcast($data);
        } else {
		    $this->pusher->push($data, "discussion_topic",Array("key"=>$discussionId));
        }


	}

	function removeFileFromDrive($fileId) {

		$messages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("driveFile" => $fileId));

		foreach ($messages as $message) {
			$message->setDriveFile(null);
			$message->setContent("~~Fichier supprimé~~");
			$message->setCleanContent("~~Fichier supprimé~~");
			$this->doctrine->persist($message);
		}

		$this->doctrine->flush();
	}


	/**
	 * Get a discussion members
	 */
	function getMembers($user, $discussionType, $discussionId){
		if($discussionType=='user') {
			$other = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($discussionId);
			if($other==null){
				return; //no such user, shouln't append
			}
			$members = Array($user, $other);
		}elseif($discussionType=='channel'){
			$channel = $this->doctrine->getRepository("TwakeDiscussionBundle:Channel")->find($discussionId);
			if($channel==null){
				return; //no such channel, shouln't append
			}
			$members = $channel->getMembers();
		}else{
			return;
		}
		return $members;
	}

	function enterCall($user, $discussionKey)
	{
		if ($this->isAllowedByKey($user, $discussionKey)) {


		}
	}

}
