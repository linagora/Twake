<?php
namespace WebsiteApi\UsersBundle\Services;

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

	public function __construct(ClientManipulatorInterface $clientManipulator, $doctrine, $pusher, $calls){
		$this->clientManipulator = $clientManipulator;
		$this->doctrine = $doctrine;
		$this->pusher = $pusher;
		$this->calls = $calls;
	}

	public function onServerStart($event){
		$update = $this->doctrine->createQueryBuilder();
		$update->update("TwakeUsersBundle:User","u");
		$update->set("u.connections","0");
		$update->set("u.connected","0");
		$update->where("u.connections>0");
		$update->getQuery()->execute();
	}

	/**
	 * Called whenever a client connects
	 *
	 * @param ClientEvent $event
	 */
	public function onClientConnect(ClientEvent $event)
	{

		$conn = $event->getConnection();
		$user = $this->clientManipulator->getClient($conn);
		if($user==null || is_string($user)){
			return;
		}

		//This is a real logged user, check if he's connected on an other page

		//Get connexions
		$repository = $this->doctrine->getRepository("TwakeUsersBundle:User");
		$user = $repository->find($user->getId());

		//Set connections
		$justArrived = false;
		if($user->getConnections()==0){
			$justArrived = true;
		}
		$user->addConnection();
		$this->doctrine->persist($user);
		$this->doctrine->flush();

		/*if($justArrived){
			echo $user->getUsername() . " just connected" . PHP_EOL;
		}*/

		//Send notifications any way
		$this->pusher->push(true, 'connections_topic', ["id_user"=>$user->getId()]);

	}

	/**
	 * Called whenever a client disconnects
	 *
	 * @param ClientEvent $event
	 */
	public function onClientDisconnect(ClientEvent $event)
	{
		$this->removeConnection($event);
	}
	public function onClientError(ClientErrorEvent $event)
	{
		$this->removeConnection($event);
	}
	public function onClientRejected(ClientRejectedEvent $event)
	{
		$this->removeConnection($event);
	}

	function removeConnection($event){

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
			$this->calls->exitCalls($user);
			$this->pusher->push(false, 'connections_topic', ["id_user"=>$user->getId()]);
		}
	}
}
