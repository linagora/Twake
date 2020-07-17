import use_of_the_lan_fields as sc

import os

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
                    b = b and v1[l]==v2[l]
                if b:
                    update_rep(v1[-1],k1)

def overwrite():
    #overwriting
    for dossier, sous_dossiers, fichiers in os.walk(sc.rootpath):
        for fichier in fichiers:
            currentpath = os.path.join(dossier, fichier)
            if currentpath.endswith(".js") and (currentpath.count(".")==1):
                if currentpath.__contains__("languages"):
                    continue

                lecture = open(currentpath, "r")
                s = lecture.read()
                
                t = s.split("'")[1::2]
                for sub in t:
                    if sub in dicrep.values():
                        #replace sub by dicrep[sub][0] in file
                        a=0
                lecture.close()


ecriture = open('fichier3.txt', "w")
c=0
for key, value in dicrep.items():
    c+= len(value)
    ecriture.write(key + " : "+ str(value)+" " + str(len(value))+ "\n")
ecriture.write(str(c))
ecriture.close()
