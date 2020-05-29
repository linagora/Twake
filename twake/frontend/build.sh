#! /bin/sh

v=$(cat src/client/version.js|grep "VERSION_DETAIL");
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

  sed -i'' -e "s/VERSION[^_A-Za-z].*/VERSION = '$nv';/g" ./src/client/version.js
  sed -i'' -e "s/VERSION_DETAIL[^_A-Za-z].*/VERSION_DETAIL = '$nvd';/g" ./src/client/version.js
  rm ./src/client/version.js-e

fi

npm run build-after-sh;
