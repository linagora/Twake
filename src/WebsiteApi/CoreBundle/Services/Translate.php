<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 27/07/18
 * Time: 14:15
 */

namespace WebsiteApi\CoreBundle\Services;

class TranslationObject {
    private $vars;
    private $key;
    private $translator;

    public function __construct(Translate $translator,$key, ...$variables){
        $this->key = $key;
        $this->translator = $translator;
        $this->vars = Array();
        foreach ($variables as $variable)
            array_push($this->vars,$variable);
    }

    /* @return string*/
    private function setVariables($string){
        $final = $string;
        for($i=0;$i<count($this->vars);$i++)
            $final = str_replace("$".($i+1),$this->vars[$i],$final);
        return $final;
    }

    public function toString($lang){
        return $this->setVariables($this->translator->translate($this->key,$lang));
    }

    public function __toString(){
        return $this->setVariables($this->translator->translate($this->key,'en'));
    }
}

class Translate
{
    public function __construct(){
    }

    public function translate($key, $lang){
        if($key instanceof TranslationObject)
            return $key->toString($lang);

        $availableLanguages = Array("fr","en");

        if(in_array($lang,$availableLanguages)) {
            include dirname(__FILE__)."/Languages/$lang.php";

            if (isset(($$lang)[$key])){
                return ($$lang)[$key];
            }
        }

        if($lang=='en')
            return $key;
        return $this->translate($key,"en");
    }
}