#!/bin/bash

if [ $TRAVIS_OS_NAME == "osx" ]; then
    echo "Deploy vsix package with $(which npm)"

    npm i -g vsce

    vsce publish -p $VSCE_TOKEN
fi