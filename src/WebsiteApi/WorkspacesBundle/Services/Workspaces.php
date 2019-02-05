<?php

namespace WebsiteApi\WorkspacesBundle\Services;


use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\CalendarBundle\Entity\Calendar;
use WebsiteApi\CalendarBundle\Entity\LinkCalendarWorkspace;
use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\ChannelsBundle\Entity\Channel;
use WebsiteApi\DriveBundle\Entity\DriveLabel;
use WebsiteApi\ProjectBundle\Entity\Board;
use WebsiteApi\ProjectBundle\Entity\LinkBoardWorkspace;
use WebsiteApi\ProjectBundle\Entity\ListOfTasks;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceApp;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceLevel;
use WebsiteApi\WorkspacesBundle\Model\WorkspacesInterface;
use WebsiteApi\CoreBundle\Services\TranslationObject;


class Workspaces implements WorkspacesInterface
{

    private $wls;
    private $wms;
    private $gms;
    private $gas;
    private $gs;
    private $doctrine;
    private $pricing;
    private $string_cleaner;
    private $pusher;
    private $translate;
    private $taskService;
    /* @var WorkspacesActivities $workspacesActivities*/
    var $workspacesActivities;
    var $calendarEventService;
    var $calendarService;
    var $driveAdapteService;

    public function __construct($doctrine, $workspaces_levels_service, $workspaces_members_service, $groups_managers_service, $groups_apps_service, $groups_service, $priceService, $cleaner, $pusher, $workspacesActivities, $translate, $taskService, $calendarService, $calendarEventService, $driveAdapteService)
    {
        $this->doctrine = $doctrine;
        $this->wls = $workspaces_levels_service;
        $this->wms = $workspaces_members_service;
        $this->gms = $groups_managers_service;
        $this->gas = $groups_apps_service;
        $this->gs = $groups_service;
        $this->pricing = $priceService;
        $this->string_cleaner = $cleaner;
        $this->pusher = $pusher;
        $this->workspacesActivities = $workspacesActivities;
        $this->translate = $translate;
        $this->taskService = $taskService;
        $this->calendarService = $calendarService;
        $this->calendarEventService = $calendarEventService;
        $this->driveAdapteService = $driveAdapteService;
    }

    public function getPrivate($userId = null)
    {
        $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->find($userId);

        if (!$user) {
            return null;
        }

        $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        $workspace = $workspaceRepository->findOneBy(Array("user" => $user));

        if (!$workspace) {
            $plan = $this->pricing->getMinimalPricing();
            $group = $this->gs->create($userId, "private_group_" . $userId, "private_group_" . $userId, $plan->getId());
            $group->setIsPrivate(true);
            $workspace = $this->create("private_workspace", $group->getId(), $userId);
            $workspace->setIsNew(false);
            $workspace->setUser($user);
            $this->doctrine->persist($group);
            $this->doctrine->persist($workspace);
            $this->doctrine->flush();
        }

        //Old groups to remove one day
        if (!$workspace->getGroup()) {
            $plan = $this->pricing->getMinimalPricing();
            $group = $this->gs->create($userId, "private_group_" . $userId, "private_group_" . $userId, $plan->getId());
            $group->setIsPrivate(true);
            $workspace->setGroup($group);
            $this->init($workspace);
            $this->doctrine->persist($group);
            $this->doctrine->persist($workspace);
            $this->doctrine->flush();
        }
        return $workspace;

    }

    public function create($name, $groupId = null, $userId = null)
    {

        if ($groupId == null && $userId == null) {
            return false;
        }

        if ($name == "") {
            return false;
        }

        $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");

        $workspace = new Workspace($name);

        $uniquename = $this->string_cleaner->simplify($name);
        $uniquenameIncremented = $uniquename . "-" . substr(md5(date("U") . rand()), 0, 10);

        $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->find($userId);

        if ($groupId != null) {
            $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
            $group = $groupRepository->find($groupId);


            $groupUserdRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
            $group_user = $groupUserdRepository->findOneBy(Array("group" => $group, "user" => $user));

            if (!$group_user || $group_user->getExterne()) {
                return false;
            }

        }

        $workspace->setUniqueName($uniquenameIncremented);

        if ($groupId != null) {
            $limit = $this->pricing->getLimitation($groupId, "maxWorkspace", PHP_INT_MAX);

            $_nbWorkspace = $workspaceRepository->findBy(Array("group" => $group));
            $nbWorkspace = [];
            foreach ($_nbWorkspace as $ws) {
                if (!$ws->getis_deleted()) {
                    $nbWorkspace[] = $ws;
                }
            }

            if (count($nbWorkspace) >= $limit) {
                return false;
            }
            $workspace->setGroup($group);
        }

        $this->doctrine->persist($workspace);
        $this->doctrine->flush();

        $twakebot = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "twake_bot"));
        $twakebotId = $twakebot->getId();


        $this->translate->setDefaultLanguage($user->getLanguage());

        // Create stream
        //$streamGeneral = new Channel($workspace, new TranslationObject($this->translate, "general"), false, "This is the general stream");
        //$streamGeneral->setType("stream");
        //$streamRandom = new Stream($workspace, "Random", false, "This is the random stream");
        //$streamRandom->setType("stream");
        //$this->doctrine->persist($streamGeneral);
        //$this->doctrine->persist($streamRandom);

        $this->doctrine->flush();

        $links = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findBy(Array("user"=>$user));
       /* if(count($links)<=1){
            $t = microtime(true);
            $micro = sprintf("%06d", ($t - floor($t)) * 1000000);
            $content = new TranslationObject($this->translate,"message.hello1",$user->getUsername());
            $message = new Message($twakebot, "S", $streamGeneral, false, null, false, new \DateTime(date('Y-m-d H:i:s.' . $micro, $t)), $content, $this->string_cleaner->simplifyWithoutRemovingSpaces($content), null);
            $message->setFrontId("");
            $this->doctrine->persist($message);

            $t = microtime(true);
            $micro = sprintf("%06d", ($t - floor($t)) * 1000000);
            $content = new TranslationObject($this->translate,"message.hello2");
            $message = new Message($twakebot, "S", $streamGeneral, false, null, false, new \DateTime(date('Y-m-d H:i:s.' . $micro, $t)), $content, $this->string_cleaner->simplifyWithoutRemovingSpaces($content), null);
            $message->setFrontId("");
            $this->doctrine->persist($message);

            $t = microtime(true);
            $micro = sprintf("%06d", ($t - floor($t)) * 1000000);
            $content = new TranslationObject($this->translate,"message.hello3");
            $message = new Message($twakebot, "S", $streamGeneral, false, null, false, new \DateTime(date('Y-m-d H:i:s.' . $micro, $t)), $content, $this->string_cleaner->simplifyWithoutRemovingSpaces($content), null);
            $message->setFrontId("");
            $this->doctrine->persist($message);



            $board = new Board(new TranslationObject($this->translate,"general"),new TranslationObject($this->translate,"project.generalBoardDescription"), false);
            $this->doctrine->persist($board);

            $boardWorkspace = new LinkBoardWorkspace($workspace,$board,true,true);
            $this->doctrine->persist($boardWorkspace);

            $list1 = new ListOfTasks($board, new TranslationObject($this->translate, "project.discover_twake"), "f49d41", Array());
            $this->doctrine->persist($list1);
            $list2 = new ListOfTasks($board, new TranslationObject($this->translate, "project.project"), "00bb4d", Array());
            $this->doctrine->persist($list2);
            $this->doctrine->flush();

            $task1 = $this->taskService->createTask($list1, Array(), new TranslationObject($this->translate, "project.createTwakeWorkspace"), new TranslationObject($this->translate, "project.createTwakeWorkspaceDescription"), 0, 0, NULL, NULL, Array(), Array(), 1, Array(), "current");
            $task2 = $this->taskService->createTask($list1, Array(), new TranslationObject($this->translate, "project.discoverTwake"), new TranslationObject($this->translate, "project.discoverTwakeDescription"), 0, 0, NULL, NULL, Array(), Array(), 1, Array(), "todo");
            $task3 = $this->taskService->createTask($list1, Array(), new TranslationObject($this->translate, "project.signin"), "", 0, 0, NULL, NULL, Array(), Array(), 1, Array(), "done");
            $task4 = $this->taskService->createTask($list2, Array(), new TranslationObject($this->translate, "project.invitePartner"), new TranslationObject($this->translate, "project.invitePartnerDescription"), 0, 0, NULL, NULL, Array(), Array(), 1, Array(), "todo");


            $calendar1 = $this->calendarService->createCalendar($workspace->getId(), new TranslationObject($this->translate, "general"), "#3DE8A0", $currentUserId = null, $icsLink = null);
            $calendar2 = $this->calendarService->createCalendar($workspace->getId(), new TranslationObject($this->translate, "calendar.communication"), "#F0434B", $currentUserId = null, $icsLink = null);
            $calendar3 = $this->calendarService->createCalendar($workspace->getId(), new TranslationObject($this->translate, "calendar.customer"), "#017ABA", $currentUserId = null, $icsLink = null);

            $monday = strtotime("last Monday");
            $times = Array(
                Array(
                    "from" => strtotime("+14 hours",$monday),
                    "to" => strtotime("+16 hours",$monday),
                    "name" => "calendar.generalMeeting",
                    "calendar" => $calendar1->getId()
                ),
                Array(
                    "from" => strtotime("+1 day 10 hours 30 minutes",$monday),
                    "to" => strtotime("+1 day 12 hours",$monday),
                    "name" => "calendar.meetingDurant",
                    "calendar" => $calendar3->getId()
                ),
                Array(
                    "from" => strtotime("+1 day 12 hours 0 minutes",$monday),
                    "to" => strtotime("+1 day 12 hours",$monday),
                    "name" => "calendar.meetingNextAds",
                    "calendar" => $calendar2->getId()
                ),
                Array(
                    "from" => strtotime("+3 day 16 hours 0 minutes",$monday),
                    "to" => strtotime("+3 day 17 hours",$monday),
                    "name" => "calendar.meetingXu",
                    "calendar" => $calendar3->getId()
                ),
                Array(
                    "from" => strtotime("+4 day 8 hours 30 minutes",$monday),
                    "to" => strtotime("+4 day 12 hours",$monday),
                    "name" => "calendar.interview",
                    "calendar" => $calendar2->getId()
                ),
            );
            foreach ($times as $time){
                $eventJSON = Array(
                    "start" => new \DateTime(date('Y-m-d H:i:s.000000' , $time["from"])),
                    "end" => new \DateTime(date('Y-m-d H:i:s.000000' , $time["to"])),
                    "from" => $time["from"],
                    "to" => $time["to"],
                    "calendar" => $time["calendar"],
                    "id" => "",
                    "new" => false,
                    "participant" => Array(),
                    "color" => "E2333A",
                    "title" => strval(new TranslationObject($this->translate,$time["name"])),
                    "typeEvent"=> "event"
                );
                $event = $this->calendarEventService->createEvent($workspace->getId(), $time["calendar"], $eventJSON);
            }

            $dirTwake = $this->driveAdapteService->getFileSystem()->create($workspace, null, (new TranslationObject($this->translate, "drive.twake")) . "", "", true, false, null, $twakebotId, null);
            $fileRule = $this->driveAdapteService->getFileSystem()->create($workspace, $dirTwake->getId(), (new TranslationObject($this->translate, "drive.rules")) . "", (new TranslationObject($this->translate, "drive.ruleText")) . "", false, false, null, $twakebotId, null);
            $fileWelcome = $this->driveAdapteService->getFileSystem()->create($workspace, null, (new TranslationObject($this->translate, "drive.welcome")) . "", (new TranslationObject($this->translate, "drive.welcomeText")) . "", false, false, null, $twakebotId, null);


        }
        */


        //Create admin level
        $level = new WorkspaceLevel();
        $level->setWorkspace($workspace);
        $level->setLabel("Administrator");
        $level->setIsAdmin(true);
        $level->setIsDefault(true);

        $this->doctrine->persist($level);
        $this->doctrine->flush();



        //Add twake_bot
        $this->wms->addMember($workspace->getId(), $twakebotId, false, $level->getId());

        //init default apps
        $this->init($workspace);

        //Add user in workspace
        if ($userId != null) {
            $this->wms->addMember($workspace->getId(), $userId, false, $level->getId());
        }

        return $workspace;

    }

    public function duplicate($original_workspace_id, $name, $config, $currentUserId = null)
    {

        $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        $original_workspace = $workspaceRepository->find($original_workspace_id);

        if (!$original_workspace) {
            return false;
        }

        //Verify we have right to access this workspace
        if ($currentUserId == null
            || $this->wls->can($original_workspace_id, $currentUserId, "workspace:manage")
        ) {

            $groupId = $original_workspace->getGroup()->getId();

            $workspace = $this->create($name, $groupId, $currentUserId);
            $workspace->setIsNew(false);
            $this->doctrine->persist($workspace);

            if ($workspace && $workspace->getGroup() && !$workspace->getisArchived() && !$workspace->getisDeleted()) {

                $workspacelevelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
                $original_workspacelevels = $workspacelevelRepository->findBy(Array("workspace" => $original_workspace));
                $adminLevelId = 0;
                foreach ($original_workspacelevels as $level) {
                    if ($level->getisAdmin()) {
                        $adminLevelId = $level->getId();
                    }
                }

                //Duplicate Rights
                $old_levels_id_to_new_levels = Array();
                $workspacelevels = $workspacelevelRepository->findBy(Array("workspace" => $workspace));
                foreach ($workspacelevels as $level) {
                    if ($level->getisAdmin()) {
                        $old_levels_id_to_new_levels[$adminLevelId . ""] = $level;
                    }
                }
                if ($config["users"] == "all" || $config["rights"]) {
                    foreach ($original_workspacelevels as $level) {
                        if (!$level->getisAdmin()) {
                            $level = new WorkspaceLevel();
                            $level->setWorkspace($workspace);
                            $level->setLabel($level->getLabel());
                            $level->setIsAdmin($level->getisAdmin());
                            $level->setIsDefault($level->getisDefault());
                            $this->doctrine->persist($level);
                            $old_levels_id_to_new_levels[$level->getId() . ""] = $level;
                        }
                    }
                    $this->doctrine->flush();
                }

                //Duplicate users
                if ($config["users"] == "all" || $config["users"] == "admins") {
                    $members = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findBy(Array("workspace" => $original_workspace));
                    foreach ($members as $member) {
                        if ($member->getUser()->getId() != $currentUserId && ($config["users"] == "all" || ($config["users"] == "admins" && $member->getLevel()->getId() == $adminLevelId))) {

                            //Add user with good level
                            if (isset($old_levels_id_to_new_levels[$member->getLevel()->getId() . ""])) {
                                $level_id = $old_levels_id_to_new_levels[$member->getLevel()->getId() . ""]->getId();
                                $this->wms->addMember($workspace->getId(), $member->getUser()->getId(), false, $level_id);
                            }

                        }
                    }
                }

                //Duplicate applications
                $old_applications = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceApp")->findBy(Array("workspace" => $original_workspace));
                $new_applications = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceApp")->findBy(Array("workspace" => $workspace));
                foreach ($old_applications as $old_application) {
                    $found = false;
                    foreach ($new_applications as $new_application) {
                        if ($new_application->getGroupApp()->getId() == $old_application->getGroupApp()->getId()) {
                            $found = true;
                            break;
                        }
                    }
                    if (!$found) {
                        $app = new WorkspaceApp($workspace, $old_application->getGroupApp());
                        $this->doctrine->persist($app);
                    }
                }
                foreach ($new_applications as $new_application) {
                    $found = false;
                    foreach ($old_applications as $old_application) {
                        if ($new_application->getGroupApp()->getId() == $old_application->getGroupApp()->getId()) {
                            $found = true;
                            break;
                        }
                    }
                    if (!$found) {
                        $this->doctrine->remove($new_application);
                    }
                }
                $this->doctrine->flush();


                //Duplicate calendars
                if ($config["calendars"]) {
                    $old_calendarLinks = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findBy(Array("workspace" => $original_workspace));
                    foreach ($old_calendarLinks as $calendarLink) {
                        $calendar = $calendarLink->getCalendar();
                        if ($calendarLink->getOwner()) {
                            $new_calendar = new Calendar($calendar->getTitle(), $calendar->getColor(), $calendar->getIcsLink());
                            $this->doctrine->persist($new_calendar);
                            $new_link = new LinkCalendarWorkspace($workspace, $new_calendar, true);
                            $new_link->setApplication($calendarLink->getApplication());
                        } else {
                            $new_link = new LinkCalendarWorkspace($workspace, $calendar, false, $calendarLink->getCalendarRight());
                        }
                        $this->doctrine->persist($new_link);
                    }
                    $this->doctrine->flush();
                }


                //Duplicate channels
                if ($config["streams"]) {
                    $current_streams = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->findBy(Array("workspace" => $workspace));
                    foreach ($current_streams as $stream) {
                        $this->doctrine->remove($stream);
                    }
                    $old_streams = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->findBy(Array("workspace" => $original_workspace));
                    foreach ($old_streams as $stream) {
                        $new_stream = new Channel($workspace, $stream->getName(), $stream->getIsPrivate(), $stream->getDescription());
                        $new_stream->setType("stream");
                        $this->doctrine->persist($new_stream);

                        foreach ($stream->getMembers() as $member) {
                            $new_link = $new_stream->addMember($member);
                            $this->doctrine->persist($new_link);
                        }
                    }
                    $this->doctrine->flush();
                }

                //Duplicate labels
                if ($config["drive_labels"]) {
                    $old_labels = $this->doctrine->getRepository("TwakeDriveBundle:DriveLabel")->findBy(Array("workspace" => $original_workspace));
                    foreach ($old_labels as $label) {
                        $new_label = new DriveLabel($workspace, $label->getName(), $label->getColor());
                        $this->doctrine->persist($new_label);
                    }
                    $this->doctrine->flush();
                }

                //Duplicate boards
                if ($config["boards"]) {
                    $old_boardLinks = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findBy(Array("workspace" => $original_workspace));
                    foreach ($old_boardLinks as $boardLink) {
                        $board = $boardLink->getBoard();
                        if ($boardLink->getOwner()) {
                            $new_board = new Board($board->getTitle(), $board->getDescription(), $board->getisPrivate());
                            $new_board->setParticipants($board->getParticipants());
                            $this->doctrine->persist($new_board);

                            //Add lists
                            $listOfTasks = $this->doctrine->getRepository("TwakeProjectBundle:ListOfTasks")->findBy(Array("board" => $board));
                            foreach ($listOfTasks as $listOfTask) {
                                $new_listOfTask = new ListOfTasks($new_board, $listOfTask->getTitle(), $listOfTask->getColor(), $listOfTask->getUserIdToNotify());
                                $this->doctrine->persist($new_listOfTask);
                            }

                            $new_link = new LinkBoardWorkspace($workspace, $new_board, true);
                        } else {
                            $new_link = new LinkBoardWorkspace($workspace, $board, false, $boardLink->getBoardRight());
                        }
                        $this->doctrine->persist($new_link);
                    }
                    $this->doctrine->flush();
                }

            }

            return $workspace;

        }

        return false;

    }

    public function remove($groupId, $workspaceId, $currentUserId = null)
    {
        if ($currentUserId == null
            || ($this->wls->can($workspaceId, $currentUserId, "workspace:write")
                && count($this->wms->getMembers($workspaceId)) <= 1
            )
            || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "MANAGE_WORKSPACES")
        ) {
            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
            $workspace = $workspaceRepository->find($workspaceId);

            $this->wms->removeAllMember($workspaceId);

            $workspace->setis_deleted(true);

            $this->doctrine->persist($workspace);
            $this->doctrine->flush();

            return true;
        }
        return false;
    }

    public function changeName($workspaceId, $name, $currentUserId = null)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")
        ) {

            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
            $workspace = $workspaceRepository->find($workspaceId);

            $workspace->setName($name);

            $uniquename = $this->string_cleaner->simplify($name);
            $uniquenameIncremented = $uniquename . "-" . substr(md5(date("U") . rand()), 0, 10);

            $workspace->setUniqueName($uniquenameIncremented);
            $this->doctrine->persist($workspace);
            $this->doctrine->flush();

            $datatopush = Array(
                "type" => "CHANGE_WORKSPACE",
                "data" => Array(
                    "workspaceId" => $workspace->getId(),
                )
            );
            $this->pusher->push($datatopush, "group/" . $workspace->getId());
            $this->workspacesActivities->recordActivity($workspace,$currentUserId,"workspace","workspace.activity.workspace.rename","TwakeWorkspacesBundle:Workspace", $workspaceId);

            return true;
        }

        return false;
    }

    public function changeLogo($workspaceId, $logo, $currentUserId = null, $uploader = null)
    {
        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")
        ) {

            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
            $workspace = $workspaceRepository->find($workspaceId);

            if ($workspace->getLogo()) {
                if ($uploader) {
                    $uploader->removeFile($workspace->getLogo(), false);
                } else {
                    $workspace->getLogo()->deleteFromDisk();
                }
                $this->doctrine->remove($workspace->getLogo());
            }
            $workspace->setLogo($logo);

            $this->doctrine->persist($workspace);
            $this->doctrine->flush();

            $datatopush = Array(
                "type" => "CHANGE_WORKSPACE",
                "data" => Array(
                    "workspaceId" => $workspace->getId(),
                )
            );
            $this->pusher->push($datatopush, "group/" . $workspace->getId());
            $this->workspacesActivities->recordActivity($workspace,$currentUserId,"workspace","workspace.activity.workspace.change_logo","TwakeWorkspacesBundle:Workspace", $workspaceId);

            return true;
        }

        return false;
    }

    public function changeWallpaper($workspaceId, $wallpaper, $color = null, $currentUserId = null, $uploader = null)
    {

        if ($color == null) {
            $color = "#7E7A6D";
        }

        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")
        ) {

            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
            $workspace = $workspaceRepository->find($workspaceId);

            if ($workspace->getWallpaper()) {
                if ($uploader) {
                    $uploader->removeFile($workspace->getWallpaper(), false);
                } else {
                    $workspace->getWallpaper()->deleteFromDisk();
                }
                $this->doctrine->remove($workspace->getWallpaper());
            }
            $workspace->setWallpaper($wallpaper);
            $workspace->setColor($color);

            $this->doctrine->persist($workspace);
            $this->doctrine->flush();

            $datatopush = Array(
                "type" => "CHANGE_WORKSPACE",
                "data" => Array(
                    "workspaceId" => $workspace->getId(),
                )
            );
            $this->workspacesActivities->recordActivity($workspace,$currentUserId,"workspace","workspace.activity.workspace.change_wallpaper","TwakeWorkspacesBundle:Workspace", $workspaceId);
            $this->pusher->push($datatopush, "group/" . $workspace->getId());

            return true;
        }

        return false;
    }

    public function get($workspaceId, $currentUserId = null)
    {

        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "")
        ) {
            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
            $workspace = $workspaceRepository->find($workspaceId);

            return $workspace;
        }

        return false;
    }

    public function getWorkspaceByName($string, $currentUserId = null)
    {

        $arr = explode("@", $string, 2);

        if (count($arr) != 2){
            return false;
        }

        $groupName = $arr[0];
        $workspaceName = $arr[1];


        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $group = $groupRepository->findOneBy(Array("name" => $groupName));

        if ($group == null) {
            return false;
        }

        $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        $workspace = $workspaceRepository->findOneBy(Array("uniquename" => $workspaceName, "group" => $group, "is_deleted" => 0));

        if($workspace != null){
            return $workspace->getAsArray();
        }else {
            return false;
        }

    }

    public function init(Workspace $workspace)
    {
        $groupappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");
        $grouppaceapps = $groupappsRepository->findBy(Array("group" => $workspace->getGroup()));

        $workspaceappRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceApp");
        $workspaceapps = $workspaceappRepository->findBy(Array("workspace" => $workspace));

        if (count($grouppaceapps) != 0 && count($workspaceapps) == 0) {

            foreach ($grouppaceapps as $ga) {
                if ($ga->getWorkspaceDefault()) {
                    $workspaceapp = new WorkspaceApp($workspace, $ga);
                    $this->doctrine->persist($workspaceapp);
                }
            }

            $this->doctrine->flush();
        }

        if ($workspace->getMemberCount() == 0) {

            $members = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findBy(Array("workspace" => $workspace));
            $workspace->setMemberCount(count($members));
            $this->doctrine->persist($workspace);

            $this->doctrine->flush();
        }

        //Déjà initialisé
        return false;
    }


    public function archive($groupId, $workspaceId, $currentUserId = null){

        if ($currentUserId == null
            || ($this->wls->can($workspaceId, $currentUserId, "workspace:write")
                && count($this->wms->getMembers($workspaceId)) <= 1
            )
            || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "MANAGE_WORKSPACES")
        ) {
            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
            $workspace = $workspaceRepository->find($workspaceId);

            $isArchived = $workspace->getisArchived();
            $is_deleted = $workspace->getis_deleted();

            if ($is_deleted == false && $isArchived == false) {
                $workspace->setIsArchived(true);
                $this->workspacesActivities->recordActivity($workspace,$currentUserId,"workspace","workspace.activity.workspace.archive","TwakeWorkspacesBundle:Workspace", $workspaceId);
            }

            $this->doctrine->persist($workspace);
            $this->doctrine->flush();

            $datatopush = Array(
                "type" => "CHANGE_WORKSPACE",
                "data" => Array(
                    "workspaceId" => $workspace->getId(),
                )
            );
            $this->pusher->push($datatopush, "group/" . $workspace->getId());

            return true;
        }
        return false;

    }

    public function unarchive($groupId, $workspaceId, $currentUserId = null){

        if ($currentUserId == null
            || ($this->wls->can($workspaceId, $currentUserId, "workspace:write")
                && count($this->wms->getMembers($workspaceId)) <= 1
            )
            || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "MANAGE_WORKSPACES")
        ) {
            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
            $workspace = $workspaceRepository->find($workspaceId);

            $isArchived = $workspace->getisArchived();
            $is_deleted = $workspace->getis_deleted();

            if ($is_deleted == false && $isArchived == true) {
                $workspace->setIsArchived(false);
                $this->workspacesActivities->recordActivity($workspace,$currentUserId,"workspace","workspace.activity.workspace.unarchive","TwakeWorkspacesBundle:Workspace", $workspaceId);
            }

            $this->doctrine->persist($workspace);
            $this->doctrine->flush();

            $datatopush = Array(
                "type" => "CHANGE_WORKSPACE",
                "data" => Array(
                    "workspaceId" => $workspace->getId(),
                )
            );
            $this->pusher->push($datatopush, "group/" . $workspace->getId());

            return true;
        }
        return false;

    }


    public function hideOrUnhideWorkspace($workspaceId, $currentUserId = null, $wanted_value=null)
    {
        if ($currentUserId != null) {
            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
            $workspace = $workspaceRepository->findOneBy(Array("id" => $workspaceId));

            $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
            $currentUser = $userRepository->findOneBy(Array("id" => $currentUserId));

            $workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
            $workspaceUser = $workspaceUserRepository->findOneBy(Array("workspace" => $workspace, "user" => $currentUser));

            if($wanted_value === null) {
                $ishidden = $workspaceUser->getisHidden();
                $workspaceUser->setisHidden(!$ishidden);
            }
            $workspaceUser->setisHidden($wanted_value);

            $this->doctrine->persist($workspaceUser);
            $this->doctrine->flush();

            if ($currentUserId) {
                $datatopush = Array(
                    "type" => "USER_WORKSPACES",
                    "data" => Array(
                        "workspaceId" => $workspace->getId(),
                    )
                );
                $this->pusher->push($datatopush, "notifications/" . $currentUserId);
            }

            return true;
        }
        return false;
    }

    public function haveNotificationsOrNotWorkspace($workspaceId, $currentUserId = null, $wanted_value = null){
        if ($currentUserId != null) {
            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
            $workspace = $workspaceRepository->findOneBy(Array("id" => $workspaceId));

            $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
            $currentUser = $userRepository->findOneBy(Array("id" => $currentUserId));

            $workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
            $workspaceUser = $workspaceUserRepository->findOneBy(Array("workspace" => $workspace, "user" => $currentUser));

            if($wanted_value === null) {
                $hasnotifications = $workspaceUser->getHasNotifications();
                $workspaceUser->setHasNotifications(!$hasnotifications);
            }
            $workspaceUser->setHasNotifications($wanted_value);

            $notificationPreference = $currentUser->getNotificationPreference();
            $disabled_ws = $notificationPreference["disabled_workspaces"];
            if (in_array($workspaceId . "", $disabled_ws) && $workspaceUser->getHasNotifications()) {
                $position = array_search($workspaceId,$disabled_ws);
                unset($disabled_ws[$position]);
            }

            if (!in_array($workspaceId . "", $disabled_ws) && !$workspaceUser->getHasNotifications()) {
                array_push($disabled_ws, $workspaceId);
            }

            $this->doctrine->persist($workspaceUser);
            $this->doctrine->flush();
            return true;
        }
        return false;
    }

    public function favoriteOrUnfavoriteWorkspace($workspaceId, $currentUserId = null){
        $result = Array ();

        if ($currentUserId != null) {
            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
            $workspace = $workspaceRepository->findOneBy(Array("id" => $workspaceId));

            $userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
            $currentUser = $userRepository->findOneBy(Array("id" => $currentUserId));

            $workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
            $workspaceUser = $workspaceUserRepository->findOneBy(Array("workspace" => $workspace, "user" => $currentUser));

            $isfavorite = $workspaceUser->getisFavorite();
            $workspaceUser->setisFavorite(!$isfavorite);
            $this->doctrine->persist($workspaceUser);

            $this->doctrine->flush();


            if ($currentUserId) {
                $datatopush = Array(
                    "type" => "USER_WORKSPACES",
                    "data" => Array(
                        "workspaceId" => $workspace->getId(),
                    )
                );
                $this->pusher->push($datatopush, "notifications/" . $currentUserId);
            }

            $result["answer"] = true;
            $result["isfavorite"] = $workspaceUser->getisFavorite();

            return $result;
        }
        $result["answer"] = false;
        return $result;
    }

    public function setIsNew($value, $workspaceId, $currentUserId = null){
        if ($currentUserId != null) {
            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
            $workspace = $workspaceRepository->findOneBy(Array("id" =>$workspaceId));

            if($workspace != null){

                $workspace->setisNew($value);
                $this->doctrine->persist($workspace);
                $this->doctrine->flush();

                return true;
            }
            return false;
        }
        return false;
    }

}