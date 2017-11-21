#!/bin/bash

# Copyright 2016-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# 
# Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
# 
# http://aws.amazon.com/apache2.0/
# 
# or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

set -e

STACK=fotopo

bucket="$1"

if [ -z $bucket ]; then
    read -p "S3 bucket to store template assets (e.g. mybucket): " bucket
fi

# Package the source
./package.sh

# Create the stack
aws cloudformation package --template-file template.yaml --s3-bucket $bucket --output-template-file template.out.yaml >/dev/null
aws cloudformation deploy --template-file template.out.yaml --stack-name $STACK --capabilities CAPABILITY_IAM

# Create the config
outputs=$(aws cloudformation describe-stacks --stack-name $STACK | jq '.Stacks[0].Outputs|map({key: .OutputKey, value: .OutputValue})|from_entries')

website=$(echo $outputs | jq -r .Website)
echo "Now visit $website"

# Clean up
rm template.out.yaml
