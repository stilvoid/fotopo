var loginButton = document.getElementById("signin");
var confirmButton = document.getElementById("confirm");
var listDiv = document.getElementById("list");

function show(id) {
    document.getElementById(id).style.display = "flex";
}

function hide(id) {
    document.getElementById(id).style.display = "none";
}

var userRe = /^\S+@\S+(\.[^\.\s]+)+$/;
var passwordRe = /^\S{8,}$/;

var fileInput = document.getElementById("file");
fileInput.onchange = function() {
    putItem();
};

window.onload = loadStuff;

function reset() {
    hide("confirmDialog");
    hide("list");
    hide("uploadForm");
    show("signinDialog");
}

loginButton.onclick = function() {
    var username = document.getElementById("email").value;
    var password = document.getElementById("password").value;

    if(!userRe.test(username)) {
        return alert("Username must be a valid email address");
    }

    if(!passwordRe.test(password)) {
        return alert("Password must be at least 8 characters with no spaces");
    }

    auth.signIn(username, password, function(result, err) {
        if(err) {
            console.log(err);
            if(err.name == "UserNotFoundException") {
                auth.signUp(username, password, function(result, err) {
                    if(err) {
                        return alert(err.message);
                    }

                    hide("signinDialog");
                    show("confirmDialog");
                });
            } else if(err.name == "UserNotConfirmedException") {
                hide("signinDialog");
                show("confirmDialog");
            } else {
                return alert(err.message);
            }
        } else {
            hide("signinDialog");
            hide("confirmDialog");

            loadStuff();
        }
    });
};

confirmButton.onclick = function() {
    var code = document.getElementById("code").value;
    var username = document.getElementById("email").value;

    auth.confirmUser(username, code, function(result, err) {
        if(err) {
            return alert(err.message);
        } else {
            loginButton.click();
        }
    });
};

function loadStuff() {
    show("list");
    listDiv.innerHTML = "<p class='message'>Loading...</p>";

    auth.refresh();

    jQuery.ajax({
        url: config.ApiUrl + "list",
        type: "get",
        headers: {
            Authorization: localStorage.getItem("token")
        },
        success: function(data) {
            console.log("WIN");
            console.log(data);

            listDiv.innerHTML = "";

            data.sort().forEach(function(record) {
                var link = document.createElement("p");
                link.href = "#";
                link.innerHTML = record;
                link.onclick = function() {
                    getItem(record);
                };

                var del = document.createElement("a");
                del.href = "#";
                del.innerHTML = "X";
                del.onclick = function(e) {
                    if(confirm("Are you sure you want to delete " + record)) {
                        deleteItem(record);
                    }

                    e.stopPropagation();
                    return false;
                };

                link.appendChild(del);

                listDiv.appendChild(link);
            });

            if(data.length == 0) {
                listDiv.innerHTML = "<p class='message'>You have no files <strong>:(</strong></p>";
            }

            show("uploadForm");
        },
        error: function(err) {
            console.log("LOSE");
            console.log(err);

            reset();
        }
    });
}

function getItem(name) {
    auth.refresh();

    jQuery.ajax({
        url: config.ApiUrl + "download?k=" + encodeURIComponent(name),
        type: "get",
        headers: {
            Authorization: localStorage.getItem("token")
        },
        success: function(data) {
            window.location.href = data;
        },
        error: function(err) {
            console.log("LOSE");
            console.log(err);

            reset();
        }
    });
}

function deleteItem(name) {
    auth.refresh();

    jQuery.ajax({
        url: config.ApiUrl + "delete?k=" + encodeURIComponent(name),
        type: "get",
        headers: {
            Authorization: localStorage.getItem("token")
        },
        success: function(data) {
            loadStuff();
        },
        error: function(err) {
            console.log("LOSE");
            console.log(err);

            reset();
        }
    });
}

function putItem() {
    listDiv.innerHTML = "<p class='message'>Uploading new file...</p>";
    hide("uploadForm");

    auth.refresh();

    jQuery.ajax({
        url: config.ApiUrl + "upload",
        type: "get",
        headers: {
            Authorization: localStorage.getItem("token")
        },
        success: function(data) {
            console.log(JSON.stringify(data, null, 4));

            var form = document.getElementById("uploadForm");

            var formData = new FormData();

            Object.keys(data.fields).forEach(function(key) {
                formData.append(key, data.fields[key]);
            });

            var file = document.getElementById("file").files[0];
            formData.append("file", file, file.name);
            formData.set("Content-Type", file.type);
            
            for(var value of formData.entries()) {
                console.log(value);
            }

            jQuery.ajax({
                url: data.url,
                type: "post",
                data: formData,
                contentType: false,
                processData: false,
                success: function(data) {
                    console.log("WIN upload");
                    console.log(data);

                    loadStuff();
                },
                error: function(err) {
                    console.log("LOSE upload");
                    console.log(err);

                    reset();
                }
            });

            document.getElementById("file").value = null;
        },
        error: function(err) {
            console.log("LOSE");
            console.log(err);

            reset();
        }
    });
}
