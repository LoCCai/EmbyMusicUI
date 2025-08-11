#!/bin/sh
init() {
    filename=$1
    if [ ! -e "$filename" ]; then
        printf "%s not exists!" "$filename"
        exit 1
    fi
    if [ -e "${filename}.bak" ]; then
        cp "${filename}.bak" "${filename}"
    else
        cp "${filename}" "${filename}.bak"
    fi
}

undo() {
    filename=$1
    if [ -e "${filename}.bak" ]; then
        cp "${filename}.bak" "${filename}"
    else
        echo "${filename}.bak not found!"
    fi
}

file="/system/dashboard-ui/modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js"
if [ "undo" = "$1" ]; then
    undo ${file}
else
    init ${file}
    filecontent="{include ./replacement/emby-itemscontainer.js}"
    sed -i '1s/.\{3\}$//' ${file}
    echo "${filecontent}" >> ${file}
    sed -i 's/toStart/toCenter/g' ${file}
    echo "});" >> ${file}
fi

file="/system/dashboard-ui/modules/listview/listview.js"
if [ "undo" = "$1" ]; then
    undo ${file}
else
    init ${file}
    filecontent="{include ./replacement/listview.js}"
    sed -i '1s/.\{3\}$//' ${file}
    echo "${filecontent}" >> ${file}
    echo "});" >> ${file}
fi

if [ "undo" = "$1" ]; then
    echo undo done!
else
    echo edit done!
fi
