var poolData = {
    UserPoolId: "eu-west-1_3xw0lahES",
    ClientId: "3reavi6jvsh0m656g7p8rkpm29"
};

var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);

function signUp(username, password, callback) {
    var attrs = [
        new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute({
            Name: "email",
            Value: username
        })
    ];

    userPool.signUp(username, password, attrs, null, function(err, result) {
        if(err) {
            return callback(null, err);
        }

        cognitoUser = result.user;

        callback(cognitoUser);
    });
}

function confirmUser(username, code, callback) {
    var user = makeUser(username);

    user.confirmRegistration(code, true, function(err, result) {
        if(err) {
            return callback(null, err);
        }

        callback(result);
    });
}

function resend(username, callback) {
    var user = makeUser(username);

    user.resendConfirmationCode(function(err, result) {
        if(err) {
            return callback(null, err);
        }

        callback(result);
    });
}

function makeAuth(username, password) {
    var authData = {
        Username: username,
        Password: password
    };

    return new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authData);
}

function makeUser(username) {
    var userData = {
        Username: username,
        Pool: userPool
    };

    return new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
}

function signIn(username, password, callback) {
    var user = makeUser(username);
    var auth = makeAuth(username, password);

    user.authenticateUser(auth, {
        onSuccess: function(result) {
            callback(result.getIdToken().getJwtToken());
        },

        onFailure: function(err) {
            callback(null, err);
        }
    });
}
