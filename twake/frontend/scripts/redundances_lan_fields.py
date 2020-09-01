import use_of_the_lan_fields as sc

import os
import sys

sc.init()
items = sc.dicstr.items()

dicrep = dict()

def update_rep(key, val):
    if key in dicrep:
        v = dicrep.get(key)
        if not (val in v):
            v.append(val)
    else:
        dicrep.update([(key,[val])])
def redundance():
    for (k1, v1) in items:
        for (k2, v2) in items:
            if k1!=k2:# and v1[-1]!='':
                b= True
                for l in range(len(min(v1,v2))):
                    b = b and v1[l] == v2[l]
                if b:
                    update_rep(v1[-1],k1)

def overwrite():
    #overwriting
    meta = [item for sublist in [it for it in dicrep.values()] for item in sublist]
    print(meta)
    for dossier, sous_dossiers, fichiers in os.walk(sc.rootpath):
        for fichier in fichiers:
            currentpath = os.path.join(dossier, fichier)
            if currentpath.endswith(".js") and (currentpath.count(".")==1):
                if currentpath.__contains__("languages"):
                    continue
                b = False

                lecture = open(currentpath, "r+")
                s = lecture.read()
                
                t = s.split("'")[1::2]
                for sub in t:
                    if sub in meta:
                        #replace sub by dicrep[sub][0] in file
                        en_sub = sc.dicstr.get(sub)[-1]
                        if len(dicrep.get(en_sub))>3 and en_sub:
                            repsub = dicrep.get(en_sub)[0]
                            s = s.replace(sub, repsub)
                            b = True
                if b:
                    print('Begin Lecture')
                    lecture.seek(0)
                    lecture.write(s)
                    print("Changed: " + currentpath)
                lecture.close()

redundance()
ecriture = open('../fichier3.txt', "w")
c=0
for key, value in dicrep.items():
    if len(value)>3 and key:
        c+= len(value)
        ecriture.write(key + " : "+ str(value)+" " + str(len(value))+ "\n")
ecriture.write(str(c))
ecriture.close()
overwrite()
