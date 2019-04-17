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
        $stopWords = Array(" ");
        //error_log(print_r(getcwd(),true));
        $content=file_get_contents("testfile.txt");
        //error_log(print_r($content,true));
        //error_log(print_r($content,true));

        //$words = array_count_values(str_word_count(strtolower($content), 1));
        $content = str_replace(array("\\'", "'")," ",$content);
        $words = str_word_count(strtolower($content),1, 'ÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸÆŒàâäçéèêëîïôöùûüÿæœ');
        $totalwords=1;

        $keywords=Array();

        foreach ($words as $value){
            if (strlen($value) > 3 && is_numeric($value)==false) {
                if ($totalwords < 101) //we define the weight of word trough the text
                    $weight = 5;
                elseif ($totalwords < 301)
                    $weight = 3;
                else
                    $weight = 1;
                if(!($keywords[$value])){ //if the word is not in our table
                    if (substr($value, -1) == "s") { //we check if it's a plural
                        $maybesinglar = substr($value, 0, strlen($value) - 1);
                        if ($keywords[$maybesinglar]) { // we check if their is already a singular for this word
                            $keywords[$maybesinglar] += $weight+max(strlen($maybesinglar)-4,0)*1; //if we find a singular we add the singular version of the word instead of the plural
                        }
                        else { // if not we add the new words or it's the first time we saw the word so we need to add it
                            //error_log(print_r($maybesinglar,true));
                            $keywords[$value] = $weight +max(strlen($value)-4,0)*1;
                        }
                    }
                    else {
                        $keywords[$value] = $weight+max(strlen($value)-4,0)*1; // we add the new word which is not a plural or it the first time we saw it
                    }
                }
                else{ //if the word is in the table
                    $keywords[$value] += $weight+max(strlen($value)-4,0)*1; // we adjust his weight in the table
                }
                $totalwords++; //we add our total of word to alter the weight of futur word.
            }
        }

        error_log(print_r($totalwords,true));

        //$keywords=array_count_values($keywords);
        arsort($keywords); // Sort based on frequency

        $fin = array_slice($keywords, 0, 10);
        error_log(print_r($fin,true));
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