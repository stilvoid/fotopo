"""
The handler
"""

import json

def handler(event, context):
    print(json.dumps(event, indent=4))

    print("USER:", event["requestContext"]["authorizer"]["claims"]["cognito:username"])

    return {
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "Doing": "a thing",
        }),
    }
