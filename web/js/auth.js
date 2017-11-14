var auth = (function() {
    var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(config);

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

    function refresh() {
        if(!localStorage.getItem("token")) {
            return;
        }

        var user = makeUser(localStorage.getItem("user"));

        var token = new AWSCognito.CognitoIdentityServiceProvider.CognitoRefreshToken({
            RefreshToken: localStorage.getItem("refresh_token")
        });

        user.refreshSession(token, function(err, result) {
            localStorage.setItem("refresh_token", result.refreshToken.token);
            localStorage.setItem("token", result.getIdToken().getJwtToken());
        });
    }

    return {
        refresh: refresh,
        signUp: function(username, password, callback) {
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
        },

        confirmUser: function(username, code, callback) {
            var user = makeUser(username);

            user.confirmRegistration(code, true, function(err, result) {
                if(err) {
                    return callback(null, err);
                }

                callback(result);
            });
        },

        resend: function(username, callback) {
            var user = makeUser(username);

            user.resendConfirmationCode(function(err, result) {
                if(err) {
                    return callback(null, err);
                }

                callback(result);
            });
        },

        signIn: function(username, password, callback) {
            var user = makeUser(username);
            var auth = makeAuth(username, password);

            localStorage.setItem("user", username);

            user.authenticateUser(auth, {
                onSuccess: function(result) {
                    localStorage.setItem("refresh_token", result.refreshToken.token);
                    localStorage.setItem("token", result.getIdToken().getJwtToken());

                    callback();
                },

                onFailure: function(err) {
                    callback(null, err);
                }
            });
        }
    };
}());
