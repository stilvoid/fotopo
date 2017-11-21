#!/bin/bash

set -e

ZIP_FILE=lambda.zip

# Create the zip
zip -9 -r $ZIP_FILE lambda.py web_installer.py web
