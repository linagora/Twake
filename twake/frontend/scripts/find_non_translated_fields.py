import os
import re

rootpath = '../src/app'

def nextGuillemet(s, i):
    for k in range(i , len(s)):
        if s[k]== '"':
            return k
    return len(s)

def isRelevant(phrase):
    #if len(phrase) > 0 and phrase[0].isupper():
    #   return True
    cpt = 0
    espace = 0
    nblet = 0
    for k in range(len(phrase)):
        letter = phrase[k]
        if letter.isalpha():
            nblet +=1
            if letter.isupper():
                if k>0 and phrase[k-1].islower():
                    cpt-=500
                else:
                    cpt += 1
        elif letter == ' ':
            espace +=1
        elif letter == '_':
            nblet-=500
    return len(phrase)>espace>=0 and cpt>0 and nblet+espace > len(phrase)*0.88
    #return phrase.startswith("Vous êtes")

#print(os.listdir(rootpath))

ecriture = open('../fichier-parcours.txt', "w")

for dossier, sous_dossiers, fichiers in os.walk(rootpath):
    for fichier in fichiers:
        currentpath = os.path.join(dossier, fichier)
        if currentpath.endswith(".js") and (currentpath.count(".")==1):
            #print(currentpath)
            if currentpath.__contains__("languages"):
                continue

            lecture = open(currentpath, "r")
            s = lecture.read()
            spl = re.compile(r'["]')            
            #t = s.split('"')[1:]
            t = spl.split(s)
            for k in range(1,len(t),2):

                if isRelevant(t[k]):
                    if k+1>=len(t) or not re.match(r'( *\)|, *\n *\))', t[k+1]):
                        ecriture.write(currentpath +" : "+ t[k] + "\n")
            t = re.findall('>[^<]*<', s)
            for k in range(len(t)):
                if isRelevant(t[k]):
                    ecriture.write(currentpath +" : "+ t[k] + "\n")
            t = re.findall('\'[^"]*\'', s)
            for k in range(len(t)):
                if isRelevant(t[k]):
                    ecriture.write(currentpath +" : "+ t[k] + "\n")

            lecture.close()
ecriture.close()
