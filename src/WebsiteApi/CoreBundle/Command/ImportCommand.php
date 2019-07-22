<?php
namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Output\OutputInterface;
use WebsiteApi\CalendarBundle\Entity\Calendar;
use WebsiteApi\CalendarBundle\Entity\Event;
use WebsiteApi\ChannelsBundle\Entity\Channel;
use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\DriveBundle\Entity\DriveFile;
use WebsiteApi\DriveBundle\Entity\DriveFileVersion;
use WebsiteApi\MarketBundle\Entity\LinkAppWorkspace;
use WebsiteApi\TasksBundle\Entity\Board;
use WebsiteApi\TasksBundle\Entity\Task;
use WebsiteApi\UploadBundle\Entity\File;
use WebsiteApi\UsersBundle\Entity\Mail;
use WebsiteApi\UsersBundle\Entity\User;
use WebsiteApi\WorkspacesBundle\Entity\Group;
use WebsiteApi\WorkspacesBundle\Entity\GroupUser;
use WebsiteApi\WorkspacesBundle\Entity\Level;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;

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

    public static function cmpMessage($a, $b){
        return $b["creation_date"]-$a["creation_date"];
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
        if(filesize($group_file)> 0){
            $handle_group = fopen($group_file, 'r') or die('Cannot open file:  ' . $group_file);
            $group_members = Array();
            $contents = json_decode(fread($handle_group, filesize($group_file)),true);
            //error_log(print_r($contents, true));
            fclose($handle_group);

//            $logo_data = base64_decode($contents["logo"]["base64_data"]);
//            //on envoie ca sur le serveur de stockage en upload ?
            $group = new Group($contents["name"]);
            $group->setDisplayName($contents["display_name"]);

//            $logo = json_decode($contents["logo"]);
//            if($logo !== ''){
//                $logo = new File();
//                $logo->setType($contents["logo"]["logo_type"]);
//                $logo->setName($contents["logo"]["url"]);
//                $group->setLogo($logo);
//            }
            $manager->persist($group);
            $group_id = $group->getId();
//            $manager->flush();
        }

// =================================================================================================================================================
// =================================================================================================================================================

        //CREATION DES COMPTES UTILISATEURS QU IL FAUT CREER AVANT DE LES AJOUTER A L ENTREPRISE

        chdir('users');
        $allFiles = scandir("./");
        $users = array_values(array_diff($allFiles, array('.', '..')));
        foreach($users as $user){
            $old_id = explode("_",$user);
            $old_id = end($old_id);
            $old_id = explode(".",$old_id)[0];
//            error_log(print_r($old_id,true));
            $handle_user= fopen($user, 'r') or die('Cannot open file:  ' . $user);
            $contents = json_decode(fread($handle_user, filesize($user)),true);

            //$mail = $contents["emailcanonical"];
            //$new_user =  $manager->getRepository("TwakeUsersBundle:User")->findBy(Array("emailcanonical" => $mail));
            if(!isset($new_user)){
                //si le compte de l'utilisateur existe déjà on ne le crée pas a nouveau
                $new_user = new User();
                $new_user->setFirstName($contents["firstname"]);
                $new_user->setLastName($contents["lastname"]);
                $new_user->setLanguage($contents["language"]);
                $new_user->setUsername($contents["username"]);
                $new_user->setPassword($contents["password"]);
                $new_user->setSalt($contents["salt"]);

                //gestion des logo
//            $logo = json_decode($contents["logo"]);
//            if($logo !== ''){
//                $logo = new File();
//                $logo->setType($contents["logo"]["logo_type"]);
//                $logo->setName($contents["logo"]["url"]);
//                $group->setLogo($logo);
//            }
                $new_user->setThumbnail("");

                //creation des emails secondaire
                //doit on rajouter un constructeur dans la class mail ?
//            foreach($contents["secondary_email"] as $mail){
//                $mail_bdd = new Mail();
//            }
                $manager->persist($new_user);
//            $manager->flush();

            }

            $match_table[$old_id] = $new_user->getId()."";

            fclose($handle_user);
        }
        //error_log(print_r($match_table,true));

// =================================================================================================================================================
// =================================================================================================================================================

        //AJOUT DES MEMBRES DU GROUP DANS LE GROUP AVEC LE LEVEL ET LE IS EXTERNE

        chdir('..');
        $group_members_file = "group_members.json";
        if(filesize($group_members_file)> 0){
            $handle_group_members = fopen($group_members_file, 'r') or die('Cannot open file:  ' . $group_members_file);
            $group_members = Array();
            $contents = json_decode(fread($handle_group_members, filesize($group_members_file)),true);
            if(isset($contents)) {
                foreach ($contents as $user) {
//                  $new_id = $match_table[$user["user_id"]];
//                  $user_bdd =  $manager->getRepository("TwakeUsersBundle:User")->findBy(Array("id" => $new_id));
//                  $groupuser = new GroupUser($user_bdd,$group);
//                  $groupuser->setExterne($user["externe"]);
//                  $groupuser->setLevel($user["level"]);
//                  $manager->persist($groupuser);
//                  $manager->flush();
                }
            }
            fclose($handle_group_members);
        }

// =================================================================================================================================================
// =================================================================================================================================================

        //  PARTIE SUR LA CREATION DES WORKSPACES ET DES WORKSPACES MEMBERS
        if(file_exists("workspaces")) {
            chdir("workspaces");
            $allworkspace = scandir("./");
            $workspaces = array_values(array_diff($allworkspace, array('.', '..')));
            foreach ($workspaces as $workspace) {
                chdir($workspace);
                $workspace_file = "workspace.json";
                if (filesize($workspace_file) > 0) {
                    $handle_workspace_file = fopen($workspace_file, 'r') or die('Cannot open file:  ' . $workspace_file);
                    $contents = json_decode(fread($handle_workspace_file, filesize($workspace_file)), true);
                    if (isset($contents)) {

                        $workspace_bdd = new Workspace($contents["name"]);
                        $workspace_bdd->setUniqueName($contents["uniquename"]);
                        $workspace_bdd->setColor("color");
                        $manager->persist($workspace_bdd);
                        $workspace_id = $workspace_bdd->getId();

                        // gestion des logo
                        $logo = json_decode($contents["logo"]);
                        //                    if($logo !== '') {
                        //                        $logo = new File();
                        //                        $logo->setType($contents["logo"]["logo_type"]);
                        //                        $logo->setName($contents["logo"]["url"]);
                        //                        $workspace_bdd->setLogo($logo);
                        //                    }
                    }
                }
                $workspace_members_file = "members.json";
                if (filesize($workspace_members_file) > 0) {
                    //error_log(print_r($workspace));
                    $handle_workspace_members = fopen($workspace_members_file, 'w') or die('Cannot open file:  ' . $workspace_members_file);
                    $contents = json_decode(fread($handle_workspace_members, filesize($workspace_members_file)), true);
                    //error_log(print_r($contents,true));
                    if (isset($contents)) {
                        foreach ($contents as $user) {
                            //                $new_id = $match_table[$user["user_id"]];
                            //                $user_bdd =  $manager->getRepository("TwakeUsersBundle:User")->findBy(Array("id" => $new_id));
                            //                $workspaceuser = new WorkspaceUser($user_bdd,$workspace_bdd);
                            //                $workspaceuser->setLevel($user["level"]);
                            //                $manager->persist($workspaceuser);
                            //            $manager->flush();
                        }
                    }
                }


// =================================================================================================================================================
// =================================================================================================================================================

                //  PARTIE SUR LA CREATION DE TOUT LES CHANNELS
                if (file_exists("channels")) {
                    chdir("channels");
                    $allchannel = scandir("./");
                    $channels = array_values(array_diff($allchannel, array('.', '..')));
                    foreach ($channels as $channel) {
                        $name = $channel;
                        chdir($channel);
                        $channel_bdd = new Channel();
                        $channel_bdd->setName($name);
                        $channel_file = "channel.json";
                        $handle_channel_file = fopen($channel_file, 'w') or die('Cannot open file:  ' . $channel_file);
                        if (filesize($channel_file) > 0) {
                            $contents = json_decode(fread($handle_channel_file, filesize($channel_file)), true);
                            //error_log(print_r($contents,true));
                            if (isset($contents)) {
                                $channel_bdd->setDescription($contents["description"]);
                                $channel_bdd->setMembers($contents["members"]);
                                $channel_bdd->setOriginalWorkspaceId($workspace_id);
                            }
                            fclose($handle_channel_file);
                            //                $manager->persist($channel_bdd);
                            //                $manager->flush();
                        }

                        $message_file = "messages.json";
                        $handle_message_file = fopen($message_file, 'w') or die('Cannot open file:  ' . $message_file);
                        if (filesize($message_file) > 0) {
                            $contents = json_decode(fread($handle_message_file, filesize($message_file)), true);
                            usort($resumed, "self::cmpMessage");

                            if (isset($contents)) {
                                foreach ($contents as $message) {
                                    $message_bdd = new Message($channel_bdd, $message["parent_message_id"]);
                                    $message_bdd->setReactions($channel["reaction"]);
                                    $message_bdd->setContent($channel["content"]);
                                    $message_bdd->setHiddenData($channel["hidden_data"]);
                                    $message_bdd->setMessageType($channel["message_type"]);
                                    $user = $manager->getRepository("TwakeUsersBundle:User")->findBy(Array("id" => $match_table[$channel["sender"]]));
                                    $message_bdd->setSender($user);
                                    $message_bdd->setCreationDate($channel["creation_date"]);
                                    //                          $manager->persist($message_bdd);
                                    //                          $manager->flush();
                                }
                            }
                        }
                        chdir("..");//on sort du channel en question
                    }
                    chdir(".."); //on sort des channels
                }

// =================================================================================================================================================
// =================================================================================================================================================

                //PARTIE SUR LA CREATION DE TOUT LES DRIVE FILES
                if (file_exists("drive_files")) {
                    chdir("drive_files");
                    $allfiles = scandir("./");
                    $files = array_values(array_diff($allfiles, array('.', '..')));
                    foreach ($files as $file) {
                        $handle_drive_file = fopen($file, 'w') or die('Cannot open file:  ' . $file);
                        if (filesize($file) > 0) {
                            $contents = json_decode(fread($handle_drive_file, filesize($file)), true);
                            if(isset($contents)){
                                $drive_file_bdd = new DriveFile($workspace_id,$contents["parent_id"],$contents["is_directory"]);
                                $drive_file_bdd->setDetachedFile($contents[""]);
                                $drive_file_bdd->setIsInTrash($contents["trash"]);
                                $drive_file_bdd->setName($contents["name"]);
                                $drive_file_bdd->setDescription($contents["description"]);
                                $drive_file_bdd->setSize($contents["size"]);
                                $drive_file_bdd->setExtension($contents["extension"]);
                                $drive_file_bdd->setPublicAccesInfo($contents["public_acces_info"]);
                                $drive_file_bdd->setUrl($contents["url"]);

                                $version_bdd = new DriveFileVersion($drive_file_bdd,$contents["version"]["creator"]);
                                $version_bdd->setFileName($contents["version"]["name"]);
                                //$version_bdd->setData($version["data"]);
                                $version_bdd->setDateAdded($contents["version"]["date_added"]);
                                $manager->persist($version_bdd);
                                $drive_file_bdd->setLastVersionId($version_bdd->getId());

                                $manager->persist($drive_file_bdd);
                                $manager->flush();
                                                }
                            fclose($handle_drive_file);
                        }
                    }
                    chdir("..");
                }
                error_log(print_r(getcwd(),true));

// =================================================================================================================================================
// =================================================================================================================================================

//        //  PARTIE SUR LA CREATION DE TOUT DES CALENDARS
//            chdir("calendars");
//            $allcalendar= scandir("./");
//            $calendars = array_values(array_diff($allcalendar, array('.', '..')));
//            foreach($calendars as $calendar) {
//                $handle_calendar_file = fopen($calendar, 'w') or die('Cannot open file:  ' . $calendar);
//                if(filesize($calendar) > 0 ){
//                    $contents = json_decode(fread($handle_calendar_file, filesize($calendar)), true);
//                    $calendar_bdd = new Calendar($workspace_id,$contents["title"],$contents["color"]);
//                    $calendar_bdd->setAutoParticipants($contents["auto_participant"]);
//
//
//                    //TODO CREER LES EVENTS AVEC LES BONNES INFO ET LES EVENT CALENDAR POUR LIER LES DEUX
//
////                    $events = $contents["event"];
////                    if(isset($events)){
////                        foreach ($events as $event){
////                            $event_bdd = new Event($event["title"],$event["from"],$event["to"]);
////
////                        }
////                    }
//                    $manager->persist($calendar_bdd);
//                    $manager->flush();
//
//                }
//
//            }


// =================================================================================================================================================
// =================================================================================================================================================
            //  PARTIE SUR LA CREATION DES TACHES
                if(file_exists("tasks")){
                    chdir("tasks");
                    $allboard= scandir("./");
                    $boards = array_values(array_diff($allboard, array('.', '..')));
                    foreach($boards as $board) {
                        $handle_board_file = fopen($board, 'w') or die('Cannot open file:  ' . $board);
                        if (filesize($board) > 0) {
                            $contents = json_decode(fread($board, filesize($board)), true);
                            if (isset($contents)) {
                                $board_bdd = new Board($workspace_id,$contents["title"]);
                                $manager->persist($board_bdd);

                                $tasks = $board["tasks"];
                                foreach ($tasks as $task){
                                    $task_bdd = new Task($board_bdd->getId(), "", $task["title"]);
                                    $manager->persist($task_bdd);
                                }
                            }
                            fclose($handle_board_file);
                        }
                    }
                    chdir("..");
                }

                chdir(".."); // on sort du workspace
            }
        }
// =================================================================================================================================================
// =================================================================================================================================================

    }
}
