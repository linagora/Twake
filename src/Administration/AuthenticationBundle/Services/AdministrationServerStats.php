<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 14/02/18
 * Time: 10:34
 */

namespace Administration\AuthenticationBundle\Services;


use Administration\AuthenticationBundle\Entity\ServerCpuStats;

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
        $output = shell_exec('df -h /');
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

}