<?php

namespace Twake\Core\Command;

use DateTime;
use Common\Commands\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Twake\Calendar\Entity\Calendar;
use Twake\Calendar\Entity\Event;
use Twake\Channels\Entity\Channel;
use Twake\Channels\Entity\ChannelMember;
use Twake\Discussion\Entity\Message;
use Twake\Drive\Entity\DriveFile;
use Twake\Drive\Entity\DriveFileVersion;
use Twake\Market\Entity\LinkAppWorkspace;
use Twake\Tasks\Entity\Board;
use Twake\Tasks\Entity\BoardList;
use Twake\Tasks\Entity\Task;
use Twake\Upload\Entity\File;
use Twake\Users\Entity\Mail;
use Twake\Users\Entity\User;
use Twake\Workspaces\Entity\Group;
use Twake\Workspaces\Entity\GroupApp;
use Twake\Workspaces\Entity\GroupUser;
use Twake\Workspaces\Entity\Workspace;
use Twake\Workspaces\Entity\WorkspaceLevel;
use Twake\Workspaces\Entity\WorkspaceUser;

class ImportCommand extends ContainerAwareCommand
{
    var $leveladmin;
    var $output;
    var $force;
    var $twake;

    var $newApps = Array('all' => Array(), 'notall' => Array());

    public static function cmpMessage($a, $b)
    {
        return $a["creation_date"] - $b["creation_date"];
    }

    protected function configure()
    {
        $this
            ->setName("twake:import_group")
            ->setDescription("Command to import a group from old Twake");
        //->addArgument('tarname', InputArgument::REQUIRED, 'Which tar do you want to import');
    }

    protected function execute()
    {

// =================================================================================================================================================
// =================================================================================================================================================

        error_log("========================================================================================");
        error_log("========================================================================================");
        error_log("\n");
        error_log("DO NO STOP THIS PROCESS IT COULD TAKE A REALLY LONG TIME !!");
        error_log("\n");
        error_log("========================================================================================");
        error_log("========================================================================================");


        $services = $this->getApp()->getServices();
        $manager = $services->get('app.twake_doctrine');
        //$group_name = $input->getArgument('tarname');
        $export_user = true;
        chdir('web');
        chmod(getcwd(), 0777);
        mkdir("Export");
        $phar = new \PharData('Export.tar');
        $phar->extractTo('Export');
        chdir("Export");
        chdir("Export");

        $dir = '.';

        $this->match_file = Array();
        $this->match_table = Array(
            "user" => Array(),
            "message" => Array(),
            "message_bdd" => Array()
        );

        $dh = opendir($dir);
        $roor_tar = getcwd();


        while (false !== ($filename = readdir($dh))) {
            if ($filename[0] == ".") {
                continue;
            }

            chdir($roor_tar);

            error_log("\n\n -------- NEW GROUP --------\n" . $filename . "\n");
            if (is_dir($filename)) {
                chdir($filename);

                //Import this group
                $this->importGroup();

            } else {
                error_log(getcwd());
                error_log("error reading folder " . $filename);
            }

        }
        chdir($roor_tar);


        error_log("\n\n -------- PRIVATE CHANS --------\n");

        $dh = opendir($dir);
        while (false !== ($filename = readdir($dh))) {
            if ($filename[0] == ".") {
                continue;
            }
            chdir($filename);

            //Import this group
            $this->importGroupPrivateChannels();

            chdir("..");

        }

    }

    private function importGroup()
    {

        $services = $this->getApp()->getServices();
        $manager = $services->get('app.twake_doctrine');

// =================================================================================================================================================
// =================================================================================================================================================

        //PARTIE CONCERNANT LE GROUPE
        $group_file = "group.json";
        if (filesize($group_file) > 0) {
            $handle_group = fopen($group_file, 'r') or die('Cannot open file:  ' . $group_file);
            $group_members = Array();
            $contents = json_decode(fread($handle_group, filesize($group_file)), true);
            fclose($handle_group);

            $group = $manager->getRepository("Twake\Workspaces:Group")->findOneBy(Array("name" => $contents["name"] . "_itw"));

            if (!$group) {

                $group = new Group($contents["name"] . "_itw");
                $group->setDisplayName($contents["display_name"]);

                $logo = $contents["logo"];
                if ($logo !== '') {
                    $group->setLogo($contents["logo"]);
                }

                $manager->persist($group);
                $manager->flush();

            }

            $group_id = $group->getId();

        }

        $appRepository = $manager->getRepository("Twake\Market:Application");
        $list_default_apps = $appRepository->findBy(Array("is_default" => true));
        $groupapp_apps = [];
        foreach ($list_default_apps as $app) {
            $groupapp = new GroupApp($group, $app->getId());
            $groupapp->setWorkspaceDefault(true);
            $manager->persist($groupapp);

            $groupapp_apps[] = $groupapp;
        }
        $manager->flush();

// =================================================================================================================================================
// =================================================================================================================================================

        //CREATION DES COMPTES UTILISATEURS QU IL FAUT CREER AVANT DE LES AJOUTER A L ENTREPRISE

        chdir('users');
        $user_file = "users.json";
        $handle_user = fopen($user_file, 'r') or die('Cannot open file:  ' . $user_file);
        $contents = json_decode(fread($handle_user, filesize($user_file)), true);
        foreach ($contents as $user) {
            $old_id = $user["id"];
            $mail = strtolower(trim($user["emailcanonical"]));
            $username = trim($user["username"]);

            // on regarde si le compte du user existe déjà avec son mail
            $new_user = $manager->getRepository("Twake\Users:User")->findOneBy(Array("emailcanonical" => $mail));
            if (!$new_user) {
                $other_new_users_mails = $manager->getRepository("Twake\Users:Mail")->findOneBy(Array("mail" => $mail));
                if ($other_new_users_mails) {
                    $new_user = $other_new_users_mails->getUser();
                }
            }
            if (!$new_user) {
                $new_user = $manager->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => $username));
            }

            if (!isset($new_user)) {
                //si le compte de n'existe pas on ne le crée pas a nouveau
                $new_user = new User();
                $new_user->setFirstName($user["firstname"]);
                $new_user->setLastName($user["lastname"]);
                $new_user->setLanguage($user["language"]);
                $new_user->setUsername($user["username"]);
                $new_user->setPassword($user["password"]);
                $new_user->setemailCanonical($mail);
                $new_user->setSalt($user["salt"]);
                $new_user->setNotificationPreference($user["notification_preference"]);
                $logo = $user["logo"];
                if ($logo !== '') {
                    $logo = new File();
                    $logo->setPublicLink($user["logo"]);
                    $manager->persist($logo);
                    $manager->flush();
                    $new_user->setThumbnail($logo);
                }
                $manager->persist($new_user);

                //creation des emails secondaire
                foreach ($user["secondary_email"] as $mail) {
                    $mail_to_find = $manager->getRepository("Twake\Users:Mail")->findOneBy(Array("mail" => $mail));
                    if (!isset($mail_to_find)) {
                        $mail_bdd = new Mail();
                        $mail_bdd->setMail($mail);
                        $mail_bdd->setUserId($new_user->getId());
                        $manager->persist($mail_bdd);
                    }
                }
                $manager->flush();
            }
            $this->match_table["user"][$old_id] = $new_user->getId() . "";
        }
        fclose($handle_user);

//        chdir("..");
//        return;

// =================================================================================================================================================
// =================================================================================================================================================

        //AJOUT DES MEMBRES DU GROUP DANS LE GROUP AVEC LE LEVEL ET LE IS EXTERNE

        chdir('..');
        $group_members_file = "group_members.json";
        if (filesize($group_members_file) > 0) {
            $handle_group_members = fopen($group_members_file, 'r') or die('Cannot open file:  ' . $group_members_file);
            $group_members = Array();
            $contents = json_decode(fread($handle_group_members, filesize($group_members_file)), true);
            if (isset($contents)) {
                foreach ($contents as $user) {
                    if (array_key_exists($user["user_id"], $this->match_table["user"])) {
                        $new_id = $this->match_table["user"][$user["user_id"]];
                        $user_bdd = $manager->getRepository("Twake\Users:User")->findOneBy(Array("id" => $new_id));
                        $groupuser = new GroupUser($group, $user_bdd);
                        $groupuser->setExterne($user["externe"]);
                        $groupuser->setLevel($user["level"]);
                        $manager->persist($groupuser);
                        $manager->flush();
                    }
                }
            }
            fclose($handle_group_members);
        }

        //  PARTIE SUR LA CREATION DES WORKSPACES ET DES WORKSPACES MEMBERS
        if (file_exists("workspaces")) {
            chdir("workspaces");
            $allworkspace = scandir("./");
            $workspaces = array_values(array_diff($allworkspace, array('.', '..')));
            foreach ($workspaces as $workspace) {

                if ($workspace[0] == ".") {
                    continue;
                }

                chdir($workspace);
                $workspace_file = "workspace.json";
                if (filesize($workspace_file) > 0) {
                    $handle_workspace_file = fopen($workspace_file, 'r') or die('Cannot open file:  ' . $workspace_file);
                    $contents = json_decode(fread($handle_workspace_file, filesize($workspace_file)), true);
                    if (isset($contents)) {
                        $old_wp_id = $contents["id"];
                        error_log(print_r("DEBUT WP : " . $contents["name"] . " ID : " . $old_wp_id));
                        $workspace_bdd = new Workspace($contents["name"]);
                        $workspace_bdd->setUniqueName($contents["uniquename"]);
                        $workspace_bdd->setColor($contents["color"]);
                        $logo = $contents["logo"];
                        if ($logo !== '') {
                            $workspace_bdd->setLogo($contents["logo"]);
                        }
                        $workspace_bdd->setGroup($group->getId());
                        $manager->persist($workspace_bdd);
                        $workspace_id = $workspace_bdd->getId();
                        $manager->flush();
                    }
                }

                $workspace_members_file = "members.json";
                if (filesize($workspace_members_file) > 0) {

                    $handle_workspace_members = fopen($workspace_members_file, 'r') or die('Cannot open file:  ' . $workspace_members_file);
                    $contents = json_decode(fread($handle_workspace_members, filesize($workspace_members_file)), true);
                    $level_admin_bdd = new WorkspaceLevel();
                    $level_admin_bdd->setIsAdmin(true);
                    $level_admin_bdd->setWorkspace($workspace_bdd->getId());
                    $level_admin_bdd->setLabel("Administrator");
                    $manager->persist($level_admin_bdd);
                    $manager->flush();
                    $level_admin_id = $level_admin_bdd->getId();

                    $level_none_bdd = new WorkspaceLevel();
                    $level_none_bdd->setWorkspace($workspace_bdd->getId());
                    $level_none_bdd->setLabel("Basic user");
                    $manager->persist($level_none_bdd);
                    $manager->flush();
                    $level_none_id = $level_none_bdd->getId();

                    if (isset($contents)) {
                        foreach ($contents as $user) {
                            if (array_key_exists($user["user_id"], $this->match_table["user"])) {
                                $new_id = $this->match_table["user"][$user["user_id"]];
                                $user_bdd = $manager->getRepository("Twake\Users:User")->findOneBy(Array("id" => $new_id));
                                $workspaceuser = new WorkspaceUser($workspace_bdd, $user_bdd, $level_none_id);
                                if ($user["admin"]) {
                                    $workspaceuser->setLevelId($level_admin_id);
                                }
                                $manager->persist($workspaceuser);
                            }
                        }
                        $workspace_bdd->setMemberCount(count($contents));
                        $manager->persist($workspace_bdd);
                        $manager->flush();
                    }
                }


                foreach ($groupapp_apps as $groupapp_app) {
                    $services->get("app.workspaces_apps")->enableApp($workspace_id, $groupapp_app->getAppId());
                }

// =================================================================================================================================================
// =================================================================================================================================================
                error_log(">DRIVE");
                //PARTIE SUR LA CREATION DE TOUT LES DRIVE FILES
                if (file_exists("drive_files")) {

                    $root_directory = $manager->getRepository("Twake\Drive:DriveFile")
                        ->findOneBy(Array("workspace_id" => $workspace_id . "", "isintrash" => false, "parent_id" => ""));
                    if (!$root_directory) {
                        $root_directory = new DriveFile($workspace_id . "", "", true);
                        $manager->persist($root_directory);
                        $manager->flush();
                    }

                    chdir("drive_files");
                    $file = "drive_file.json";
                    $handle_drive_file = fopen($file, 'r') or die('Cannot open file:  ' . $file);
                    if (filesize($file) > 0) {
                        $contents = json_decode(fread($handle_drive_file, filesize($file)), true);
                        if (isset($contents) && $contents != Array()) {

                            $all_files_to_sort = $contents;
                            $all_files_sorted = [];
                            $known_parents = [];
                            $i_while = 0;
                            while (count($all_files_to_sort) > 0 && $i_while < 1000) {
                                $next_all_files_to_sort = Array();
                                foreach ($all_files_to_sort as $file) {
                                    if ($file["parent_id"] > 0) {
                                        if (in_array($file["parent_id"], $known_parents)) {
                                            $all_files_sorted[] = $file;
                                            $known_parents[] = $file["id"];
                                        } else {
                                            $next_all_files_to_sort[] = $file;
                                        }
                                    } else {
                                        $all_files_sorted[] = $file;
                                        $known_parents[] = $file["id"];
                                    }
                                }
                                $all_files_to_sort = $next_all_files_to_sort;
                                $i_while++;
                            }


                            foreach ($all_files_sorted as $file) {
                                error_log(print_r("NEW DRIVE FILE : " . $file["name"] . " ID : " . $file["id"], true));

                                $drive_file_bdd = new DriveFile($workspace_id . "", "", $file["is_directory"]);
                                $drive_file_bdd->setDetachedFile($file["detached"]);
                                //$drive_file_bdd->setIsInTrash($file["trash"]);
                                $drive_file_bdd->setName($file["name"]);
                                $drive_file_bdd->setDescription($file["description"]);
                                $drive_file_bdd->setPreviewLink("https://s3.eu-west-3.amazonaws.com/twake.eu-west-3/public/uploads/previews/" . $file["path"] . ".png");
                                $drive_file_bdd->setPreviewHasBeenGenerated(true);
                                $drive_file_bdd->setHasPreview(true);
                                $drive_file_bdd->setSize($file["size"]);
                                $drive_file_bdd->setExtension($file["extension"]);
                                $drive_file_bdd->setWorkspaceId($workspace_id . "");
                                //$drive_file_bdd->setAccesInfo($file["acces_info"]);
                                $drive_file_bdd->setUrl($file["url"]);

                                if ($file["parent_id"] != 0 && array_key_exists($file["parent_id"], $this->match_file)) {
                                    $drive_file_bdd->setParentId($this->match_file[$file["parent_id"]] . "");
                                } else {
                                    $drive_file_bdd->setParentId($root_directory->getId() . "");
                                }
                                $manager->persist($drive_file_bdd);

                                error_log($drive_file_bdd->getId());
                                $this->match_file[$file["id"]] = $drive_file_bdd->getId();

                                $manager->flush();

                                if ($file["version"] != Array() && !$file["is_directory"]) {
                                    $version_bdd = new DriveFileVersion($drive_file_bdd, $file["version"][0]["creator"] ? $file["version"][0]["creator"]["id"] : "");
                                    $version_bdd->setFileName($file["version"][0]["name"]);
                                    $version_bdd->setDateAdded(new \DateTime("@" . intval($file["version"][0]["date_added"])));

                                    $version_bdd->setKey($file["key"]);
                                    $version_bdd->setMode($file["mode"]);

                                    $manager->persist($version_bdd);
                                    $manager->flush();
                                    $drive_file_bdd->setLastVersionId($version_bdd->getId());
                                    $manager->persist($drive_file_bdd);
                                    $manager->flush();
                                }
                            }
                        }
                        fclose($handle_drive_file);
                    }
                    chdir("..");
                }

// =================================================================================================================================================
// =================================================================================================================================================
                error_log(">CHANNELS");
                //  PARTIE SUR LA CREATION DE TOUT LES CHANNELS
                if (file_exists("channels")) {
                    chdir("channels");
                    $allchannel = scandir("./");
                    $channels = array_values(array_diff($allchannel, array('.', '..')));

                    foreach ($channels as $channel) {

                        if ($channel[0] == ".") {
                            continue;
                        }

                        $this->match_table["message"] = Array();

                        $name = $channel;
                        chdir($channel);
                        $channel_bdd = new Channel();

                        $name = explode(":", $name);

                        if (count($name) > 1) {
                            $channel_bdd->setName($name[1]);
                            if (trim($name[0])) {
                                $channel_bdd->setChannelGroupName($name[0]);
                            }
                        } else {
                            $channel_bdd->setName($name[0]);
                        }
                        $name = join($name);

                        if (strpos(strtolower($channel_bdd->getName()), "general") !== false || strpos(strtolower($channel_bdd->getName()), "général") !== false) {
                            $channel_bdd->setIcon(":mailbox:");
                        } else if (strpos(strtolower($channel_bdd->getName()), "random") !== false || strpos(strtolower($channel_bdd->getName()), "divers") !== false) {
                            $channel_bdd->setIcon(":beach_umbrella:");
                        } else {
                            $channel_bdd->setIcon(":small_blue_diamond:");
                        }

                        $channel_file = "channel.json";
                        $handle_channel_file = fopen($channel_file, 'r') or die('Cannot open file:  ' . $channel_file);
                        if (filesize($channel_file) > 0) {
                            $contents = json_decode(fread($handle_channel_file, filesize($channel_file)), true);
                            if (isset($contents)) {
                                error_log(print_r("NEW CHANNEL : " . $name . " ID : " . $contents["id"], true));
                                $channel_bdd->setPrivate($contents["is_private"]);
                                $channel_bdd->setDirect(false);
                                $channel_bdd->setDescription($contents["description"]);
                                $channel_bdd->setOriginalWorkspaceId($workspace_id);
                                $channel_bdd->setOriginalGroupId($group->getId());
                                $member_list = Array();
                                foreach ($contents["members"] as $channel_member) {
                                    if (array_key_exists($channel_member["id"], $this->match_table["user"])) {
                                        array_push($member_list, $this->match_table["user"][$channel_member["id"]]);
                                    }
                                }
                                $channel_bdd->setMembers($member_list);
                            }
                            fclose($handle_channel_file);
                            $manager->persist($channel_bdd);
                            $manager->flush();

                            $channel_bdd_id = $channel_bdd->getId();


                            foreach ($member_list as $id) {
                                $ch_member = new ChannelMember($id . "", $channel_bdd);
                                $manager->persist($ch_member);
                            }
                            $manager->flush();

                        }

                        $message_file = "messages.json";
                        $handle_message_file = fopen($message_file, 'r') or die('Cannot open file:  ' . $message_file);

                        $contents = json_decode(fread($handle_message_file, filesize($message_file)), true);
                        if (isset($contents) && $contents != Array()) {
                            usort($contents, "self::cmpMessage");
                            $no_parent_yet = Array();

                            $messages_to_sort = $contents;
                            $messages = [];
                            $known_parents = [];
                            $i_while = 0;
                            while (count($messages_to_sort) > 0 && $i_while < 1000) {
                                $next_messages_to_sort = Array();
                                foreach ($messages_to_sort as $message) {
                                    if ($message["parent_message_id"] > 0) {
                                        if (in_array($message["parent_message_id"], $known_parents)) {
                                            $messages[] = $message;
                                            $known_parents[] = $message["id"];
                                        } else {
                                            $next_messages_to_sort[] = $message;
                                        }
                                    } else {
                                        $messages[] = $message;
                                        $known_parents[] = $message["id"];
                                    }
                                }
                                $messages_to_sort = $next_messages_to_sort;
                                $i_while++;
                            }

                            foreach ($messages as $message) {

                                if (!$message["creation_date"]) {
                                    continue;
                                }

                                $message_bdd = new Message($channel_bdd_id, "");
                                $manager->persist($message_bdd);
                                $message_bdd->setContent(Array("type" => "compile", "content" => $message["content"]));
                                $res = $this->setMessageContent($message_bdd, $message);

                                if (!$res) {
                                    continue;
                                }

                                $this->match_table["message"][$message["id"]] = $message_bdd->getId() . "";
                                $this->match_table["message_bdd"][$message["id"]] = $message_bdd;

                                if ($message["parent_message_id"] != null) {
                                    if (array_key_exists($message["parent_message_id"], $this->match_table["message"])) {
                                        error_log("add message to parent " . $this->match_table["message"][$message["parent_message_id"]]);
                                        $message_bdd->setParentMessageId($this->match_table["message"][$message["parent_message_id"]]);

                                        $parent = $this->match_table["message_bdd"][$message["parent_message_id"]];
                                        $parent->setResponsesCount($parent->getResponsesCount() + 1);

                                    } else {
                                        // le parent n'existe pas encore on doit creer le message plus tard
                                        $no_parent_yet[$message_bdd->getId() . ""] = Array(
                                            "bdd" => $message_bdd,
                                            "pid" => $message["parent_message_id"]
                                        );
                                    }
                                }
                                if ($message["sender"] != null) {
                                    if (array_key_exists($message["sender"], $this->match_table["user"])) {
                                        $user = $manager->getRepository("Twake\Users:User")->findOneBy(Array("id" => $this->match_table["user"][$message["sender"]]));
                                        $message_bdd->setSender($user);
                                    }
                                }
                                $message_bdd->setCreationDate(new DateTime("@" . intval($message["creation_date"] / 1000)));

                                $manager->persist($message_bdd);
                            }
                            foreach ($no_parent_yet as $key => $message) {
                                error_log("add message to parent (after) " . $this->match_table["message"][$message["pid"]]);

                                $message["bdd"]->setParentMessageId($this->match_table["message"][$message["pid"]]);
                                $manager->persist($message["bdd"]);
                            }
                        }
                        $manager->flush();
                        chdir("..");//on sort du channel en question

                    }
                    chdir(".."); //on sort des channels
                }

// =================================================================================================================================================
// =================================================================================================================================================
                error_log(">CALENDAR");
                //  PARTIE SUR LA CREATION DE TOUT DES CALENDARS
                if (file_exists("calendars")) {
                    chdir("calendars");
                    $allcalendar = scandir("./");
                    $calendars = array_values(array_diff($allcalendar, array('.', '..')));
                    foreach ($calendars as $calendar) {

                        if ($calendar[0] == ".") {
                            continue;
                        }

                        $handle_calendar_file = fopen($calendar, 'r') or die('Cannot open file:  ' . $calendar);
                        if (filesize($calendar) > 0) {
                            $contents = json_decode(fread($handle_calendar_file, filesize($calendar)), true);
                            error_log(print_r("NEW CALENDAR : " . $contents[0]["title"] . " ID : " . $contents[0]["id"], true));

                            $color = $contents[0]["color"];
                            if ($color[0] != "#") {
                                $color = "#444444";
                            }

                            $calendar_bdd = new Calendar($workspace_id, $contents[0]["title"], $color);
                            if (isset($contents[0]["auto_participant"]) && $contents[0]["auto_participant"] != Array()) {
                                $participants = Array();
                                foreach ($contents[0]["auto_participant"] as $p) {
                                    $participants[] = $this->match_table["user"][$p];
                                }
                                $calendar_bdd->setAutoParticipants($participants);
                            }

                            $manager->persist($calendar_bdd);
                            $manager->flush();
                            $calendar_id = $calendar_bdd->getId();
                            //TODO CREER LES EVENTS AVEC LES BONNES INFO ET LES EVENT CALENDAR POUR LIER LES DEUX

                            $events = $contents[0]["events"];
                            if (isset($events)) {
                                foreach ($events as $event) {

                                    $title = "";
                                    if (isset($event["event"]["event"]["title"]) && is_string(($event["event"]["event"]["title"]))) {
                                        $title = $event["event"]["event"]["title"];
                                    }
                                    $event_bdd = new Event($title, $event["event"]["from"], $event["event"]["to"]);

                                    $event_bdd->setType("event");
                                    if (isset($event["event"]["event"])) {
                                        $event_bdd->setAllDay($event["event"]["event"]["allDay"]);
                                        $event_bdd->setDescription($event["event"]["event"]["description"]);
                                    }
                                    $manager->persist($event_bdd);
                                    $event_id = $event_bdd->getId();

                                    $manager->flush();

                                    $services->get("app.calendar.event")->updateCalendars($event_bdd, Array(Array("calendar_id" => $calendar_id, "workspace_id" => $workspace_id)), true);

                                    $participants = Array();
                                    if (isset($event["event"]["participants"]) && is_array($event["event"]["participants"])) {
                                        foreach ($event["event"]["participants"] as $p) {
                                            if (is_int($p)) {
                                                $participants[] = $this->match_table["user"][$p];
                                            } else {
                                                $participants[] = $this->match_table["user"][$p["id"]];
                                            }
                                        }
                                        $services->get("app.calendar.event")->updateParticipants($event_bdd, $participants, true);

                                        $services->get("app.calendar.event")->updateNotifications($event_bdd, Array(Array("delay" => 30 * 60, "mode" => "")), true);
                                    }

                                    $manager->flush();

                                }
                            }
                        }
                    }
                    chdir("..");
                }

// =================================================================================================================================================
// =================================================================================================================================================

                error_log(">TASKS");
                //  PARTIE SUR LA CREATION DES TACHES
                if (file_exists("tasks")) {
                    chdir("tasks");
                    $allboard = scandir("./");
                    $boards = array_values(array_diff($allboard, array('.', '..')));
                    foreach ($boards as $board) {

                        if ($board[0] == ".") {
                            continue;
                        }

                        $handle_board_file = fopen($board, 'r') or die('Cannot open file:  ' . $board);
                        if (filesize($board) > 0) {
                            $contents = json_decode(fread($handle_board_file, filesize($board)), true);
                            error_log(print_r("NEW TASK : " . $contents["title"] . " ID : " . $contents["id"], true));
                            if (isset($contents)) {
                                $board_bdd = new Board($workspace_id, str_replace(":", " ", $contents["title"]));
                                $board_bdd->setGroupName($group->getName());
                                $manager->persist($board_bdd);
                                $manager->flush();
                                $board_id = $board_bdd->getId();
                                $lists = $contents["lists"];
                                if (isset($contents["lists"]) && $contents["lists"] != Array()) {
                                    foreach ($lists as $list) {
                                        $board_list = new BoardList($board_id, $list["title"], $list["color"]);
                                        $manager->persist($board_list);
                                        $manager->flush();
                                        $list_id = $board_list->getId();
                                        $tasks = $list["tasks"];
                                        if (isset($list["tasks"]) && $list["tasks"] != Array()) {
                                            foreach ($tasks as $task) {
                                                $task_bdd = new Task($board_id, $list_id, $task["name"]);
                                                $task_bdd->setDescription($task["description"]);
                                                $task_bdd->setOrder($task["order"]);
                                                $task_bdd->setOwner($this->match_table["user"][$task["user"]]);
                                                $task_bdd->setCheckList($task["checklist"]);
                                                if (isset($task["participant"]) && $task["participant"] != Array()) {
                                                    $participants = Array();
                                                    foreach ($task["participant"] as $p) {
                                                        $participants[] = $this->match_table["user"][$p];
                                                    }
                                                    $task_bdd->setParticipants($participants);
                                                }
                                                $manager->persist($task_bdd);
                                                $manager->flush();
                                            }
                                        }
                                    }
                                }
                            }
                            fclose($handle_board_file);
                        }
                    }
                    chdir("..");
                }
                chdir(".."); // on sort du workspace
            }
// =================================================================================================================================================
// =================================================================================================================================================

        }

        chdir(".."); // on sort du workspace
    }

    private function setMessageContent($m_bdd, $m_arr)
    {

        if ($m_arr["is_application_message"] && $m_arr["hidden_data"] && $m_arr["hidden_data"]["file"]) {
            $file_id = $m_arr["hidden_data"]["file"];
            if ($this->match_file[$file_id]) {
                $m_bdd->setContent(Array(
                        Array(
                            "type" => "system",
                            "content" => "This message contain a file."
                        ),
                        Array(
                            "type" => "br"
                        ),
                        Array(
                            "type" => "file",
                            "content" => $this->match_file[$file_id]
                        )
                    )
                );
                return true;
            }
        }

        if ($m_arr["is_application_message"] && $m_arr["hidden_data"] && $m_arr["hidden_data"]["iframe"]) {
            $url = explode("giphy/view.php?url=", $m_arr["hidden_data"]["iframe"]);
            if (count($url) == 2 && trim($url[1])) {
                $m_bdd->setContent(Array(
                    Array("type" => "system", "content" => ["New GIF"]),
                    Array("type" => "br"),
                    Array(
                        "type" => "image",
                        "src" => urldecode($url[1])
                    )
                ));
                return true;
            }
        }

        if (trim($m_arr["content"]) == "") {
            return false;
        }

        return true;

    }


    private function importGroupPrivateChannels()
    {
        $services = $this->getApp()->getServices();
        $manager = $services->get('app.twake_doctrine');

        //PARTIE SUR LES CHANNEL PRIVES

        //chdir("..");
        if (file_exists("private_channel")) {
            chdir("private_channel");
            $channel_file = "channel_private.json";
            $handle_channel_file = fopen($channel_file, 'r') or die('Cannot open file:  ' . $channel_file);
            if (filesize($channel_file) > 0) {
                $contents = json_decode(fread($handle_channel_file, filesize($channel_file)), true);
                if (isset($contents)) {
                    foreach ($contents as $channel) {
                        error_log(print_r("NEW PRIVATE CHANNEL : " . $channel["id"], true));
                        $name = "";
                        $member_list_id = Array();
                        foreach ($channel["members"] as $channel_member) {
                            if (array_key_exists($channel_member["id"], $this->match_table["user"])) {
                                array_push($member_list_id, $this->match_table["user"][$channel_member["id"]]);
                                $name = $name . $channel_member["username"] . " ";
                            }
                        }
                        error_log(join(", ", $member_list_id));
                        if (count($member_list_id) != 2) {
                            continue;
                        }

                        $false_current_user = new User();
                        $false_current_user->setId($member_list_id[0]);

                        $res = $services->get("app.channels.direct_messages_system")->save(Array("members" => $member_list_id), Array(), $false_current_user);
                        $channel_bdd = $manager->getRepository("Twake\Channels:Channel")->findOneBy(Array("id" => $res["id"]));
                        $channel_bdd_id = $channel_bdd->getId();

                        usort($channel["message"], "self::cmpMessage");
                        $no_parent_yet = Array();

                        $messages_to_sort = $channel["message"];
                        $messages = [];
                        $known_parents = [];
                        $i_while = 0;
                        while (count($messages_to_sort) > 0 && $i_while < 1000) {
                            $next_messages_to_sort = Array();
                            foreach ($messages_to_sort as $message) {
                                if ($message["parent_message_id"] > 0) {
                                    if (in_array($message["parent_message_id"], $known_parents)) {
                                        $messages[] = $message;
                                        $known_parents[] = $message["id"];
                                    } else {
                                        $next_messages_to_sort[] = $message;
                                    }
                                } else {
                                    $messages[] = $message;
                                    $known_parents[] = $message["id"];
                                }
                            }
                            $messages_to_sort = $next_messages_to_sort;
                            $i_while++;
                        }

                        foreach ($messages as $message) {

                            if (!$message["creation_date"]) {
                                continue;
                            }

                            $message_bdd = new Message($channel_bdd_id, "");
                            $manager->persist($message_bdd);
                            $message_bdd->setContent(Array("type" => "compile", "content" => $message["content"]));
                            $res = $this->setMessageContent($message_bdd, $message);

                            if (!$res) {
                                continue;
                            }

                            $this->match_table["message"][$message["id"]] = $message_bdd->getId() . "";
                            $this->match_table["message_bdd"][$message["id"]] = $message_bdd;

                            if ($message["parent_message_id"] != null) {
                                if (array_key_exists($message["parent_message_id"], $this->match_table["message"])) {
                                    error_log("add message to parent " . $this->match_table["message"][$message["parent_message_id"]]);
                                    $message_bdd->setParentMessageId($this->match_table["message"][$message["parent_message_id"]]);
                                    $parent = $this->match_table["message_bdd"][$message["parent_message_id"]];
                                    $parent->setResponsesCount($parent->getResponsesCount() + 1);
                                } else {
                                    // le parent n'existe pas encore on doit creer le message plus tard
                                    $no_parent_yet[$message_bdd->getId() . ""] = Array(
                                        "bdd" => $message_bdd,
                                        "pid" => $message["parent_message_id"]
                                    );
                                }
                            }
                            if ($message["sender"] != null) {
                                if (array_key_exists($message["sender"], $this->match_table["user"])) {
                                    $user = $manager->getRepository("Twake\Users:User")->findOneBy(Array("id" => $this->match_table["user"][$message["sender"]]));
                                    $message_bdd->setSender($user);
                                }
                            }


                            $message_bdd->setCreationDate(new DateTime("@" . intval($message["creation_date"] / 1000)));

                            $manager->persist($message_bdd);
                        }

                    }
                }
                fclose($handle_channel_file);
                chdir("..");
            }
        }
    }
}
