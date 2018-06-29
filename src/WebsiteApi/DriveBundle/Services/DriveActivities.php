<?php

namespace WebsiteApi\DriveBundle\Services;

use WebsiteApi\DriveBundle\Entity\DriveActivity;
use WebsiteApi\DriveBundle\Model\DriveActivityInterface;
use WebsiteApi\DriveBundle\Repository\DriveActivityRepository;


/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 25/06/18
 * Time: 09:25
 */

/**
 * Class DriveActivity
 * @package WebsiteApi\DriveBundle\Services
 */
class DriveActivities implements DriveActivityInterface
{

    var $doctrine;
    var $notifService;

    public function __construct($doctrine, $pusher, $notifService)
    {
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;
        $this->notifService = $notifService;
    }

    public function pushActivity($pushNotif, $workspace, $user = null, $levels = null, $text = null, $type = Array())
    {
        error_log("PUSH TABLE ");
        //ajotuer dans la table DriveActivity
        if ($workspace != null) {
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace);
        }
        error_log("WORKSPACE");
        $application = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array('publicKey' => 'drive'));
        // $application = $this->getDoctrine()->getManager()->getRepository("TwakeMarketBundle:Application")->findOneBy(Array('publicKey' => 'drive'));

        error_log("APPLICATION");
        $driveActivity = new DriveActivity($application, $workspace, $user);

        error_log("driveActivity avant modif ");
        $data = Array(
            "type" => "add",
            "workspace_id" => ($workspace != null ? $workspace->getId() : null),
            "app_id" => ($application != null ? $application->getId() : null),
            "title" => "",
            "text" => $text
        );

        if ($data) {
            $driveActivity->setData($data);
        }

        if ($text) {
            $driveActivity->setText($text);
        }
        $driveActivity->setTitle("");

        error_log("driveActivity apres modif ");

        var_dump($driveActivity->getAsArray());

        $this->doctrine->persist($driveActivity);
        //$this->doctrine->flush();
        error_log("Yo apres modif ");

        $data = Array("action" => "addActiviy");
        $this->pusher->push($data, "drive/workspace/" . $workspace->getId());

        //$data = Array("action" => "add");
        //$this->pusher->push($data, "driveActivity/workspace/".$workspace->getId());

        //appel pour faire une notification
        if ($pushNotif) {
            $this->notifService->pushNotification($application, $workspace, $user, $levels, "driveActivity", $text, $type, null, true);

        }

    }

    public function readAll($application, $workspace, $user)
    {

        $driveActivityRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveActivity");

        $search = Array(
            "user" => $user
        );

        if ($application) {
            $search["application"] = $application;
        }

        if ($workspace) {
            $search["workspace"] = $workspace;
        }

        $notifs = $driveActivityRepository->findBy($search);


        foreach ($notifs as $notif) {
            $data = Array(
                "type" => "update",
                "DriveActivity" => $notif->getAsArray()
            );
            $data["DriveActivity"]["read"] = true;
            $this->pusher->push($data, "drive/workspace/" . $notif->getWorkspace()->getId());
        }

    }

    public function removeAll($application, $workspace, $user, $code = null, $force = false)
    {

        $nRepo = $this->doctrine->getRepository("TwakeDriveBundle:DriveActivity");

        $search = Array(
            "user" => $user
        );

        if ($code) {
            $search["code"] = $code;
        }

        if ($application) {
            $search["application"] = $application;
        }

        if ($workspace) {
            $search["workspace"] = $workspace;
        }

        $notifs = $nRepo->findBy($search);

        $count = count($notifs);
        for ($i = 0; $i < $count; $i++) {
            $this->doctrine->remove($notifs[$i]);
        }

        if ($count == 0) {
            return false;
        }

        if ($count > 0 || $force) {
            $this->doctrine->flush();

            $totalNotifications = $this->countAll($user);

            $data = Array(
                "action" => "remove",
                "workspace_id" => ($workspace) ? $workspace->getId() : null,
                "app_id" => ($application) ? $application->getId() : null
            );
            $this->pusher->push($data, "drive/workspace/" . $workspace->getId());

            $this->updateDeviceBadge($user, $totalNotifications);
            return true;
        }
        return true;


    }

    public function getAll($user)
    {
        $nRepo = $this->doctrine->getRepository("TwakeDriveBundle:DriveActivity");
        $acti = $nRepo->findBy(Array("user" => $user), Array("id" => "DESC"), 30); //Limit number of results

        return $acti;
    }
}
