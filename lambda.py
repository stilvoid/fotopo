"""
The handler
"""

import boto3
import hashlib
import json
import os
import random
import urllib.parse

CLIENT_SALT = "fotopo client magic salt"

s3 = boto3.client("s3")
ddb = boto3.client("dynamodb")

def get_list(folder):
    paginator = s3.get_paginator("list_objects_v2")

    keys = [
        record["Key"][len(folder) + 1:]
        for page in paginator.paginate(Bucket=os.environ["BUCKET"], Prefix="{}/".format(folder))
        for record in page.get("Contents", [])
        if record["Key"] != "{}/".format(folder)
    ]

    return keys

def get_user_folder(user):
    sha1 = hashlib.sha1()
    sha1.update(user.encode("utf-8"))
    sha1.update(CLIENT_SALT.encode("utf-8"))

    user_hash = sha1.hexdigest()

    record = ddb.get_item(TableName=os.environ["TABLE"], Key={"id": {"S": user_hash}})

    salt = record.get("Item", {}).get("salt", {}).get("S")

    if not salt:
        salt = bytes(random.choices(range(128), k=32)).decode("ascii")

        ddb.put_item(TableName=os.environ["TABLE"], Item={
            "id": {"S": user_hash},
            "salt": {"S": salt},
        })

    sha1 = hashlib.sha1()
    sha1.update(user.encode("utf-8"))
    sha1.update(salt.encode("utf-8"))

    return sha1.hexdigest()

def respond(body):
    print(body)

    return {
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(body),
    }

def handler(event, context):
    print(json.dumps(event, indent=4))

    user = event["requestContext"]["authorizer"]["claims"]["cognito:username"]
    print(user)

    folder = get_user_folder(user)
    print(folder)

    action = event.get("pathParameters", {}).get("action")

    path = None
    query_params = event.get("queryStringParameters")
    if query_params and "k" in query_params:
        path = urllib.parse.unquote(query_params["k"])

    if action == "list":
        print("Listing")
        keys = get_list(folder)
        print(keys)

        return respond(keys)

    if action == "download" and path:
        print("Downloading {}".format(path))
        return respond(s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": os.environ["BUCKET"],
                "Key": "{}/{}".format(folder, path),
            }
        ))

    if action == "delete" and path:
        print("Deleting {}".format(path))
        return respond(s3.delete_object(
            Bucket=os.environ["BUCKET"],
            Key="{}/{}".format(folder, path),
        ))

    if action == "upload":
        print("Uploading")
        return respond(s3.generate_presigned_post(
            Bucket=os.environ["BUCKET"],
            Key="{}/${{filename}}".format(folder),
            Fields={
                "Content-Type": "binary/octet-stream",
            },
            Conditions=[
                ["starts-with", "$Content-Type", ""],
            ],
        ))

    else:
        return respond("Unkown thingy: {} : {}".format(action, path))
