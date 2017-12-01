<?php


namespace WebsiteApi\UsersBundle\Services;

use WebsiteApi\MarketBundle\Entity\LinkAppOrga;
use WebsiteApi\UsersBundle\Entity\Notification;
use WebsiteApi\UsersBundle\Entity\User;
use WebsiteApi\OrganizationsBundle\Entity\Orga;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Routing\Router;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorage;
use Doctrine\ORM\EntityManager;
use WebsiteApi\UsersBundle\Services\RememberMe;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Symfony\Bundle\FrameworkBundle\Templating\EngineInterface;
use \Swift_Mailer;

/**
 * Class Notifications
 * @package WebsiteApi\UsersBundle\Services
 *
 * Gestion des notifications
 */
class Notifications
{
	var $string_cleaner;
	var $doctrine;
	var $authorizationChecker;
	var $tokenStorage;
	var $templating;
	var $mailer;
	var $pusher;

	/* Configuration */
	var $notification_mailfrom = "twake@proxima.fr";
	var $notification_mailsubject = "Notification from Twake";


	//Load other services
	function __construct(StringCleaner $string_cleaner, $doctrine, EngineInterface $templating, Swift_Mailer $mailer, TokenStorage $tokenStorage, AuthorizationCheckerInterface $authorizationChecker, $pusher){
		$this->string_cleaner = $string_cleaner;
		$this->doctrine = $doctrine;
		$this->authorizationChecker = $authorizationChecker;
		$this->tokenStorage = $tokenStorage;
		$this->templating = $templating;
		$this->mailer = $mailer;
		$this->pusher = $pusher;
	}

	/**
	 * Ajoute une notification
	 *
	 * push(
	[], //For : array d'entité ou d'id utilisateur, ou juste une entité ou un id
	Entity User / AppLink, //From : entité correspondant à l'utilisateur qui envoie ou bien l'app (via le lien app-groupe)
	"identifiant_pour_la_suppression", //Id : permet de retrouver la notification plus tard
	["mail","classic","classic-group","invisible","fast","delayed"], //Tags
	[] //Données
	);
	 * @param $users
	 * @param $from
	 * @param $id
	 * @param $tags
	 * @param $data
	 */
	public function push($users, $from, $route, $tags, $data){

		$users = $this->getUsersEntityList($users);

		$fromUser = null;
		$fromGroup = null;
		$fromApp = null;

		if ($from instanceof User) {
			$fromUser = $from;
			$fromType = "user";
		}
		else if ($from instanceof Orga) {
			$fromGroup = $from;
			$fromType = "group";

		} else if ($from == null) {
		  $fromType = "null";

    } else {
			//$from is app-group link
			$fromGroup = $from->getGroup();
			$fromApp = $from->getApplication();
			$fromType = "app";
		}

    if (isset($data["text"])){
		  if (strlen($data["text"]) > 75){
        $data["text"] = substr($data["text"],0,72)."...";
      }
    }
		foreach($users as $user) {

			$allData = Array(
				"route"=>$route,
				"tags"=>$tags,
				"fromType"=>$fromType,
				"fromUser"=>($fromUser)?$fromUser->getId():-1,
				"fromGroup"=>($fromGroup)?$fromGroup->getId():-1,
				"fromApp"=>($fromApp)?$fromApp->getId():-1,
				"data"=>$data
			);

			//En bdd
			if(in_array("classic-group",$tags) or in_array("classic",$tags) or in_array("invisible",$tags) or in_array("delayed",$tags)) {

				$notification = new Notification();

				$notification->setRoute($route);
				$notification->setUser($user);

				$notification->setIsClassic(in_array("classic",$tags));
				$notification->setIsClassicGroup(in_array("classic-group",$tags));
				$notification->setIsInvisible(in_array("invisible",$tags));
				$notification->setIsDelayed(in_array("delayed",$tags));

				$notification->setFromUser($fromUser);
				$notification->setFromGroup($fromGroup);
				$notification->setFromApp($fromApp);

				$notification->setFromType($fromType);

				$notification->setData($data);

				$this->doctrine->persist($notification);
				$this->doctrine->flush();

				$allData["data"] = $notification->getAsArray();

			}

			//Mail
			if(in_array("mail",$tags)){

				$message = \Swift_Message::newInstance()
					->setSubject($this->notification_mailsubject)
					->setFrom($this->notification_mailfrom)
					->setTo($user->getEmail())
					->setBody(
						$this->templating->render(
							'TwakeUsersBundle:Mail:notification_mail.html.twig',
							$allData
						),
						'text/html'
					)
					->addPart(
						$this->templating->render(
							'TwakeUsersBundle:Mail:notification_mail.txt.twig',
							$allData
						),
						'text/plain'
					)
				;
				$this->mailer->send($message);

			}

			//Websocket
			if(in_array("fast",$tags) or in_array("invisible",$tags) or in_array("classic",$tags) or in_array("classic-group",$tags)){
        $compactData = Array("data"=>$allData, "type"=>"notif");
				$this->pusher->push($compactData, 'notification_topic', ["id_user"=>$user->getId()]);

			}

		}

		$this->doctrine->flush();

	}

	public function sendUpdateNotif($users, $type, $data = Array()){
	    $users = $this->getUsersEntityList($users);

	    foreach($users as $user) {
			$compactData = Array("data" => $data,"type"=>$type);
		    $this->pusher->push($compactData, 'notification_topic', ["id_user"=>$user->getId()]);
	    }

	  }

	public function update($users, $from, $route, $data){

		$users = $this->getUsersEntityList($users);

		foreach($users as $user) {

			$notifications = $this->getNotificationEntity($user, $from, $route);

			foreach($notifications as $notification) {

				$notification->setData($data);

				$this->doctrine->persist($notification);

			}

		}

		$this->doctrine->flush();

	}

	public function remove($users, $from, $route){

		$users = $this->getUsersEntityList($users);

		foreach($users as $user) {

			$notifications = $this->getNotificationEntity($user, $from, $route);

			foreach($notifications as $notification) {

				$this->doctrine->remove($notification);

			}

		}

		$this->doctrine->flush();

	}

	public function read($users, $from, $route){

		$users = $this->getUsersEntityList($users);


		foreach($users as $user) {

			$notifications = $this->getNotificationEntity($user, $from, $route);

			$data = Array();
			$first = true;
			foreach($notifications as $notification) {

				if (!$notification->isDelayed() && !$notification->isClassic() && !$notification->isClassicGroup()) {

					$this->doctrine->remove($notification);

				} else {
					$notification->read(true);
					$this->doctrine->persist($notification);
				}

				if ($first){
				  $first = false;
          $data = Array(
            "id"=>$notification->getId(),
            "route"=>$notification->getRoute(),
            "isClassic"=>$notification->isClassic(),
            "isInvisible"=>$notification->isInvisible(),
            "fromGroup"=>($notification->getFromGroup()!=null?$notification->getFromGroup()->getId() : null ),
            "fromUser"=>($notification->getFromUser()!=null? $notification->getFromUser()->getId() : null),
            "fromApp"=>($notification->getFromApp()!=null?$notification->getFromApp()->getId():null),
            "fromType"=>$notification->getFromType()
          );
        }
			}

		}

		$this->sendUpdateNotif($users, "updateNotifications", $data);

		$this->doctrine->flush();

	}

	public function readAll($users){
		$users = $this->getUsersEntityList($users);
		$repo = $this->doctrine->getRepository("TwakeUsersBundle:Notification");
		foreach($users as $user) {

			$notifications = $repo->findBy(Array("user"=>$user));

			foreach($notifications as $notification) {

				if (!$notification->isDelayed() && !$notification->isClassic() && !$notification->isClassicGroup()) {

					$this->doctrine->remove($notification);

				} else {
					$notification->read(true);
					$this->doctrine->persist($notification);
				}

			}
		}

		$this->doctrine->flush();

	}

	public function readById($nid){
		$manager = $this->doctrine;
		$notif = $manager->getRepository("TwakeUsersBundle:Notification")->findOneBy(Array("id"=>$nid));

		if (!$notif->isDelayed() && !$notif->isClassic() && !$notif->isClassicGroup()) {

			$this->doctrine->remove($notif);

		} else {
			$notif->read(true);
			$this->doctrine->persist($notif);
		}

		$manager->flush();
	}

	public function get($user, $allowOld=false, $limit=20, $offset=0){


		$repo = $this->doctrine->getRepository("TwakeUsersBundle:Notification");

		$search = Array(
			"user"=>$user
		);

		if(!$allowOld){
			$search["isRead"]=false;
		} else {
      $search["isClassic"] = true;
    }

		$data = Array();
		$allNotifications = $repo->findBy($search, array('id' => 'DESC'), $limit, $offset);
		foreach($allNotifications as $n){
		  $dt = $n->getData();
      $dt["id"] = $n->getId();
      $dt["date"] = $n->getDate()->getTimestamp();
      $dt['isread'] = $n->isRead();
		  $data[] = Array(
		    "id"=>$n->getId(),
		    "route"=>$n->getRoute(),
        "isClassic"=>$n->isClassic(),
        "isInvisible"=>$n->isInvisible(),
        "fromGroup"=>($n->getFromGroup()!=null?$n->getFromGroup()->getId() : null ),
        "fromUser"=>($n->getFromUser()!=null? $n->getFromUser()->getId() : null),
        "fromApp"=>($n->getFromApp()!=null?$n->getFromApp()->getId():null),
        "fromType"=>$n->getFromType(),
        "data"=>$dt
      );

    }
		return $data;

	}

	/*
	 * Récupère une notification correctement
	 */
	private function getNotificationEntity($user, $from, $route){
		$repo = $this->doctrine->getRepository("TwakeUsersBundle:Notification");
		if($route) {
			if ($from instanceof User) {
				//$from is User
				return $repo->findBy(Array("user" => $user, "route" => $route, "fromUser" => $from));
			} elseif($from instanceof Orga){
				//$from is type group
				return $repo->findBy(Array("user" => $user, "route" => $route, "fromGroup" => $from));
			} elseif($from instanceof LinkAppOrga) {
				//$from is type app-group link
				return $repo->findBy(Array("user" => $user, "route" => $route, "fromGroup" => $from->getGroup(), "fromApp" => $from->getApplication()));
			} elseif ($from==null){
				return $repo->findBy(Array("user" => $user, "route" => $route));
			}
		}else{
			if ($from instanceof User) {
				//$from is User
				return $repo->findBy(Array("user" => $user, "fromUser" => $from));
			} elseif($from instanceof Orga){
				//$from is type group
				return $repo->findBy(Array("user" => $user, "fromGroup" => $from));
			} elseif($from instanceof LinkAppOrga) {
				//$from is type app-group link
				return $repo->findBy(Array("user" => $user, "fromGroup" => $from->getGroup(), "fromApp" => $from->getApplication()));
			} elseif ($from==null){
				return $repo->findBy(Array("user" => $user));
			}
		}
		return [];
	}

	/*
	 * Transforme $user en liste d'entité user
	 */
	private function getUsersEntityList($users){

		if(!is_array($users)){//On a pas d'array, on force l'array
			$users = Array($users);
		}else if(is_int(array_values($users)[0])){ //On a des int, on veut des entités
			$repo = $this->doctrine->getRepository("TwakeUsersBundle:User");
			$users_temp = Array();
			foreach($users as $user){
				$user_to_add = $repo->find(intval($user));
				if($user_to_add!=null){
					$users_temp[] = $user_to_add;
				}
			}
			$users = $users_temp;
		}

		return $users;

	}

}
