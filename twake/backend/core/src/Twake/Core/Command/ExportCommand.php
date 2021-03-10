<?php

namespace Twake\Core\Command;

use Common\Commands\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Twake\Discussion\Entity\Channel;
use Twake\Market\Entity\LinkAppWorkspace;
use Twake\Workspaces\Entity\Level;

class ExportCommand extends ContainerAwareCommand
{
    var $leveladmin;
    var $output;
    var $force;
    var $twake;

    var $newApps = Array('all' => Array(), 'notall' => Array());

    protected function configure()
    {
        $this
            ->setName("twake:export_group")
            ->setDescription("Command to export a group from Twake")
            ->addArgument('name', InputArgument::REQUIRED, 'What group do you want to export?');
    }

    protected function execute()
    {


        $services = $this->getApp()->getServices();
        $doctrine = $this->getApp()->getServices()->get('doctrine');
        $manager = $doctrine->getManager();
        $group_name = $input->getArgument('name');
        $export_user = true;

// =================================================================================================================================================
// =================================================================================================================================================

        //PARTIE CONCERNANT LE GROUP
        $upper_path = getcwd();

        $group = $manager->getRepository("Twake\Workspaces:Group")->findOneBy(Array("name" => $group_name));
        $group_id = $group->getId();

        //ON CREER LES DIFFERENTS DOSSIER A LA RACINE DU DOSSIER D EXPORTATION
        mkdir("Export_Folder");
        chdir("Export_Folder");
        mkdir($group_id . "");
        chdir($group_id . "");
        chmod(getcwd(), 0777);
        mkdir("workspaces");
        $workspaces = $group->getWorkspaces();

        //ON RECUPERE LES DONNEES DU GROUPE
        $group_admin = $group->getManagers();

        $group_members_file = "group_members.json";
        $handle_group_members = fopen($group_members_file, 'w') or die('Cannot open file:  ' . $group_members_file);
        $group_members = Array();
        foreach ($group_admin as $ga) {
            $group_members[] = Array(
                "user_id" => $ga->getUser()->getId(),
                "level" => $ga->getLevel(),
                "externe" => $ga->getExterne()
            );
        }
        fwrite($handle_group_members, json_encode($group_members, JSON_PRETTY_PRINT));
        fclose($handle_group_members);
        $url = $group->getLogo();
        $group = $group->getAsArray();
        if ($group["logo"] != "") {
            if (strpos($group["logo"], "://")) {
                $group["logo"];
            } else {
                $path = $upper_path . $group["logo"];
            }
            $type = pathinfo($path, PATHINFO_EXTENSION);
            $data = file_get_contents($path);

            $logo64 = Array(
                "logo_type" => $type,
                "base64_data" => base64_encode($data),
                "url" => $url
            );
        } else {
            $logo64 = "";
        }

        $data = Array(
            "name" => $group["unique_name"],
            "display_name" => $group["name"],
            "logo" => json_encode($logo64, JSON_PRETTY_PRINT)
        );

        //ON MET LES INFO DU GROUP DANS LE FICHIER GROUP.JSON
        $group_file = "group.json";
        $handle_group_file = fopen($group_file, 'w') or die('Cannot open file:  ' . $group_file);
        fwrite($handle_group_file, json_encode($data, JSON_PRETTY_PRINT));
        fclose($handle_group_file);

// =================================================================================================================================================
// =================================================================================================================================================

        //on regarde les user qu'on va devoir creer
        if ($export_user) {
            mkdir("users");
            chdir("users");
            foreach ($group_admin as $ga) {
                if (!$ga->getUser()->getIsRobot()) {
                    $user = $ga->getUser();
                    $url = $user->getThumbnail()->getName();
                    $user_array = $user->getAsArray();
                    //si le membre du workspace n'est pas référencé comme user on doit le créer
                    $path = "";
                    $data = "";
                    $type = "";
                    if ($user_array["thumbnail"] != "") {
                        if (strpos($user_array["thumbnail"], "://")) {
                            $path = $user_array["thumbnail"];
                        } else {
                            $path = $upper_path . $user_array["thumbnail"];
                        }
                        $type = pathinfo($path, PATHINFO_EXTENSION);
                        $data = file_get_contents($path);

                        $logo64 = Array(
                            "logo_type" => $type,
                            "base64_data" => base64_encode($data),
                            "url" => $url
                        );
                    } else {
                        $logo64 = "";
                    }

                    $mails = $manager->getRepository("Twake\Users:Mail")->findBy(Array("user_id" => $user_array["id"]));
                    $secondarymail = Array();
                    foreach ($mails as $mail) {
                        $secondarymail[] = $mail->getMail();
                    }
                    if (($key = array_search($user->getemailCanonical(), $secondarymail)) !== false) {
                        unset($secondarymail[$key]);
                    }

                    $users = Array(
                        "firstname" => $user_array["firstname"],
                        "lastname" => $user_array["lastname"],
                        "language" => $user_array["language"],
                        "username" => $user_array["username"],
                        "emailcanonical" => $user->getemailCanonical(),
                        "logo" => json_encode($logo64, JSON_PRETTY_PRINT),
                        "password" => $user->getPassword(),
                        "salt" => $user->getSalt(),
                        "secondary_email" => $secondarymail,
                    );
                    $user_file = "user_" . $user_array["id"] . ".json";
                    $handle_user = fopen($user_file, 'w') or die('Cannot open file:  ' . $user_file);
                    fwrite($handle_user, json_encode($users, JSON_PRETTY_PRINT));
                    fclose($handle_user);
                }
            }
            chdir("..");
        }

// =================================================================================================================================================
// =================================================================================================================================================


        chdir("workspaces");
        foreach ($workspaces as $wp) {
            //ON CREE LE DOSSIER POUR LE WORKSPACE EN QUESTION ET ON MET LES DONNES DANS UN FICHIER WORKSPACE.JSON
            mkdir("ws_" . $wp->getId() . "");
            $workspace_file = "workspace.json";
            $handle_workspace_file = fopen($workspace_file, 'w') or die('Cannot open file:  ' . $workspace_file);
            $workspaces_user = $wp->getMembers();
            $url = $wp->getLogo()->getName();
            $wp = $wp->getAsArray();
            $path = "";
            $data = "";
            $type = "";
            if ($wp["logo"] != "") {
                if (strpos($wp["logo"], "://")) {
                    $path = $wp["logo"];
                } else {
                    $path = $upper_path . $wp["logo"];
                }
                $type = pathinfo($path, PATHINFO_EXTENSION);
                $data = file_get_contents($path);
                $logo64 = Array(
                    "logo_type" => $type,
                    "base64_data" => base64_encode($data),
                    "url" => $url
                );
            } else {
                $logo64 = "";
            }

            $data_ws = Array(
                "name" => $wp["name"],
                "uniquename" => $wp["uniqueName"],
                "color" => $wp["color"],
                "logo" => json_encode($logo64, JSON_PRETTY_PRINT)
            );
            fwrite($handle_workspace_file, json_encode($data_ws, JSON_PRETTY_PRINT));
            fclose($handle_workspace_file);
            rename('workspace.json', "ws_" . $wp["id"] . "" . DIRECTORY_SEPARATOR . "workspace.json");

// =================================================================================================================================================
// =================================================================================================================================================

            //PARTIE SUR LES MEMBRES D UN WORKSPACE DANS LE FICHIER MEMBERS.JSON
            $members = Array();
            foreach ($workspaces_user as $wp_user) {
                //on cree la liste des membres du workspace
                if (!$wp_user->getUser($this->doctrine)->getIsRobot()) {
                    $members[] = Array(
                        "user_id" => $wp_user->getUser($this->doctrine)->getId(),
                        "level" => $wp_user->getLevelId(),
                        "externe" => $wp_user->getExterne()
                    );
                }
            }

            //ON ECRIT LES MEMBRES DU WORKSPACE DANS LE FICHIER ET ON DEPLACE LE FICHIER
            $workspace_members_file = "members.json";
            $handle_workspace_members = fopen($workspace_members_file, 'w') or die('Cannot open file:  ' . $workspace_members_file);
            fwrite($handle_workspace_members, json_encode($members, JSON_PRETTY_PRINT));
            fclose($handle_workspace_members);
            rename('members.json', "ws_" . $wp["id"] . "" . DIRECTORY_SEPARATOR . "members.json");

// =================================================================================================================================================
// =================================================================================================================================================

            //PARTIE SUR LES CHANNELS ET LES MESSAGES D UN WORKSPACE DANS LES SOUS DOSSIER CHANNEL ET MESSAGE
            $channels = $$manager->getRepository("Twake\Channels:Channel")->findBy(Array("direct" => false, "original_workspace_id" => $wp["id"]));
            chdir("ws_" . $wp["id"] . "");
            mkdir("channels");
            chdir("channels");
            foreach ($channels as $channel) {
                //ON RECUPERE LES INFORMATIONS DU CHANNEL
                $channel = $channel->getAsArray();
                if ($channel["name"] != "") {
                    if (!file_exists($channel["name"])) {
                        mkdir(str_replace("/", "_", $channel["name"]));
                        chdir(str_replace("/", "_", $channel["name"]));
                        $channel_file = "channel.json";
                        $handle_channel_file = fopen($channel_file, 'w') or die('Cannot open file:  ' . $channel_file);

                        $data_ch = Array(
                            "name" => $channel["name"],
                            "description" => $channel["description"],
                            "members" => $channel["members"],
                            "ext_members" => $channel["ext_members"],
                        );
                        fwrite($handle_channel_file, json_encode($data_ch, JSON_PRETTY_PRINT));
                        fclose($handle_channel_file);

                        //ON RECUPERE LES MESSAGES DU CHANNEL
                        $messages_tmp = $this->doctrine->getRepository("Twake\Discussion:Message")->findBy(Array("channel_id" => $channel["id"]));
                        $messages = Array();
                        foreach ($messages_tmp as $message) {

                            //ON RECUPERE LES INFORMATIONS DU MESSAGE
                            $message = $message->getAsArray();

                            $message_file = "messages.json";
                            $handle_message_file = fopen($message_file, 'w') or die('Cannot open file:  ' . $message_file);
                            $messages[] = Array(
                                "parent_message_id" => $message["parent_message_id"],
                                "reactions" => $message["reactions"],
                                "content" => $message["content"],
                                "hidden_data" => $message["hidden_data"],
                                "message_type" => $message["message_type"],
                                "sender" => $message["sender"],
                                "creation_date" => $message["creation_date"]
                            );
                        }
                        fwrite($handle_message_file, json_encode($messages, JSON_PRETTY_PRINT));
                        fclose($handle_message_file);
                        chdir(".."); //on remonte dans channels
                    }
                }
            }


// =================================================================================================================================================
// =================================================================================================================================================

            //PARTIE SUR LES DRIVE FILES ET LES CALENDARS
            chdir("..");
            mkdir("calendars");
            chdir("calendars");
            $calendars = $manager->getRepository("Twake\Calendar:Calendar")->findBy(Array("workspace_id" => $wp["id"]));
            $calendar = Array();
            foreach ($calendars as $c) {
                $c = $c->getAsArray();
                $calendar_file = "calendar_" . $c["id"] . ".json";
                $handle_calendar_file = fopen($calendar_file, 'w') or die('Cannot open file:  ' . $calendar_file);
                $events = Array();
                $eventcalendar = $manager->getRepository("Twake\Calendar:EventCalendar")->findBy(Array("calendar_id" => $c["id"]));
                foreach ($eventcalendar as $ec) {
                    $event = $manager->getRepository("Twake\Calendar:Event")->findOneBy(Array("id" => $ec->getEventId()));
                    $events[] = Array(
                        "date" => $ec->getSortDate(),
                        "event" => Array(
                            "from" => $event->getFrom(),
                            "to" => $event->getTo(),
                            "all_day" => $event->getAllDay(),
                            "type" => $event->getType(),
                            "title" => $event->getTitle(),
                            "description" => $event->getDescription(),
                            "location" => $event->getLocation(),
                            "private" => $event->getPrivate(),
                            "available" => $event->getAvailable(),
                            "owner" => $event->getOwner()(),
                            "participants" => $event->getParticipants(),
                            "notification" => $event->getNotifications(),
                        )
                    );
                    $calendar[] = Array(
                        "color" => $c["color"],
                        "title" => $c["title"],
                        "auto_participant" => $c["auto_participant"],
                        "connectors" => $c["connectors"],
                        "events" => $events
                    );
                    fwrite($handle_calendar_file, json_encode($calendar, JSON_PRETTY_PRINT));
                    fclose($handle_calendar_file);
                }
            }

            chdir("..");
            mkdir("drive_files");
            chdir("drive_files");
            $files = $manager->getRepository("Twake\Drive:DriveFile")->findBy(Array("workspace_id" => $wp["id"]));
            foreach ($files as $file) {
                $path = $file->getPath();
                $version_array = Array();
                $file = $file->getAsArray();
                $version = $manager->getRepository("Twake\Drive:DriveFileVersion")->findBy(Array("file_id" => $file["id"]));
                foreach ($version as $v) {
                    $v = $v->getAsArray();
                    //ar_dump("file id in version: " . $file["id"]);
                    $version_array[] = Array(
                        "creator" => $v["creator"],
                        "name" => $v["name"],
                        "date_added" => $v["added"],
                        "data" => json_encode($v["data"], JSON_PRETTY_PRINT),
                    );

                }
                $drive_file = "drive_" . $file["id"] . ".json";

                $handle_drive_file = fopen($drive_file, 'w') or die('Cannot open file:  ' . $drive_file);
                $drivefile = Array(
                    "parent_id" => $file["parent_id"],
                    "detached" => $file["detached"],
                    "trash" => $file["trash"],
                    "is_directory" => $file["is_directory"],
                    "name" => $file["name"],
                    "description" => $file["description"],
                    "size" => $file["size"],
                    "extension" => $file["extension"],
                    "acces_info" => $file["acces_info"],
                    "url" => $file["url"],
                    "path" => $path,
                    "version" => $version_array
                );
                fwrite($handle_drive_file, json_encode($drivefile, JSON_PRETTY_PRINT));
                fclose($handle_drive_file);
            }
            chdir("../.."); // on remonte dans le workspace en cours de construction
        }

// =================================================================================================================================================
// =================================================================================================================================================

        // ON CREE LE FICHIER CONTENANT TOUS LES USER EN DETAIL ET UN QUI REFERENCE CEUX DU GROUP
//        chdir("..");

    }
}
