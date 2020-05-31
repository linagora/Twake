#! /bin/sh

v=$(cat src/app/environment/environment.js|grep "version_detail");
v=$(echo $v|sed "s/^.*'\([^']*\)'.*/\1/");
echo "Current version : $v";

increase=0;
while true; do
  echo "Increase version number ? (Y/N) [N]"
  read -p "#?" yn
  case $yn in
    [Yy]* ) increase=1;break;;
    * ) break;;
  esac
done

if [ $increase -eq 1 ]
then
  while true; do
    while true; do
      echo "Increase type A.B.CDD-E ? [D]"
      read -p "#?" yn
      case $yn in
        [Aa]* ) type=1;break;;
        [Bb]* ) type=2;break;;
        [Cc]* ) type=3;break;;
        [Dd]* ) type=4;break;;
        * ) type=5;break;;
      esac
    done

    a=$(echo $v|sed 's/^\([0-9]*\)[^0-9].*$/\1/')
    b=$(echo $v|sed 's/^[0-9]*[^0-9]\([0-9]*\)[^0-9].*$/\1/')
    c=$(echo $v|sed 's/^[0-9]*[^0-9][0-9]*[^0-9]\([0-9]*\)[^0-9].*$/\1/')
    d=$(git rev-list --all --count);

    if [ $type -eq 1 ]
    then
      a=$(($a+1));
    fi
    if [ $type -eq 2 ]
    then
      b=$(($b+1));
    fi
    if [ $type -eq 3 ]
    then
      c=$(($c+100));
    fi
    if [ $type -eq 4 ]
    then
      c=$(($c+1));
    fi

    c=$(printf %03d $c)

    nvd="$a.$b.$c-$d";
    nv="$a.$b";

    echo "New version will be $nvd, confirm (Y/N) ? [N]";
    read -p "#?" yn
    case $yn in
      [Yy]* ) break;;
    esac
  done

  sed -i'' -e "s/version[^_A-Za-z].*/version = '$nv';/g" ./src/app/environment/environment.js
  sed -i'' -e "s/version_detail[^_A-Za-z].*/version_detail = '$nvd';/g" ./src/app/environment/environment.js

  rm ./src/app/environment/environment.js-e

  rm ./public/public/dist/env.js
  touch ./public/public/dist/env.js

  sed -i'' -e "s/version_detail[^_A-Za-z].*/version_detail\" : \"$nvd\",/g" ./src/app/environment/environment.js

  node "./scripts/envBuilding.js"




fi

npm run build-after-sh;
