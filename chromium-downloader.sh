#!/bin/bash
#
#	chromium-downloader script (version 1.2)
#
#	A simple script which downloads the most recent Chromium
#	build for your platform. Works on Linux and OS X.
#
#	Author: Matteo Loporchio
#

help() {
cat << EOF
Usage: $0 [options]
Available options:
	--help: displays information about the usage of the script.
	--path: specifies where the file will be downloaded.
		NOTICE: This option must be followed by a valid path.
Short options are also available. You can use "-h" instead of "--help"
and "-p" instead of "--path".
EOF
}

# Processing script arguments.
PATH_OPT=0
while [ "$1" != "" ]; do
	case "$1" in
		-p|--path)
			PATH_OPT=1
			CUSTOM_PATH="$2"
			;;
		-h|--help|-*)
			help
			exit 1
			;;
		*)
			# If a path has already been supplied
			# then the option makes no sense and the help
			# message will be displayed.
			if [ "$PATH_OPT" -eq 0 ]; then
				help
				exit 1
			fi
			;;
	esac
	shift
done

# Checking if the path is legal.
if [ "$PATH_OPT" -eq 1 ] && ! [ -d "$CUSTOM_PATH" ]; then
	echo "Error: please supply a valid path."
	help
	exit 1
fi

echo "chromium-downloader script (version 1.2)"
# Base URL used to download the file.
BASE_URL="https://storage.googleapis.com/chromium-browser-snapshots"

# Determining the platform.
UNAMESTR=$(uname)
PKGNAME="Unknown"
PLATFORM="Unknown"
if [[ "$UNAMESTR" == "Darwin" ]]; then
	PKGNAME="chrome-mac.zip"
	PLATFORM="Mac"
elif [[ "$UNAMESTR" == "Linux" ]]; then
	PKGNAME="chrome-linux.zip"
	PLATFORM="Linux"
fi
if [[ "$PLATFORM" == "Unknown" ]]; then
	echo "Error: unknown platform."
	exit 1
fi

# Determining Chromium latest version and preparing the URL.
FULL_URL="$BASE_URL/$PLATFORM/LAST_CHANGE"
LATESTVER=$(curl -s "$FULL_URL")
echo "Chromium latest version for your platform is: $LATESTVER"
DOWNLOAD_URL="$BASE_URL/$PLATFORM/$LATESTVER/$PKGNAME"

# Downloading the file.
if [ "$PATH_OPT" -eq 1 ] && [ -n "$CUSTOM_PATH" ]; then
	echo "Chromium will be downloaded in: $CUSTOM_PATH"
	curl -o "$CUSTOM_PATH/$PKGNAME" "$DOWNLOAD_URL"
else
	echo "Chromium will be downloaded in: $(pwd)"
	curl -o "$PKGNAME" "$DOWNLOAD_URL"
fi

echo "Chromium version $LATESTVER has been successfully downloaded."
exit 0