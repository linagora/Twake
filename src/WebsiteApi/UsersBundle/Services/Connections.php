<?php
namespace WebsiteApi\UsersBundle\Services;

use Administration\AuthenticationBundle\Entity\Errors;
use Gos\Bundle\WebSocketBundle\Event\ClientEvent;
use Gos\Bundle\WebSocketBundle\Event\ClientErrorEvent;
use Gos\Bundle\WebSocketBundle\Event\ServerEvent;
use Gos\Bundle\WebSocketBundle\Event\ClientRejectedEvent;
use Gos\Bundle\WebSocketBundle\Client\ClientManipulatorInterface;
use WebsiteApi\UsersBundle\Entity\User;

class Connections
{
	var $clientManipulator;
	var $doctrine;
	var $pusher;
	var $calls;
	var $userConnectionService;

	public function __construct(ClientManipulatorInterface $clientManipulator, $doctrine, $pusher, $calls, $userConnectionService = null){
		$this->clientManipulator = $clientManipulator;
		$this->doctrine = $doctrine;
		$this->pusher = $pusher;
		$this->calls = $calls;
		$this->userConnectionService = $userConnectionService;
	}

	public function onServerStart($event){

        return;
		$update = $this->doctrine->createQueryBuilder();
		$update->update("TwakeUsersBundle:User","u");
		$update->set("u.connections","0");
		$update->set("u.connected","0");
		$update->where("u.connections>0");
		$update->getQuery()->execute();

		//Record restart
		$data = Array(
			"desc" => "Server restarted",
			"line" => 0
		);

		$file = "gos:websockets";

        //[REMOVE_ONPREMISE]
        $repo = $this->doctrine->getRepository("AdministrationAuthenticationBundle:Errors");
		$record = $repo->findOneBy(Array("file"=>$file));

		if(!$record) {
			$record = new Errors($file, $data);
		}else {
			$record->addData($data);
		}

		$this->doctrine->persist($record);
		$this->doctrine->flush();
        //[/REMOVE_ONPREMISE]

	}

	/**
	 * Called whenever a client connects
	 *
	 * @param ClientEvent $event
	 */
	public function onClientConnect(ClientEvent $event)
	{

        return;
        $conn = $event->getConnection();
		$user = $this->clientManipulator->getClient($conn);


		if($user==null || is_string($user)){
            //$conn->close(); //Remove connexion (not connected) COMMENTING THIS LINE SEEMS TO FIX FATAL LOOP IN WEBSOCKET SERVER
			return;
		}

		//This is a real logged user, check if he's connected on an other page
		$repository = $this->doctrine->getRepository("TwakeUsersBundle:User");
		$user = $repository->find($user->getId());

		//Set connections
		$justArrived = false;
		if($user->getConnections()==0){
			$justArrived = true;
		}
		if($user->getConnections()>10){
			$conn->close(); //Remove connexion (not connected)

			$user->resetConnection();
			$this->doctrine->persist($user);
			$this->doctrine->flush();
			return;
		}
		$user->addConnection();
		$this->doctrine->persist($user);
		$this->doctrine->flush();

		if($justArrived){
            //[REMOVE_ONPREMISE]
			$this->userConnectionService->newConnection($user->getId());
            //[/REMOVE_ONPREMISE]
		}

		//Send notifications any way
		$this->pusher->push(true, 'connections/'.$user->getId());

	}

	/**
	 * Called whenever a client disconnects
	 *
	 * @param ClientEvent $event
	 */
	public function onClientDisconnect(ClientEvent $event)
	{
        return;
        $this->removeConnection($event);
	}
	public function onClientError(ClientErrorEvent $event)
    {
        return;

        $this->removeConnection($event);
	}
	public function onClientRejected(ClientRejectedEvent $event)
    {
        return;

        $this->removeConnection($event);
	}

	function removeConnection($event){
        return;

		$conn = $event->getConnection();
		$user = $this->clientManipulator->getClient($conn);

		if($user==null || is_string($user)){
			return;
		}

		//Get connexions
		$repository = $this->doctrine->getRepository("TwakeUsersBundle:User");

		$user = $repository->find($user->getId());

		//Set connections and determine user state
		$disconnected = false;

		if($user->getConnections()<=1){
			$disconnected = true;
		}

		$user->remConnection();
		$this->doctrine->persist($user);
		$this->doctrine->flush();

		//Send notifications
		if($disconnected){
			//echo $user->getUsername() . " is Disconnected" . PHP_EOL;
			//Send notification to other users
            //[REMOVE_ONPREMISE]
            $this->userConnectionService->closeConnection($user->getId());
            //[/REMOVE_ONPREMISE]
			$this->calls->exitCalls($user);
			$this->pusher->push(false, 'connections/'.$user->getId());
		}
	}
}
