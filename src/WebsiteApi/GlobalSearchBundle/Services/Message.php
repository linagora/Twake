<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

class Message

{
    private $doctrine;

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function update_keyword($keywords,$table){
        foreach($table as $word) {
            $keywords[] = $word;
        };

        return $keywords;
    }

    public function TestMessage()
    {
        $bloc = Array("Salut ca va ?", "Oui et toi", "mouais ca va mais j'ai faim", "Viens on va manger", "J'ai pas de sous", "Je paye", "c'est cool", "Tacos", "Ca marche");
//        $bloc = Array("Cinquante et deux dix",
//            "Les Romains c'est l'avenir",
//            "Ça serait pas plutôt cinquante et dix et dix pour les romains ?",
//            "@bombidabiere tetais chaud pour aller voir endgame ce soir? D'ailleurs s'il y en a d'autres manifestez vous",
//            "J y vais demain normalement",
//            "ouais nous on a réservé les places pour la séance de 20h en vo à l'ugc et on va au tacos à 18h30",
//            "Bon j'ai besoin de l'indexation de masse de message je vais prendre les messages d'ici pour me faire un jeu de test",
//            "vous pouvez faire coucou si vous voulez",
//            "bon j'ai pas pris la partie sur octante mon truc doit être multi langue mais l'argot peut etre exclus"
//            );

        $authors = Array("Charlotte","Valentin","Clement","Thomas");
        //$messages_id = Array("p1","p2","p3","p4","p5","p6","p7","p8","p9");

        $authors = Array("bibi","moi");
        //$messages_id = Array("i1","i2","i3","i4","i5","i6","i7","i8","i9");
        $keywords=$this->update_keyword($bloc,$authors);

        //error_log(print_r($keywords,true));

        $options = Array(
            "index" => "message",
            "data" => Array(
                "id" => "blocmessage1",
                "content" => $keywords
            )
        );

        var_dump(json_encode($options,JSON_PRETTY_PRINT));

        $this->doctrine->es_put_perso($options);
    }

}