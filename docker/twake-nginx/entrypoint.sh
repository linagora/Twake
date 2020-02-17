#!/bin/bash

cron -f &
nginx -g "daemon off;"
