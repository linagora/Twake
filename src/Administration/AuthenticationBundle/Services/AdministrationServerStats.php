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

    public function saveRamUsage()
    {

        $free = shell_exec('free');
        $free = (string)trim($free);
        $free_arr = explode("\n", $free);
        $mem = explode(" ", $free_arr[1]);
        $mem = array_filter($mem);
        $mem = array_merge($mem);
        $memory_usage = $mem[2]/$mem[1]*100;

        $em = $this->doctrine;

        $serverStat = new ServerRamStats();
        $serverStat-> setDateSave(new \DateTime("now"));
        $serverStat->setUsed($memory_usage);

        $em->persist($serverStat);
        $em->flush();

        return "done";
    }


    public function getCpuUsage()
    {
        $cpuId = $this->doctrine->getRepository("AdministrationAuthenticationBundle:ServerCpuStats")->getLastId();
        return $this->doctrine->getRepository("AdministrationAuthenticationBundle:ServerCpuStats")->findOneBy(Array("id" => $cpuId))->getAsArray();
    }

    public function getRamUsage()
    {
        $ramId = $this->doctrine->getRepository("AdministrationAuthenticationBundle:ServerRamStats")->getLastId();
        return $this->doctrine->getRepository("AdministrationAuthenticationBundle:ServerRamStats")->findOneBy(Array("id" => $ramId))->getAsArray();
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