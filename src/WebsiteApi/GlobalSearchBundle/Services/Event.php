<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

class Event
{
    private $doctrine;

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function indexfile($document){
        //need the string with the name of the file
        //check the extension of the file
//        $finfo = finfo_open(FILEINFO_MIME_TYPE);
////        $filetype = finfo_file($finfo, $document);
////
////        if($ext === 'txt')
////            $content = file_get_contents($document);
////        elseif($ext === 'pdf')
////            $content = (new \Spatie\PdfToText\Pdf())
////                ->setPdf($document)
////                ->text();

        $content = str_replace(array("\\'", "'")," ",$content);
        $size = substr_count($content, ' ');

        $words = str_word_count(strtolower($content),1, 'ÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸÆŒàâäçéèêëîïôöùûüÿæœ');
        $totalwords=1;

        $keywords=Array();

        $regex = <<<'END'
/
 (
   (?: [\x00-\x7F]                 #:00d2f4aa-605b-11e9-b23e-0242ac120005 single-byte sequences   0xxxxxxx
   |   [\xC0-\xDF][\x80-\xBF]      #:00d2f4aa-605b-11e9-b23e-0242ac120005 double-byte sequences   110xxxxx 10xxxxxx
   |   [\xE0-\xEF][\x80-\xBF]{2}   #:00d2f4aa-605b-11e9-b23e-0242ac120005 triple-byte sequences   1110xxxx 10xxxxxx * 2
   |   [\xF0-\xF7][\x80-\xBF]{3}   #:00d2f4aa-605b-11e9-b23e-0242ac120005 quadruple-byte sequence 11110xxx 10xxxxxx * 3
   ){1,100}                        #:00d2f4aa-605b-11e9-b23e-0242ac120005 ...one or more times
 )
| .                                 #:00d2f4aa-605b-11e9-b23e-0242ac120005 anything else
/x
END;

        foreach ($words as $value){
            $value = preg_replace($regex, '$1', $value);
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
                            $keywords[$maybesinglar] += $weight+max(strlen($maybesinglar)-4,0)*2; //if we find a singular we add the singular version of the word instead of the plural
                        }
                        else { // if not we add the new words or it's the first time we saw the word so we need to add it
                            $keywords[$value] = $weight +max(strlen($value)-4,0)*2;
                        }
                    }
                    else {
                        $keywords[$value] = $weight+max(strlen($value)-4,0)*2; // we add the new word which is not a plural or it the first time we saw it
                    }
                }
                else{ //if the word is in the table
                    $keywords[$value] += $weight+max(strlen($value)-4,0)*2; // we adjust his weight in the table
                }
            }
            $totalwords++; //we add our total of word to alter the weight of futur word.
        }

        arsort($keywords); // Sort based on frequency

        $keywords_raw = array_slice($keywords, 0, 10);
        $max = array_values(array_slice($keywords, 0, 1))[0];

        $keywords_score= Array();
        foreach ($keywords_raw as $key => $score) {
            $keywords_raw[$key] = ($score/$max);
        }

        foreach ($keywords_raw as $key => $score) {
            $keywords_score[] = Array(
                "word" => $key,
                "score" => $keywords_raw[$key]
            );
        }

        $keywords_score=$this->update_keyword($keywords_score,"billet de train"); //change this with document title
        var_dump($keywords_score);

        $options = Array(
            "index" => "file",
            "data" => Array(
                "id" => "idtrain",
                "type"=> "txt",
                "name" => "billet de train",
                "creation_date"=> "2091-04-23",
                "keywords"=> $keywords_score
            )
        );

        var_dump(json_encode($options,JSON_PRETTY_PRINT));

        $this->doctrine->es_put_perso($options);

    }

    public function search_file($termslist){
        $terms = Array();
        foreach($termslist as $term){
            $terms[] = Array(
                "match_phrase" => Array(
                    "keywords.word" => $term
                ));
        }

        $nested  = Array(
            "nested" => Array(
                "path" => "keywords",
                "score_mode" => "avg",
                "query" => Array(
                    "bool" => Array(
                        "should" => $terms
                    )
                )
            )
        );

        $options = Array(
            //"repository" => "TwakeGlobalSearchBundle:User",
            "index" => "file",
            "query" => Array(
                "bool" => Array(
                    "should" => Array(
                        $nested
                    )
                )
            ),
            "sort" => Array(
                "keywords.score" => Array(
                    "mode" => "sum",
                    "order" => "desc",
                    "nested" => Array(
                        "path" => "keywords",
                        "filter" => Array(
                            "bool" => Array(
                                "should" => $terms
                            )
                        )
                    )
                )
            )
        );

        $result = [];
//        foreach ($objects as $object) {
//            $result[] = $object->getAsArray();
//        }
        $this->doctrine->es_search_perso($options);
    }

    public function update_keyword($keywords,$titre){
        $keywords[] = Array(
            "word" => $titre,
            "score" => 5.0
        );
        return $keywords;
    }

    public function TestSearch()
    {

        $terms = Array();
        $terms[] = Array(
            "match_phrase" => Array(
                "keywords.word" => "combat"
            ));
        $terms[] = Array(
            "match_phrase" => Array(
                "keywords.word" => "unité"
            ));
        $terms[] = Array(
            "match_phrase" => Array(
                "keywords.word" => "toulouse"
            ));
        $terms[] = Array(
            "match_phrase" => Array(
                "keywords.word" => "twake"
            ));
        $terms[] = Array(
            "match_phrase" => Array(
                "keywords.word" => "opération"
            ));
        $terms[] = Array(
            "match_phrase" => Array(
                "keywords.word" => "billet de train"
            ));

        $nested  = Array(
            "nested" => Array(
                "path" => "keywords",
                "score_mode" => "avg",
                "query" => Array(
                    "bool" => Array(
                        "should" => $terms
                    )
                )
            )
        );

        $options = Array(
            //"repository" => "TwakeGlobalSearchBundle:User",
            "index" => "file",
            "query" => Array(
                "bool" => Array(
                    "must" => Array(
                        Array(
                            "match_phrase" => Array(
                                "name" => "billet de train"
                            )),
                        $nested
                    )
                )
            ),
            "sort" => Array(
                "keywords.score" => Array(
                    "mode" => "sum",
                    "order" => "desc",
                    "nested" => Array(
                        "path" => "keywords",
                        "filter" => Array(
                            "bool" => Array(
                                "should" => $terms
                            )
                        )
                    )
                )
            )
        );
       //var_dump(json_encode($options,JSON_PRETTY_PRINT));
//
//        $result = [];
////        foreach ($objects as $object) {
////            $result[] = $object->getAsArray();
////        }
           $this->doctrine->es_search_perso($options);
//        return $result;
    }

}