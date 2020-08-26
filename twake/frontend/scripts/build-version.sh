#! /bin/sh

v=$(cat src/app/environment/version.ts|grep "version_detail");
v=$(echo $v|sed "s/^.*'\([^']*\)'.*/\1/");
echo "Current version : $v";

if [ $1 = "patch" ]; then
  a=$(echo $v|sed 's/^\([0-9]*\)[^0-9].*$/\1/')
  b=$(echo $v|sed 's/^[0-9]*[^0-9]\([A-Z0-9]*\)[^0-9].*$/\1/')
else
  a=$(date +"%Y")
  b=$(echo Q$(( ($(date +%-m)-1)/3+1 )))
fi

git clone https://github.com/TwakeApp/Twake counter-clone
cd counter-clone
git remote add script-counter https://github.com/TwakeApp/Twake
git fetch script-counter
c=$(git rev-list script-counter/main --count);
git remote rm script-counter
rm -R script-counter
cd ..

nvd="$a.$b.$c";
nv="$a.$b";

echo "Next version : $nvd";

node "./scripts/envBuilding.js" $v $nvd $nv
