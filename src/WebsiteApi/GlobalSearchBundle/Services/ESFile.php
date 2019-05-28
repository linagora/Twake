<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

use WebsiteApi\CoreBundle\Services\StringCleaner;
use WebsiteApi\DriveBundle\Entity\DriveFile;

class ESFile
{
    private $doctrine;

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function index($document){
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
///
        $content = (new \Spatie\PdfToText\Pdf())
                ->setPdf($document)
                ->text();

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
            $value = strtolower($value);
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
        $file = new DriveFile("d975075e-6028-11e9-b206-0242ac120005","d975075e-6028-11e9-b206-0242ac120005");
        $file->setName(explode(".", $document)[0]);
       // $keywords_score=$this->update_keyword($keywords_score,explode(".", $document)[0]); //change this with document title
        $file->setExtension("PDF");
        $file->setContentKeywords($keywords_score);
        $this->doctrine->persist($file);
        //var_dump($file->getIndexationArray());

        $this->doctrine->flush();

    }

    public function search($termslist,$workspace){ //rajouter le must sur les workspace id

        $terms = Array();

        foreach($termslist as $term){
            $st = new StringCleaner();
            $term= $st->simplifyInArray($term);
            $terms[] = Array(
                "bool" => Array(
                    "filter" => Array(
                        "regexp" => Array(
                            "keywords.word" => ".*".$term.".*"
                        )
                    )
                )
            );
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
            "repository" => "TwakeDriveBundle:DriveFile",
            "index" => "drive_file",
            "query" => Array(
                "bool" => Array(
                    "must" => Array(
                        "match_phrase" => Array(
                            "workspace_id" => $workspace["id"]
                        )
                    ),
                    "should" => Array(
                        $nested
                    ),
                    "minimum_should_match" => 1
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

        //var_dump(json_encode($options));
        //var_dump($workspace["id"]);
        $files = $this->doctrine->es_search($options);
        $files_final=Array();
        //var_dump(json_encode($options));
        foreach ($files as $file){
            //var_dump($file->getAsArray());
            $files_final[]= Array($file[0]->getAsArray(),$file[1][0]);
        }
        //var_dump($files_final);
        return $files_final;
    }

//    public static function cmp($file1, $file2)
//    {
//        var_dump($file1[1]);
//        var_dump($file2[1]);
//        var_dump(" ");
//        if ($file1[1] == $file2[1]) {
//            return 0;
//        }
//        return ($file1[1] > $file2[1]) ? -1 : 1;
//    }

    public function TestSearch()
    {

       //$this->index("civ.pdf");
        //$file= $this->doctrine->getRepository("TwakeDriveBundle:Drivefile")->findOneBy(Array("id" => "f155d92a-6cdf-11e9-9077-0242ac130002"));

//        $words=Array("civ");
//        $this->search($words);
    }

}