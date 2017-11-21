"""
Copyright 2016-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/apache2.0/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
"""

from urllib.parse import urlencode
from urllib.request import urlopen, Request, HTTPError, URLError
import boto3
import json
import os

CONTENT_TYPES = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
}

bucket = boto3.resource("s3").Bucket(os.environ["BUCKET"])

def send_response(event, context, response_status, reason=None):
    body = {
        "Status": response_status,
        "PhysicalResourceId": context.log_stream_name,
        "StackId": event["StackId"],
        "RequestId": event["RequestId"],
        "LogicalResourceId": event["LogicalResourceId"],
    }

    print("Responding: {}".format(response_status))

    if reason:
        print(reason)
        body["Reason"] = reason

    body = json.dumps(body).encode("utf-8")

    req = Request(event["ResponseURL"], data=body, headers={
        "Content-Length": len(body),
        "Content-Type": "",
    })
    req.get_method = lambda: "PUT"

    try:
        urlopen(req)
        return True
    except HTTPError as e:
        print("Failed executing HTTP request: {}".format(e.code))
        return False
    except URLError as e:
        print("Failed to reach the server: {}".format(e.reason))
        return False

def handler(event, context):
    """
    Handle a CloudFormation custom resource event
    """

    assets_dir = os.environ["DIR"]

    # Install everything into the bucket
    if event["RequestType"] == "Create":
        for dir_name, _, files in os.walk(assets_dir):
            dir_name = os.path.relpath(dir_name, assets_dir)
            dir_name = "" if dir_name == "." else "{}/".format(dir_name)

            for file_name in files:
                with open(os.path.join(assets_dir, dir_name, file_name), "r") as f:
                    try:
                        bucket.upload_file(
                            os.path.join(assets_dir, dir_name, file_name),
                            os.path.join(dir_name, file_name),
                            ExtraArgs={
                                "ACL": "public-read",
                                "ContentType": CONTENT_TYPES[os.path.splitext(file_name)[1]],
                            },
                        )
                        print("Uploaded {}".format(os.path.join(dir_name, file_name)))
                    except Exception as e:
                        return send_response(event, context, "FAILURE", e.message)

        # Now generate the config file
        bucket.put_object(
            Key="js/config.js",
            ACL="public-read",
            ContentType=CONTENT_TYPES[".js"],
            Body="var config = {};".format(json.dumps(event.get("ResourceProperties"))).encode("utf-8"),
        )

    # Remove everything from the bucket
    elif event["RequestType"] == "Delete":
        try:
            print(bucket.objects.delete())
            print("Emptied the bucket")
        except Exception as e:
            return send_response(event, context, "FAILURE", e.message)

    # Finished
    return send_response(event, context, "SUCCESS")
