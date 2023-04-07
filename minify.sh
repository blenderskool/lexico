#!/bin/bash
for file in "$@";
do
  terser $file --config-file terser.config.json -o $file;
done