<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 14/02/18
 * Time: 10:34
 */

namespace Administration\AuthenticationBundle\Services;


use Administration\AuthenticationBundle\Entity\ServerCpuStats;
use Administration\AuthenticationBundle\Entity\ServerRamStats;
use Administration\AuthenticationBundle\Entity\ServerUsersStats;
use phpDocumentor\Reflection\Types\Array_;

class AdministrationServerStats
{
    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    private function reformateData($str)
    {
        return floatval(str_replace(',','.',$str));
    }

    public function getStorageSpace()
    {
        $output = shell_exec('df /');
        $words = preg_split("/\s+/",$output);
        $taille = count($words);
        $total = $words[$taille - 6];
        $utilise = $words[$taille - 5];

        $resultat["total"] = $total;
        $resultat["utilise"] = $utilise;

        return $resultat;
    }

    public function saveCpuUsage()
    {
        $output = shell_exec('mpstat');
        $words = preg_split("/\s+/",$output);
        $cpu = $words[20];
        $usr = $words[21];
        $nice = $words[22];
        $sys = $words[23];
        $iowait = $words[24];
        $irq = $words[25];
        $soft = $words[26];
        $steal = $words[27];
        $guest = $words[28];
        $gnice = $words[29];
        $idle = $words[30];

        $em = $this->doctrine;

        $serverStat = new ServerCpuStats();
        $serverStat->setDateSave(new \DateTime("now"));
        $serverStat->setCpu($cpu);
        $serverStat->setUsr($this->reformateData($usr));
        $serverStat->setNice($this->reformateData($nice));
        $serverStat->setSys($this->reformateData($sys));
        $serverStat->setIowait($this->reformateData($iowait));
        $serverStat->setIrq($this->reformateData($irq));
        $serverStat->setSoft($this->reformateData($soft));
        $serverStat->setSteal($this->reformateData($steal));
        $serverStat->setGuest($this->reformateData($guest));
        $serverStat->setGnice($this->reformateData($gnice));
        $serverStat->setIdle($this->reformateData($idle));

        $em->persist($serverStat);
        $em->flush();

        return "done";
    }
    public function saveUsersConnected()
    {

        $req1 = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser")
            ->createQueryBuilder('U')
            ->select('count(distinct U.user)')
            ->where('U.didConnectToday = 1');
        $connected = $req1->getQuery()->getSingleScalarResult();

        $req2 = $this->doctrine->getRepository("TwakeUsersBundle:User")
            ->createQueryBuilder('U')
            ->select('count(U)');
        $accounts = $req2->getQuery()->getSingleScalarResult();

        $req3 = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarEvent")
            ->createQueryBuilder('U')
            ->select('count(U)');
        $eventnumber = $req3->getQuery()->getSingleScalarResult();

        $req4 = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
            ->createQueryBuilder('U')
            ->select('count(U)');
        $filesnumber = $req4->getQuery()->getSingleScalarResult();

        $req5 = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")
            ->createQueryBuilder('U')
            ->select('count(U)');
        $messagesnumber = $req5->getQuery()->getSingleScalarResult();

        $req6 = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")
            ->createQueryBuilder('U')
            ->select('count(U)');
        $tasksnumber = $req6->getQuery()->getSingleScalarResult();

        $em = $this->doctrine;

        $serverStat = new ServerUsersStats();
        $serverStat->setDateSave(new \DateTime("now"));
        $serverStat->setConnected($connected);
        $serverStat->setAccounts($accounts);
        $serverStat->setEvent($eventnumber);
        $serverStat->setFiles($filesnumber);
        $serverStat->setMessages($messagesnumber);
        $serverStat->setTasks($tasksnumber);

        $em->persist($serverStat);
        $em->flush();

        return "done";
    }

    public function getUsersConnected($limit = 0, $granularity = "daily")
    {
        $repo = $this->doctrine->getRepository("AdministrationAuthenticationBundle:ServerUsersStats");
        $_list = $repo->findBy(Array(), Array("dateSave" => "DESC"), $limit * 24);
        $list = Array();
        $day = 0;
        $currentValues = Array();
        foreach ($_list as $el) {
            if ($granularity == "daily") {
                $elDay = date("z", $el->getDateSave()->getTimestamp());
            } else {
                $elDay = date("zH", $el->getDateSave()->getTimestamp());
            }
            if ($day == 0) {
                $day = $elDay;
            }
            if ($elDay != $day) {
                $day = $elDay;
                $list[] = $currentValues;
                $currentValues = Array();
            }
            if (!isset($currentValues["accounts"]) || $currentValues["accounts"] < $el->getAsArray()["accounts"]) {
                $currentValues["accounts"] = $el->getAsArray()["accounts"];
            }
            if (!isset($currentValues["connected"]) || $currentValues["connected"] < $el->getAsArray()["connected"]) {
                $currentValues["connected"] = $el->getAsArray()["connected"];
            }
            if (!isset($currentValues["event"]) || $currentValues["event"] < $el->getAsArray()["event"]) {
                $currentValues["event"] = $el->getAsArray()["event"];
            }
            if (!isset($currentValues["files"]) || $currentValues["files"] < $el->getAsArray()["files"]) {
                $currentValues["files"] = $el->getAsArray()["files"];
            }
            if (!isset($currentValues["messages"]) || $currentValues["messages"] < $el->getAsArray()["messages"]) {
                $currentValues["messages"] = $el->getAsArray()["messages"];
            }
            if (!isset($currentValues["tasks"]) || $currentValues["tasks"] < $el->getAsArray()["tasks"]) {
                $currentValues["tasks"] = $el->getAsArray()["tasks"];
            }
            $currentValues["datesave"] = $el->getAsArray()["datesave"];
        }

        return $list;
    }

    public function getNumberFiles()
    {
        $req1 = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
            ->createQueryBuilder('F')
            ->select('count(F)');
        return $req1->getQuery()->getSingleScalarResult();
    }

    public function getNumberTasks()
    {
        $req1 = $this->doctrine->getRepository("TwakeProjectBundle:BoardTask")
            ->createQueryBuilder('F')
            ->select('count(F)');
        return $req1->getQuery()->getSingleScalarResult();
    }

    public function getNumberMessages()
    {
        $req1 = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")
            ->createQueryBuilder('F')
            ->select('count(F)');
        return $req1->getQuery()->getSingleScalarResult();
    }

    public function getNumberEvents()
    {
        $req1 = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarEvent")
            ->createQueryBuilder('F')
            ->select('count(F)');
        return $req1->getQuery()->getSingleScalarResult();
    }

    public function getAllErrors()
    {
        $ids = $this->doctrine->getRepository("AdministrationAuthenticationBundle:Errors")->findAllIdOrderByOcc();
        foreach ($ids as $id)
            $errors[] = $this->doctrine->getRepository("AdministrationAuthenticationBundle:Errors")->findOneBy(Array("id" => $id));
        return $errors;
    }

    public function getCpuUsage()
    {
        $cpuId = $this->doctrine->getRepository("AdministrationAuthenticationBundle:ServerCpuStats")->getLastId();
        return $this->doctrine->getRepository("AdministrationAuthenticationBundle:ServerCpuStats")->findOneBy(Array("id" => $cpuId))->getAsArray();
    }

    public function getRamUsage()
    {

        $free = shell_exec('free');
        $free = (string)trim($free);
        $free_arr = explode("\n", $free);
        $mem = explode(" ", $free_arr[1]);
        $mem = array_filter($mem);
        $mem = array_merge($mem);
        $memory_usage = $mem[2] / $mem[1] * 100;

        return $memory_usage;
    }


    public function getTotalRam(){
        $free = shell_exec('free');
        $used = 0;
        if ($free) {
            $free = (string)trim($free);
            $free_arr = explode("\n", $free);
            $mem = explode(" ", $free_arr[1]);
            $mem = array_filter($mem);
            $mem = array_merge($mem);
            $used = $mem[1];
        }
        return $used / 1024;
    }

    public function getAllCpuUsage($startdate, $enddate)
    {
        return $this->doctrine->getRepository("AdministrationAuthenticationBundle:ServerCpuStats")->getAllCpuData($startdate, $enddate);
    }

    public function getAllRamUsage($startdate, $enddate)
    {
        return $this->doctrine->getRepository("AdministrationAuthenticationBundle:ServerRamStats")->getAllRamData($startdate, $enddate);
    }
}
