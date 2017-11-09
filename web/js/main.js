var loginButton = document.getElementById("signin");
var confirmButton = document.getElementById("confirm");

function show(id) {
    document.getElementById(id).style.display = "flex";
}

function hide(id) {
    document.getElementById(id).style.display = "none";
}

show("signinDialog");

loginButton.onclick = function() {
    var username = document.getElementById("email").value;
    var password = document.getElementById("password").value;

    signIn(username, password, function(result, err) {
        if(err) {
            if(err.name == "UserNotFoundException") {
                signUp(username, password, function(result, err) {
                    if(err) {
                        return alert(err);
                    }

                    hide("signinDialog");
                    show("confirmDialog");
                });
            } else if(err.name == "UserNotConfirmedException") {
                hide("signinDialog");
                show("confirmDialog");
            } else {
                return alert(err);
            }
        } else {
            console.log(result);
            loadStuff(result);
        }
    });
};

confirmButton.onclick = function() {
    var code = document.getElementById("code").value;
    var username = document.getElementById("email").value;

    confirmUser(username, code, function(result, err) {
        if(err) {
            return alert(err);
        } else {
            loginButton.click();
        }
    });
};

function loadStuff(token) {
    jQuery.ajax({
        url: "https://2qc0ho8i98.execute-api.eu-west-1.amazonaws.com/Prod",
        type: "get",
        headers: {
            Authorization: token
        },
        success: function(data) {
            console.log("WIN");
            console.log(data);
        },
        error: function(err) {
            console.log("LOSE");
            console.log(err);
        }
    });
}
