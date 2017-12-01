<?php

namespace WebsiteApi\CoreBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\RememberMeToken;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

class TranslationController extends Controller
{

  public function translateTestAction(Request $request){
    $lang_dir = dirname($this->get('kernel')->getRootDir()).'/web/angular/public/views/user/account';
    $arr = Array();
    $arr2 = Array();
    // On récupère le contenu du fichier
    foreach (preg_grep('/\\.html$/', scandir($lang_dir)) as $filename) {
      $file = file_get_contents($lang_dir."/".$filename);
      preg_match_all("/> *([^< \\r\\n][^<>]*?) *<[^ ]/m", $file, $arr[$filename]);
      $arr2[$filename] = Array();
      foreach($arr[$filename][1] as $string){

        $explode1 = explode('{{',$string);
        for ($i = 0; $i<count($explode1); $i++){
          if ($i == 0){
            $arr2[$filename][$this->get('app.string_cleaner')->simplify($explode1[0])] = $explode1[0];
          } else {
            $explode2 =  explode('}}',$explode1[$i]);
            $arr2[$filename][$this->get('app.string_cleaner')->simplify($explode2[1])] = $explode2[1];
          }
        }
      }


    }

    return new JsonResponse($arr2["account.html"]);

  }


  public function getAction(Request $request){

    $lang_dir = dirname($this->get('kernel')->getRootDir()).'/web/translations/';

    $dev = true;
    $default_lang = "fr";
    if ($request->request->Has('lang')){
      $lang = $request->request->get('lang');
    } else {
      $lang = $default_lang;
    }

    $lang_dir = $lang_dir."/".$lang;
    if (!file_exists($lang_dir) || !is_dir($lang_dir)) {
      $lang_dir = $lang_dir."/".$default_lang;
    }

    if(!$dev){
      if(file_exists($lang_dir."/_cached")){
        return json_decode(file_get_contents($lang_dir."/_cached"));
      }
    }

    //On recupère tous les fichiers
    $translations = Array();
    foreach (preg_grep('/\\.json$/', scandir($lang_dir)) as $filename) {
      $file = json_decode(file_get_contents($lang_dir."/".$filename), 1);
      if(is_array($file)) {
        $translations = array_merge($translations, $file);
      }

    }

    if(!$dev){
      file_put_contents($lang_dir."/_cached",json_encode($translations),LOCK_EX);
    }

    return new JsonResponse($translations);
  }
}