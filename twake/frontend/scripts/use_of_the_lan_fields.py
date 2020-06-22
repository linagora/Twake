import os
import re

rootpath = '..'

#2 dictionnaries : 1 with the nb of occurences, 1 with the strings in the various languages

dicoc = dict()
dicstr = dict()

def update_dic(dic, key, val):
    if key in dic:
        v = dic.get(key)
        v.append(val)
    else:
        dic.update([(key,[val])])
    #print(dicstr.get(key))

def update_oc(key):
    if key in dicoc:
        v = dicoc.get(key)
        dicoc.update([(key , v+1)])
    else:
        dicoc.update([(key,1)])
    #print(dicoc.get(key))

def get_string(s):
    if s.__contains__('"'):
        return s.split('"')[1]
    elif s.__contains__("'"):
        return s.split("'")[1]
    else:
        return s

#print(os.listdir(rootpath))

def init():
    
    #initialization of the strings dictionnaries
    for dossier, sous_dossiers, fichiers in os.walk(rootpath + "src/app/services/languages/locale/"):
        for fichier in fichiers:
            currentpath = os.path.join(dossier, fichier)
            if currentpath.endswith(".js") and (currentpath.count(".")==1):
                print(currentpath)
                
                lecture = open(currentpath, "r")
                s = lecture.read()
                
                t = s.splitlines()
                k= 1
                while k < len(t):
                    if t[k].__contains__(':'):
                        l = t[k].split(':')
                        key = get_string(l[0])
                        if l[1] == '':
                            value = get_string(t[k+1])
                            k+=2
                        else:
                            value = get_string(l[1])
                            k+=1
                        update_dic(dicstr, key,value)
                        dicoc.update([(key,0)])
                    else:
                        k+=1
                

                lecture.close()


def count():
    #counting occurences
    for dossier, sous_dossiers, fichiers in os.walk(rootpath):
        for fichier in fichiers:
            currentpath = os.path.join(dossier, fichier)
            if currentpath.endswith(".js") and (currentpath.count(".")==1):
                if currentpath.__contains__("languages"):
                    continue

                lecture = open(currentpath, "r")
                s = lecture.read()
                
                t = s.split("'")[1::2]
                for sub in t:
                    if sub in dicoc:
                        update_oc(sub)
                lecture.close()


def main():
    init()  
    count()
    ecriture = open('../fichier2.txt', "w")
    for key, value in dicstr.items():
        if dicoc[key] ==0 or len(value)<4 or value.__contains__('') or value.__contains__('No traduction'):
            ecriture.write(key + " : "+ str(value)+" "+ str(dicoc[key]) + "\n")
    ecriture.close()
    #print(dicstr)
main()

