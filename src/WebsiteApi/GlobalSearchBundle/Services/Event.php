<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

class Event
{
    private $doctrine;

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function TestSearch()
    {
       // error_log(print_r(getcwd(),true));
        //error_log(print_r($pages,true));


        //error_log(print_r($text,true));jh
        //$text = preg_replace('~\b[a-z]{1,3}\b\s*~', '', $text);
        //$text = preg_replace('/[0-9]+/', '', $text);
        $content = (new \Spatie\PdfToText\Pdf())
            ->setPdf('civ.pdf')
            ->text();
        $content = iconv(mb_detect_encoding($content, mb_detect_order(), true), "ISO-8859-1//IGNORE", $content);
        $content = iconv("ISO-8859-1","UTF-8",$content);
        $content = preg_replace('~\b[a-z]{1,3}\b\s*~', '', $content);
        //error_log(print_r($content,true));
        $size = substr_count($content, ' ');
        error_log(print_r($size,true));
        //error_log(print_r(sizeof($words),true));

        //$words = array_count_values(str_word_count(strtolower($content), 1));
        $content = str_replace(array("\\'", "'")," ",$content);
        $words = str_word_count(strtolower($content),1, 'ÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸÆŒàâäçéèêëîïôöùûüÿæœ');
        //error_log(print_r(sizeof($words),true));
        //error_log(print_r($words,true));
        $totalwords=1;

        $keywords=Array();

        foreach ($words as $value){
            if (strlen($value) > 3 && is_numeric($value)==false) {
                if ($totalwords < floor($size*0.20)) //we define the weight of word trough the text
                    $weight = 20;
                elseif ($totalwords > floor($size*80))
                    $weight = 20;
                else
                    $weight = 3;
                if(!($keywords[$value]) || substr($value, -1) == "s"){ //if the word is not in our table
                    if (substr($value, -1) == "s") { //we check if it's a plural
                        $maybesinglar = substr($value, 0, strlen($value) - 1);
                        if ($keywords[$maybesinglar]) { // we check if their is already a singular for this word
                            $keywords[$maybesinglar] += $weight+max(strlen($maybesinglar)-4,0)*1; //if we find a singular we add the singular version of the word instead of the plural
                        }
                        else { // if not we add the new words or it's the first time we saw the word so we need to add it
                            //error_log(print_r($maybesinglar,true));
                            $keywords[$value] = $weight +max(strlen($value)-4,0)*1.5;
                        }
                    }
                    else {
                        $keywords[$value] = $weight+max(strlen($value)-4,0)*1.5; // we add the new word which is not a plural or it the first time we saw it
                    }
                }
                else{ //if the word is in the table
                    $keywords[$value] += $weight+max(strlen($value)-4,0)*1.5; // we adjust his weight in the table
                }
            }
            $totalwords++; //we add our total of word to alter the weight of futur word.
        }

        error_log(print_r($totalwords,true));

        //$keywords=array_count_values($keywords);
        arsort($keywords); // Sort based on frequency
        error_log(print_r($keywords,true));

        //$fin = array_slice($keywords, 0, 20);
       // error_log(print_r($fin,true));
        echo("\n");


//        $options = Array(
//            //"repository" => "TwakeGlobalSearchBundle:User",
//            "index" => "store",
//            "query" => Array(
//                "match" => Array(
//                    "email" => "bibi@gmail.fr"
//                )
//            )
//        );
//
//
//        //$objects = $this->doctrine->es_search($options);
//        $objects = $this->doctrine->es_search_perso($options);

        $result = [];
//        foreach ($objects as $object) {
//            $result[] = $object->getAsArray();
//        }
        return $result;
    }

}