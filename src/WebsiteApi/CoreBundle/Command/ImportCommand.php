<?php
namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Output\OutputInterface;
use WebsiteApi\CalendarBundle\Entity\Calendar;
use WebsiteApi\CalendarBundle\Entity\Event;
use WebsiteApi\CalendarBundle\Entity\EventCalendar;
use WebsiteApi\ChannelsBundle\Entity\Channel;
use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\DriveBundle\Entity\DriveFile;
use WebsiteApi\DriveBundle\Entity\DriveFileVersion;
use WebsiteApi\MarketBundle\Entity\LinkAppWorkspace;
use WebsiteApi\TasksBundle\Entity\Board;
use WebsiteApi\TasksBundle\Entity\BoardList;
use WebsiteApi\TasksBundle\Entity\Task;
use WebsiteApi\UploadBundle\Entity\File;
use WebsiteApi\UsersBundle\Entity\Mail;
use WebsiteApi\UsersBundle\Entity\User;
use WebsiteApi\WorkspacesBundle\Entity\Group;
use WebsiteApi\WorkspacesBundle\Entity\GroupUser;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceLevel;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;

class ImportCommand extends ContainerAwareCommand
{
    var $leveladmin;
    var $output;
    var $force;
    var $twake;

    var $newApps = Array('all' => Array(), 'notall' => Array());

    protected function configure()
    {
        $this
            ->setName("twake:import_group")
            ->setDescription("Command to import a group from old Twake");
        //->addArgument('tarname', InputArgument::REQUIRED, 'Which tar do you want to import');
    }

    public static function cmpMessage($a, $b)
    {
        return $a["creation_date"] - $b["creation_date"];
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {

// =================================================================================================================================================
// =================================================================================================================================================

        $services = $this->getApplication()->getKernel()->getContainer();
        $manager = $services->get('app.twake_doctrine');
        //$group_name = $input->getArgument('tarname');
        //error_log(print_r($group_name,true));
        $export_user = true;
        chdir('web');
        chmod(getcwd(), 0777);
        mkdir("Import");
        $phar = new \PharData('Export.tar');
        $phar->extractTo('Import');
        chdir("Import");

        $match_table = Array();

        $allFiles = scandir("./");
        $folder = array_values(array_diff($allFiles, array('.', '..')));
        //error_log(print_r($folder,true));
        chdir($folder[0]);
//        error_log(print_r(getcwd(),true));

// =================================================================================================================================================
// =================================================================================================================================================

        //PARTIE CONCERNANT LE GROUP
        $group_file = "group.json";
        if (filesize($group_file) > 0) {
            $handle_group = fopen($group_file, 'r') or die('Cannot open file:  ' . $group_file);
            $group_members = Array();
            $contents = json_decode(fread($handle_group, filesize($group_file)), true);
            //error_log(print_r($contents, true));
            fclose($handle_group);

            $group = new Group($contents["name"]);
            $group->setDisplayName($contents["display_name"]);

            $logo = $contents["logo"];
            if ($logo !== '') {
                $logo = new File();
                $logo->setPublicLink($contents["logo"]);
                $manager->persist($logo);
                $manager->flush();
                $group->setLogo($logo);
            }

            $manager->persist($group);
            $group_id = $group->getId();
            $manager->flush();
        }

// =================================================================================================================================================
// =================================================================================================================================================

        //CREATION DES COMPTES UTILISATEURS QU IL FAUT CREER AVANT DE LES AJOUTER A L ENTREPRISE

        chdir('users');
        $user_file = "users.json";
        $handle_user = fopen($user_file, 'r') or die('Cannot open file:  ' . $user_file);
        $contents = json_decode(fread($handle_user, filesize($user_file)), true);
        foreach ($contents as $user) {
            $old_id = $user["id"];
            $mail = $user["emailcanonical"];

            // on regarde si le compte du user existe déjà avec son mail
            $new_user = $manager->getRepository("TwakeUsersBundle:User")->findOneBy(Array("emailcanonical" => $mail));

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
                    $mail_to_find = $manager->getRepository("TwakeUsersBundle:Mail")->findOneBy(Array("mail" => $mail));
                    if (!isset($mail_to_find)) {
                        $mail_bdd = new Mail();
                        $mail_bdd->setMail($mail);
                        $mail_bdd->setUser($new_user);
                        $manager->persist($mail_bdd);
                    }
                }
                $manager->flush();
            }
            $match_table[$old_id] = $new_user->getId() . "";
        }
        fclose($handle_user);
//        error_log(print_r($match_table,true));

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
                    if (array_key_exists($user["user_id"], $match_table)) {
                        $new_id = $match_table[$user["user_id"]];
                        $user_bdd = $manager->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $new_id));
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

// =================================================================================================================================================
// =================================================================================================================================================

        //  PARTIE SUR LA CREATION DES WORKSPACES ET DES WORKSPACES MEMBERS
        if (file_exists("workspaces")) {
            chdir("workspaces");
            $allworkspace = scandir("./");
            $workspaces = array_values(array_diff($allworkspace, array('.', '..')));
            foreach ($workspaces as $workspace) {
//                error_log(print_r(getcwd()));
                chdir($workspace);
                $workspace_file = "workspace.json";
                if (filesize($workspace_file) > 0) {
                    $handle_workspace_file = fopen($workspace_file, 'r') or die('Cannot open file:  ' . $workspace_file);
                    $contents = json_decode(fread($handle_workspace_file, filesize($workspace_file)), true);
                    if(isset($contents)){
                        $old_wp_id = $contents["id"];
                        error_log(print_r("DEBUT WP : " . $old_wp_id));
                        $workspace_bdd = new Workspace($contents["name"]);
                        $workspace_bdd->setUniqueName($contents["uniquename"]);
                        $workspace_bdd->setColor($contents["color"]);
                        $logo = $contents["logo"];
                        if ($logo !== '') {
                            $logo = new File();
                            $logo->setPublicLink($contents["logo"]);
                            $manager->persist($logo);
                            $manager->flush();
                            $workspace_bdd->setLogo($logo);
                        }
                        $workspace_bdd->setGroup($group);
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
                    $level_admin_bdd->setWorkspace($workspace_bdd);
                    $level_admin_bdd->setLabel("Administrator");
                    $manager->persist($level_admin_bdd);
                    $manager->flush();
                    $level_admin_id = $level_admin_bdd->getId();

                    $level_none_bdd = new WorkspaceLevel();
                    $level_none_bdd->setWorkspace($workspace_bdd);
                    $level_none_bdd->setLabel("Basic user");
                    $manager->persist($level_none_bdd);
                    $manager->flush();
                    $level_none_id = $level_none_bdd->getId();

                    if (isset($contents)) {
                        foreach ($contents as $user) {
                            if (array_key_exists($user["user_id"], $match_table)) {
                                $new_id = $match_table[$user["user_id"]];
                                $user_bdd = $manager->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $new_id));
                                $workspaceuser = new WorkspaceUser($workspace_bdd, $user_bdd, $level_none_id);
                                if($user["admin"]){
                                    $workspaceuser->setLevelId($level_admin_id);
                                }
                                $manager->persist($workspaceuser);
                                $manager->flush();
                            }
                        }
                    }
                }

// =================================================================================================================================================
// =================================================================================================================================================
//
//                //  PARTIE SUR LA CREATION DE TOUT LES CHANNELS
//                if (file_exists("channels")) {
//                    chdir("channels");
//                    $allchannel = scandir("./");
//                    $channels = array_values(array_diff($allchannel, array('.', '..')));
//                    //error_log(print_r($channels,true));
//                    foreach ($channels as $channel) {
//                        $match_messages = Array();
////                        error_log(print_r("old wp id  : " . $old_wp_id));
////                        error_log(print_r("nb channel  : " . sizeof($channels)));
////                        error_log(print_r("match message au debut : " . sizeof($match_messages)));
//                        $name = $channel;
//                        chdir($channel);
//                        $channel_bdd = new Channel();
//                        $channel_bdd->setName($name);
//                        $channel_file = "channel.json";
//                        $handle_channel_file = fopen($channel_file, 'r') or die('Cannot open file:  ' . $channel_file);
//                        if (filesize($channel_file) > 0) {
//                            $contents = json_decode(fread($handle_channel_file, filesize($channel_file)), true);
//                            //error_log(print_r($contents,true));
//                            if (isset($contents)) {
//                                $channel_bdd->setPrivate($contents["is_private"]);
//                                $channel_bdd->setDescription($contents["description"]);
//                                $channel_bdd->setOriginalWorkspaceId($workspace_id);
//                                $member_list = Array();
//                                foreach ($contents["members"] as $channel_member){
//                                    if(array_key_exists($channel_member["id"],$member_list)){
//                                        array_push($member_list,$match_table[$channel_member["id"]]);
//                                    }
//                                }
////                                error_log(print_r($member_list,true));
//                                $channel_bdd->setMembers($member_list);
//                            }
//                            fclose($handle_channel_file);
//                            $manager->persist($channel_bdd);
//                            $manager->flush();
//                            $channel_bdd_id = $channel_bdd->getId();
//                        }
//
//                        $message_file = "messages.json";
//                        $handle_message_file = fopen($message_file, 'r') or die('Cannot open file:  ' . $message_file);
//                        error_log(print_r($name,true));
//                        error_log(print_r($channel_bdd_id."",true));
//
//                        $contents = json_decode(fread($handle_message_file, filesize($message_file)), true);
//                        if (isset($contents) && $contents != Array()) {
//                            usort($contents, "self::cmpMessage");
//                            //error_log(print_r($contents,true));
//                            $no_parent_yet = Array();
//                            foreach ($contents as $message) {
//                                $message_bdd = new Message($channel_bdd_id, "");
//                                $manager->persist($message_bdd);
//                                $match_messages[$message["id"]] = $message_bdd->getId() . "";
//                                $message_bdd->setContent($message["content"]);
//                                if ($message["parent_message_id"] != null) {
//                                    if (array_key_exists($message["parent_message_id"], $match_messages)) {
//                                        $message_bdd->setParentMessageId($match_messages[$message["parent_message_id"]]);
//                                    } else {
//                                        // le parent n'existe pas encore on doit creer le message plus tard
//                                        $no_parent_yet[$message_bdd->getId() . ""] = $message;
//                                    }
//                                }
//                                if ($message["sender"] != null) {
//                                    if(array_key_exists($message["sender"],$match_table)){
//                                        $user = $manager->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $match_table[$message["sender"]]));
//                                        //error_log(print_r($user->getUsername()));
//                                        $message_bdd->setSender($user);
//                                    }
//                                }
//                                $message_bdd->setCreationDate(\DateTime("@". intval($message["creation_date"]/1000)));
//                                $manager->persist($message_bdd);
//                                $manager->flush();
//                            }
//                            foreach ($no_parent_yet as $key => $value){
//                                $message =  $manager->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $key));
//                                $manager->remove($message);
//                                $manager->flush();
//                                $message->setParentMessageId($value["parent_message_id"]);
//                                $manager->persist($message);
//                                $manager->flush();
//                            }
//                        }
//                        chdir("..");//on sort du channel en question
//////                        error_log(print_r($workspace_bdd->getName(),true));
//////                        error_log(print_r($name,true));
////                        error_log(print_r("size a la fin: " . sizeof($match_table),true));
//                    }
//                    chdir(".."); //on sort des channels
//                }

// =================================================================================================================================================
// =================================================================================================================================================

//                //PARTIE SUR LA CREATION DE TOUT LES DRIVE FILES
//                if (file_exists("drive_files")) {
//                    chdir("drive_files");
//                    $allfiles = scandir("./");
//                    $file = "drive_file.json";
//                    $handle_drive_file = fopen($file, 'r') or die('Cannot open file:  ' . $file);
//                    if (filesize($file) > 0) {
//                        $contents = json_decode(fread($handle_drive_file, filesize($file)), true);
//                        if(isset($contents) && $contents != Array()){
//                            $match_file = Array();
//                            error_log(print_r($old_wp_id));
//                            foreach ($contents as $file) {
//                                $drive_file_bdd = new DriveFile($workspace_id."", "", $file["is_directory"]);
//                                $drive_file_bdd->setDetachedFile($file["detached"]);
//                                //$drive_file_bdd->setIsInTrash($file["trash"]);
//                                $drive_file_bdd->setName($file["name"]);
//                                $drive_file_bdd->setDescription($file["description"]);
//                                $drive_file_bdd->setSize($file["size"]);
//                                $drive_file_bdd->setExtension($file["extension"]);
//                                //$drive_file_bdd->setPublicAccesInfo($file["public_acces_info"]);
//                                $drive_file_bdd->setUrl($file["url"]);
//                                $manager->persist($drive_file_bdd);
//                                if ($file["parent_id"] != 0) {
//                                    if (array_key_exists($file["parent_id"], $match_file)) {
//                                        $drive_file_bdd->setParentId($match_file[$file["parent_message_id"]]);
//                                        $manager->persist($drive_file_bdd);
//                                    }
//                                }
//                                $manager->flush();
//
//                                if($file["version"] != Array() && !$file["is_directory"]){
//                                    $version_bdd = new DriveFileVersion($drive_file_bdd,$file["version"][0]["creator"]?$file["version"][0]["creator"]["id"]:"");
//                                    $version_bdd->setFileName($file["version"][0]["name"]);
//                                    $version_bdd->setDateAdded(new \DateTime("@".intval($file["version"][0]["date_added"])));
//
//                                  //  error_log(print_r($version_bdd->getAsArray()));
//
//                                    $manager->persist($version_bdd);
//                                    $manager->flush();
//                                    $drive_file_bdd->setLastVersionId($version_bdd->getId());
//                                    $manager->persist($drive_file_bdd);
//                                    $manager->flush();
//                                }
//                            }
//                        }
//                        fclose($handle_drive_file);
//                    }
//                    chdir("..");
//                }

// =================================================================================================================================================
// =================================================================================================================================================

//        //  PARTIE SUR LA CREATION DE TOUT DES CALENDARS
//            if (file_exists("calendars")) {
//                chdir("calendars");
//                $allcalendar= scandir("./");
//                $calendars = array_values(array_diff($allcalendar, array('.', '..')));
//                foreach($calendars as $calendar) {
//                    $handle_calendar_file = fopen($calendar, 'r') or die('Cannot open file:  ' . $calendar);
//                    if (filesize($calendar) > 0) {
//                        $contents = json_decode(fread($handle_calendar_file, filesize($calendar)), true);
//                        $calendar_bdd = new Calendar($workspace_id, $contents[0]["title"], $contents[0]["color"]);
//                        $calendar_bdd->setAutoParticipants($contents[0]["auto_participant"]);
//                        $manager->persist($calendar_bdd);
//                        $manager->flush();
//                        $calendar_id = $calendar_bdd->getId();
//                        //TODO CREER LES EVENTS AVEC LES BONNES INFO ET LES EVENT CALENDAR POUR LIER LES DEUX
//
//                        $events = $contents[0]["events"];
//                        if (isset($events)) {
//                            foreach ($events as $event) {
//                                $title = "";
//                                if(isset($event["event"]["event"]["title"]) && is_string(($event["event"]["event"]["title"]))){
//                                    $title = $event["event"]["event"]["title"];
//                                }
//                                $event_bdd = new Event($title, $event["event"]["from"], $event["event"]["to"]);
//                                $event_bdd->setWorkspacesCalendars($workspace_id . "");
//                                $event_bdd->setParticipants($event["event"]["participants"]);
//                                if(isset($event["event"]["event"]["typeEvent"]) && is_string($event["event"]["event"]["typeEvent"])){
//                                    $event_bdd->setType($event["event"]["event"]["typeEvent"]);
//                                }
//                                $manager->persist($event_bdd);
//                                $event_id = $event_bdd->getId();
//                                $manager->flush();
//
//                                //error_log(print_r(gettype($event["event"]["event"]["start"]["date"]),true));
//                                $date = new \DateTime("@".intval($event["event"]["from"]));
////                                error_log(print_r($date->getTimestamp(),true));
//                                $event_calendar_bdd = new EventCalendar($workspace_id, $calendar_id, $event_id, $date->getTimestamp());
//                                $manager->persist($event_calendar_bdd);
//                                $manager->flush();
//                            }
//                        }
//                    }
//                }
//                chdir("..");
//            }

// =================================================================================================================================================
// =================================================================================================================================================

            //  PARTIE SUR LA CREATION DES TACHES
                if(file_exists("tasks")){
                    error_log("NOUVELLE TACHES");
                    chdir("tasks");
                    $allboard= scandir("./");
                    $boards = array_values(array_diff($allboard, array('.', '..')));
                    foreach($boards as $board) {
                        $handle_board_file = fopen($board, 'r') or die('Cannot open file:  ' . $board);
                        if (filesize($board) > 0) {
                            $contents = json_decode(fread($handle_board_file, filesize($board)), true);
                            if (isset($contents)) {
                                $board_bdd = new Board($workspace_id,$contents["title"]);
                                $board_bdd->setGroupName($group->getName());
                                error_log(print_r($board_bdd->getAsArray(),true));
                                $manager->persist($board_bdd);
                                $manager->flush();
//                                error_log("ici");
//                                $board_id = $board_bdd->getId();
//                                $lists = $board["lists"];
//                                error_log("la");
//                                if(isset($board["lists"]) && $board["lists"] != Array()){
//                                    foreach ($lists as $list){
//                                        $board_list = new BoardList($board_id,$list["title"],$list["color"]);
//                                        $manager->persist($board_list);
//                                        $manager->flush();
//                                        $list_id = $board_list->getId();
//                                        $tasks = $list["tasks"];
//                                        if(isset($list["tasks"]) && $list["tasks"] != Array()){
//                                            foreach ($tasks as $task){
//                                                $task_bdd = new Task($board_id,$list_id,$task["name"]);
//                                                $task_bdd->setDescription($task["description"]);
//                                                $task_bdd->setOrder($task["order"]);
//                                                $task_bdd->setOwner($match_table[$task["user"]]);
//                                                $task_bdd->setCheckList($task["checklist"]);
//                                                if(isset($task["participant"]) && $task["participant"] != Array()){
//                                                    $participants = Array();
//                                                    foreach($task["participant"] as $p){
//                                                        $participants[] = $match_table[$p];
//                                                    }
//                                                    $task_bdd->setParticipants($participants);
//
//                                                }
//                                                $manager->persist($task_bdd);
//                                                $manager->flush();
//                                            }
//                                        }
//                                    }
//                                }
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
    }
}
