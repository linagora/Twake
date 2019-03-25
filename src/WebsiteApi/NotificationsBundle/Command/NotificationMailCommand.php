<?php

namespace WebsiteApi\NotificationsBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Process\Process;
use WebsiteApi\NotificationsBundle\Entity\MailNotificationQueue;
use Emojione\Client;
use Emojione\Ruleset;
use WebsiteApi\UsersBundle\Entity\User;


class NotificationMailCommand extends ContainerAwareCommand
{

    protected function configure()
    {
        $this->setName("twake:notifications_mail");
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {

        $services = $this->getApplication()->getKernel()->getContainer();
        $em = $services->get('app.twake_doctrine');

        //Get users to notify
        $users = [];

        $repo = $em->getRepository("TwakeNotificationsBundle:MailNotificationQueue");
        $entries = $repo->findBy(Array(), Array(), 1000);

        foreach ($entries as $entry) {

            $date = date("U") - $entry->getDate()->getTimestamp();

            if ($date > 60 * 30) //30 minutes
            {
                $users[] = Array("user" => $entry->getUserId(), "date" => $entry->getDate()->getTimestamp());
                $em->remove($entry);
            }

            error_log($date);

        }

        $em->flush();

        $this->sendMail($users, "messages_notifications");

    }

    /**
     * @param $users_id_count
     * @param string $template
     * @param null $app
     * @param bool $all_and_delete
     */
    protected function sendMail($users_ids, $template = "unread_notifications")
    {

        $services = $this->getApplication()->getKernel()->getContainer();
        $em = $services->get('app.twake_doctrine');

        $emojione_client = new Client(new Ruleset());

        foreach ($users_ids as $user) {

            $user_id = $user["user"];
            $date = $user["date"];

            /** @var $user User */
            $user = $em->getRepository("TwakeUsersBundle:User")->find($user_id);

            $preferences = $user->getNotificationPreference();
            $mail_preferences = isset($preferences["mail_notifications"]) ? $preferences["mail_notifications"] : 2;

            if ($mail_preferences == 0) {
                break;
            }

            if ($mail_preferences == 1 && date("U") - $date < 60 * 60 * 12) { // Everything or Only daily mails
                $new = new MailNotificationQueue($user_id);
                $time = new \DateTime();
                $time->setTimestamp($date);
                $new->setDate($time);
                break;
            }

            $count = max(0, $user->getNotificationWriteIncrement() - $user->getNotificationReadIncrement());
            $notifications = $em->getRepository("TwakeNotificationsBundle:Notification")->findBy(Array("user" => $user_id), Array(), $count);

            $data = Array(
                "username" => $user->getFullName(),
                "total_notifications" => $count,
                "notifications" => Array()
            );

            foreach ($notifications as $notification) {
                $data["notifications"][] = Array(
                    "title" => html_entity_decode($emojione_client->shortnameToUnicode($notification->getTitle()), ENT_NOQUOTES, 'UTF-8'),
                    "delay" => (new \DateTime())->diff($notification->getDate())->format("%h"),
                    "text" => html_entity_decode($emojione_client->shortnameToUnicode($notification->getText()), ENT_NOQUOTES, 'UTF-8')
                );
            }

            $services->get("app.twake_mailer")->send($user->getEmail(), $template, $data);

        }

    }

}
