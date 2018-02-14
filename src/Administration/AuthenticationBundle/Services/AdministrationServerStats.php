<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 14/02/18
 * Time: 10:34
 */

namespace Administration\AuthenticationBundle\Services;


class AdministrationServerStats
{
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
        //return $words;
        return $words[20]."-" . $words[21]."-".$words[22]."-".$words[23]."-".$words[24]."-".$words[25]."-".$words[26]."-".$words[27]."-".$words[28]."-".$words[29]."-".$words[30];
    }

}