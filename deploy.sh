#!/bin/bash

if [ $TRAVIS_OS_NAME == "osx" ]; then
    echo "Deploy vsix package with $(which npm)"

    npm i -g vsce

    vsce publish -p $VSCE_TOKEN

    if [ $? -ne 0 ]; then
        echo "There was a problem with the deployment."
        cat $TRAVIS_BUILD_DIR/npm-debug.log
    fi
fi