#!/bin/bash

echo "Deploy vsix package with $(which npm)"

npm i -g vsce

vsce publish -p $VSCE_TOKEN