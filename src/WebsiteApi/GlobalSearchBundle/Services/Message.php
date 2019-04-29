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

    public function generate_keywords($content,$keywords){
        $content = str_replace(array("\\'", "'")," ",$content);
        $words = str_word_count(strtolower($content),1, 'ÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸÆŒàâäçéèêëîïôöùûüÿæœ');


        $weight=10;

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
        }

        return $keywords;

    }

    public function TestMessage()
    {
        $keywords=Array();
        //$message= Array("Salut ca va ?", "Oui et toi", "mouais ca va mais j'ai faim", "Viens on va manger", "J'ai pas de sous", "Je paye", "c'est cool", "Tacos", "Ca marche");
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
       $message = Array("Ha attends je regarde, non c'est un plus clair ",
            "C'est le bleu #317595 on refera un choix final plus tard mais on aime bien lui en attendant pour avancer, tu as moyen de changer les couleurs rapidement pendant que le projet avance ?",
            "C'est noté! Oui sans problème les couleurs sont variables",
            "Un peu à la illustrator avec les palettes ? (j'avais cherché sans succès pendant ma courte période d'utilisation de Sketch...)",
            "C'est ça en gros les couleurs, shadows, gradients et font peuvent être définis dans des \"layer style\" et \"text style\" qui sont donc variables facilement. Pour les font c'est un peu plus long à setter mais pour les couleurs c'est très simple",
            "C'est génial ça, merci de l'info je regarderai, je trouvais que ça manquait cruellement !",
            "C'est sympathique comme début ! La recherche me semble très grande, je pense qu'on pourrait mettre des boutons à côté de la recherche pour accéder à l'édition de la chaîne en cours (membres, nom, ce qu'on trouve actuellement dans les \"...\" au hover du channel).
            En ce qui concerne les barres du bas, pour l'instant je ne sais pas, par contre on sera obligé de mettre les icônes d'applications comme actuellement (pour les smileys, les appels, les gifs et les autres intégrations)
            Ensuite il y a les onglets, je n'ai pas de problème avec eux, mais ils me font penser à deux choses :
            - déjà on a un cas ou on peut avoir deux fois une même application dans les onglets, par exemple j'attaches deux dossiers dans la chaîne et ça fais deux onglets avec la même icône, actuellement on groupe les onglets par application afin de n'afficher l'icone qu'une fois à gauche des onglets correspondant
            - ensuite les application peuvent être développées par des tiers, ce qui fait qu'il y aura des icônes tierces utilisées possiblement. Du coup soit on met des icône plus chargées pour nos applications, soit on garde ce que tu proposes ce qui donnes l'impression que l'application est plus intégrée à la plateforme (mais d'un autre côté elle reste optionnelle aujourd'hui, il est possible de ne pas utiliser de calendrier ou de stockage sur Twake, et on retrouve ces applications dans notre marketplace d'applications)
            Encore une dernière remarque, j'ai l'impression que les 3 éléments du header (titre, type de chahnel et nombre d'user) sont trop serrées par rapport au reste (pour une fois que c'est trop serré haha !)
            Ça pourrait être sympa de s'appeler semaine prochaine pour faire un premier debrief en visio ? 🙂
            Merci pour ces retours ! je vous envoie prochainnement un créneau pour qu'on puisse s'appeler",
           "Un peu à la illustrator avec les palettes ? (j'avais cherché sans succès pendant ma courte période d'utilisation de Sketch...)",
            "On a un peu discuté avec Benoit sur différents points :
            - la recherche globale, on peut éventuellement la déplacer dans la vue principale (droite) à la manière de slack, car elle va être accessible depuis toutes les applications de toute manière, donc c'est une option possible 🙂
            - l'espacement entre le bord haut de la fenêtre et les premiers éléments des deux barres de gauche est vachement grand je trouve, bien que finalement je trouve l'espacement de 24px entre les workspaces très bien ✅ 
            - moi j'aime bien la couleur sombre du 005 mais pas Benoit qui trouve ça trop gris/noir et donc pas assez coloré, par contre on est d'accord sur le fait que la version 005 est celle qu'on préfère pour le moment (celle avec le fond gris clair), reste donc à jouer sur cette couleur sombre et voir comment on peut l'améliorer !"
        );

        foreach($message as $text){
            $keywords=$this->generate_keywords($text,$keywords);
        }

        arsort($keywords); // Sort based on frequency

        //var_dump($keywords);
        //$authors=Array("Romaric","Clement");

        //$authors = Array("Charlotte","Valentin","Clement","Thomas");
        //$messages_id = Array("p1","p2","p3","p4","p5","p6","p7","p8","p9");

        //$authors = Array("bibi","moi");
        //$messages_id = Array("i1","i2","i3","i4","i5","i6","i7","i8","i9");
        //$keywords=$this->update_keyword($bloc,$authors);

        //error_log(print_r($keywords,true));
//
        $keywords = array_slice($keywords, 0, 10);

        $max = array_values(array_slice($keywords, 0, 1))[0];

        $keywords_score= Array();
        foreach ($keywords as $key => $score) {
            $keywords[$key] = ($score/$max);
        }

        foreach ($keywords as $key => $score) {
            $keywords_score[] = Array(
                "word" => $key,
                "score" => $keywords[$key]
            );
        }
        var_dump($keywords_score);
        $options = Array(
            "index" => "message",
            "data" => Array(
                "id" => "blocmessage3",
                "workspace_id" => "workspace_1",
                "channel_id" => "channel_1",
                "keywords" => $keywords_score
            )
        );

        $this->doctrine->es_put_perso($options);

//        $terms = Array();
//        $terms[] = Array(
//            "match_phrase" => Array(
//                "content" => "Salut ca va"
//            ));
//        $terms[] = Array(
//            "match_phrase" => Array(
//                "content" => "mouais ca va mais j'ai faim"
//            ));
//        $terms[] = Array(
//            "match_phrase" => Array(
//                "content" => "J y vais demain normalement"
//            ));
//
//        $options = Array(
//            "repository" => "TwakeGlobalSearchBundle:Bloc",
//            "index" => "message",
//            "query" => Array(
//                "bool" => Array(
//                    "should" => $terms
//                    )
//                )
//            );




        //var_dump(json_encode($options,JSON_PRETTY_PRINT));
        $result = $this->doctrine->es_search_perso($options);
        //var_dump($result);

    }

    public function save($object, $options, $current_user)
    {
        $options["workspace_id"] = $object["original_workspace"];
        $options["group_id"] = $object["original_group"];
        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $did_create = false;

        $members = isset($object["members"]) ? $object["members"] : [];
        $members = array_unique($members);
        sort($members);


        //Create or find channel
        if (!isset($object["id"])) {

            if (!$object["original_group"] || !$object["original_workspace"]) {
                return false;
            }

            $group = $this->entity_manager->getRepository("TwakeWorkspacesBundle:Group")->find($object["original_group"]);
            $workspace = $this->entity_manager->getRepository("TwakeWorkspacesBundle:Workspace")->find($object["original_workspace"]);

            $channel = new \WebsiteApi\ChannelsBundle\Entity\Channel();
            $channel->setDirect(false);
            $channel->setFrontId($object["front_id"]);

            $channel->setOriginalGroup($group);
            $channel->setOriginalWorkspaceId($workspace->getId());

            $did_create = true;

        } else {
            $channel = $this->entity_manager->getRepository("TwakeChannelsBundle:Channel")->find(Array("id" => $object["id"], "direct" => $object["direct"], "original_workspace_id" => $object["original_workspace"]));
            if (!$channel) {
                return false;
            }
        }

        //Modifiy channel details
        $channel->setMembersCount(count($members));
        $channel->setName($object["name"]);
        $channel->setIcon($object["icon"]);
        $channel->setDescription($object["description"]);
        $channel->setChannelGroupName($object["channel_group_name"]);


        return $channel->getAsArray();

    }


}