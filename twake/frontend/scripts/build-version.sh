#! /bin/sh

v=$(cat src/app/environment/environment.ts|grep "version_detail");
v=$(echo $v|sed "s/^.*'\([^']*\)'.*/\1/");
echo "Current version : $v";

if [ $1 = "patch" ]; then
  a=$(echo $v|sed 's/^\([0-9]*\)[^0-9].*$/\1/')
  b=$(echo $v|sed 's/^[0-9]*[^0-9]\([A-Z0-9]*\)[^0-9].*$/\1/')
else
  a=$(date +"%Y")
  b=$(echo Q$(( ($(date +%-m)-1)/3+1 )))
fi

c=$(git rev-list --all --count);

nvd="$a.$b.$c";
nv="$a.$b";

echo "Next version : $nvd";

node "./scripts/envBuilding.js" $v $nvd $nv
