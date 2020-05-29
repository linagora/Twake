#!/bin/bash

#fonction de lancement de la synchronisation
start_synchro() {
    #on demande les informations nécessaires pour construire la requête : id, password, répertoires local et distant à synchroniser
    echo "Entrez votre identifiant"

    read id

    echo "Entrez votre mot de passe"

    read -s psswd

    #construction de la requête à exécuter
    #Note : pour les fichiers à exclure, utiliser le fichier exclude.txt
    cmd="sshpass -p $psswd rsync -azv --exclude-from=\"exclude.txt\" . $id@51.68.94.194:/home/$id/src/twake-core"

    echo "Démarrage de la synchronisation"

    #première exécution de la requête afin de pouvoir synchroniser les fichiers avec le répertoire distant si des modifications ont eu lieu hors connexion
    eval $cmd

    #lancement en tâche de fond d'une boucle infinie qui surveillera les modifications d'un fichier en local, et exécutera les modifications si nécessaire
    fswatch -o -r $local | while read f;
        do
            eval $cmd > /dev/null;
        done &
    }

#arrête la synchronisation entre les fichiers
stop_synchro() {
    echo "Arret de la sychronisation"
    #on utilise pkill pour récupérer les process à tuer
    pkill -f "fswatch"
    pkill -f "bash synchro.sh start"
    echo "Synchronisation arrêtée"
}


#on vérifie qu'il y a bien un argument au lancement du script et que c'est un bon argument
if [ "$#" -eq 1 ]; then
    case $1 in
        start)
            start_synchro ;;
        stop)
            stop_synchro ;;
        *)
            echo "Usage : $0 start|stop"
            exit 1;;
    esac
else
    echo "Usage : $0 start|stop"
    exit 1
fi




