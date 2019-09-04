<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

use WebsiteApi\CoreBundle\Services\StringCleaner;
use WebsiteApi\DriveBundle\Entity\DriveFile;

class ESFile
{
    private $doctrine;
    private $list_files = Array("files" => Array(), "scroll_id" => "");

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function index(){
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
///

//        $content = (new \Spatie\PdfToText\Pdf())
//                ->setPdf($document)
//                ->text();
        $document = "stage.txt";
        $content = file_get_contents($document);
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

        $keywords_raw = array_slice($keywords, 0, 100);
        $max = array_values(array_slice($keywords, 0, 1))[0];

        foreach ($keywords_raw as $key => $score) {
            $keywords_raw[$key] = ($score / $max);
        }

        $keywords_score = Array();
        foreach ($keywords_raw as $key => $score) {
            $keywords_score[] = Array(
                "keyword" => $key,
                "score" => $keywords_raw[$key]
            );
        }

        $file = new DriveFile("14005200-48b1-11e9-a0b4-0242ac120005","14005200-48b1-11e9-a0b4-0242ac120005");
        $file->setName(explode(".", $document)[0]);
        $file->setContentKeywords($keywords_score);
        $this->doctrine->persist($file);

        $this->doctrine->flush();

    }

    public function search($termslist,$workspaces){ //rajouter le must sur les workspace id

        $terms = Array();
        $should_workspaces = Array();

        foreach($termslist as $term){
            $st = new StringCleaner();
            $term= $st->simplifyInArray($term);
            $terms[] = Array(
                "bool" => Array(
                    "filter" => Array(
                        "regexp" => Array(
                            "keywords.keyword" => ".*".$term.".*"
                        )
                    )
                )
            );
        }

        foreach($workspaces as $workspace) {
            $should_workspaces[] = Array(
                "match_phrase" => Array(
                    "workspace_id" => $workspace["id"]
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
                        "bool" => Array(
                            "should" => Array(
                                $should_workspaces
                            ),
                            "minimum_should_match" => 1,
                            "must" => Array(
                                "bool" => Array(
                                    "should" => Array(
                                        $nested
                                    ),
                                    "minimum_should_match" => 1
                                )
                            )
                        )
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

        //var_dump(json_encode($options));
        //var_dump($workspace["id"]);
        $files = $this->doctrine->es_search($options);
        $files_final=Array();
        //var_dump(json_encode($options));
        foreach ($files["result"] as $file){
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


    public function advancedsearch($options,$workspaces){


        $options_save = $options;
        $must = Array();

        //PARTIE SUR LE NAME

        if(isset($options["name"])) {
            $name = Array(
                "bool" =>Array(
                    "should" => Array(
                        "bool" => Array(
                            "filter" => Array(
                                "regexp" => Array(
                                    "name" => ".*" . $options["name"] . ".*"
                                )
                            )
                        )
                    ),
                    "minimum_should_match" => 1
                )
            );
        }

        $now = new \DateTime();
        $create_before = $now->format('Y-m-d');
        $create_after = "2000-01-01";
        $modified_before = $now->format('Y-m-d');
        $modified_after = "2000-01-01";
        $size_gte = 0;
        $size_lte = 2000000000;

        if(isset($options["size_lte"])){
            $size_lte= $options["size_lte"];
        }

        if(isset($options["size_gte"])){
            $size_gte= $options["size_gte"];
        }

        if(isset($options["date_create_before"])){
            $create_before = $options["date_create_before"];
        }

        if(isset($options["date_create_after"])){
            $create_after = $options["date_create_after"];
        }

        if(isset($options["date_modified_before"])){
            $modified_before = $options["date_modified_before"];
        }

        if(isset($options["date_modified_after"])){
            $modified_after = $options["date_modified_after"];
        }

        //PARTIES SUR LES WORKSPACES
        $should_workspaces = Array();
        foreach($workspaces as $wp) {
            $should_workspaces[] = Array(
                "match_phrase" => Array(
                    "workspace_id" => $wp
                )
            );
        }

        $must[] = Array(
            "bool" => Array(
                "should" => $should_workspaces,
                "minimum_should_match" => 1
            )
        );

        if(isset($options["creator"])){
            $must[] = Array(
                "match_phrase" => Array(
                    "creator" => $options["creator"]
                )
            );
        }

        if(isset($options["type"])){
            $must[] = Array(
                "match_phrase" => Array(
                    "type" => strtolower($options["type"])
                )
            );
        }

        if(isset($name)){
            $must[] = $name;
        }

        $must[] = Array(
            "range" => Array(
                "size" => Array(
                    "lte" => $size_lte,
                    "gte" => $size_gte
                )
            )

        );

        $must[] = Array(
            "range" => Array(
                "creation_date" => Array(
                    "lte" => $create_before,
                    "gte" => $create_after
                )
            )
        );

        $must[] = Array(
            "range" => Array(
                "date_last_modified" => Array(
                    "lte" => $modified_before,
                    "gte" => $modified_after
                )
            )
        );

        $options = Array(
            "repository" => "TwakeDriveBundle:DriveFile",
            "index" => "drive_file",
            "size" => 1,
            "query" => Array(
                "bool" => Array(
                    "must" => $must
                )
            )
        );

        //var_dump(json_encode($options,JSON_PRETTY_PRINT));

        // search in ES
        $result = $this->doctrine->es_search($options);


        array_slice($result["result"], 0, 5);

        $scroll_id = $result["scroll_id"];

        //on traite les données recu d'Elasticsearch
        //var_dump(json_encode($options));
        foreach ($result["result"] as $file){
            //var_dump($file->getAsArray());
            $this->list_files["files"][]= $file->getAsArray();
        }
//        var_dump("nombre de resultat : " . count($this->list_files));
//        var_dump($this->list_files);
        $this->list_files["scroll_id"] = $scroll_id;

        return $this->list_files ?: null;

    }


    public function TestSearch()
    {

//        var_dump("cc");
//       $this->index("pdftest.pdf");
//        $file= $this->doctrine->getRepository("TwakeDriveBundle:Drivefile")->findOneBy(Array("id" => "f155d92a-6cdf-11e9-9077-0242ac130002"));
//        $file = new DriveFile("14005200-48b1-11e9-a0b4-0242ac120000","14005200-48b1-11e9-a0b4-0242ac120000");
//        $file->setName("testbug");
//        // $keywords_score=$this->update_keyword($keywords_score,explode(".", $document)[0]); //change this with document title
//        $file->setExtension("PDF");
//        $this->doctrine->es_put($file,$file->getEsType());
//        var_dump("cc");

//        $words=Array("stage","django");
//        $workspaces = Array("d975075e-6028-11e9-b206-0242ac1200050","14005200-48b1-11e9-a0b4-0242ac120005");
//        $result = $this->search($words, $workspaces);
//        var_dump($result);
    }

}