function longPoll(){
    this.subscribe = transport.subscribe;
    this.publish = transport.publish;
}

var transport = {
    subscribe: function(callback) {
        var longPoll = function(){
            $.ajax({
                method: "GET",
                async: true,
                headers: {"x-subscription-type":"demoMobileNo update"}, // We want to listen to demoMobileNo
                url: "/events?id=" + guid(), // have to generate random string to fix Chrome issue: http://stackoverflow.com/a/27514611/7565480
                success: function(serverdata, status) {
                    if (status == "success") {
                        console.log("LOG: Data received from the server!");
                        callback(serverdata);
                        longPoll();
                    }  else if (status == "nocontent") {
                        console.log("LOG: Normal long-polling timeout, continuing.");
                        longPoll();
                    }
                },
                complete: function(request, status, err){
                    if (status !== "success" && status !== "nocontent") {
                        console.warn("WARN: Server probably offline, retrying in 5 sec. Status:", status);
                        setTimeout(function () {
                            longPoll();
                        }, 5000);
                    }
                },
            });
        };
        longPoll();
    },
    publish: function(data) {
        $.ajax({
                method: "POST",
                async: true,
                url: "/events?id=" + guid(),
                contentType: "application/json",
                data: data
        });
    }
};

var events = new longPoll();

events.subscribe(function(data) {
    if (data.type == "demoMobileNo update") {
        console.log("LOG: New mobile no, refreshing!");
        $("#numbers").load(location.href+" #numbers>*","");
    } else {
        console.warn("LOG: Unknown event:", data.type);
    }
});

$('form').submit(function() {
    console.log("LOG: Form submitted.");
    var data = {
        mobile: $('#msg').val()
    };
    events.publish(JSON.stringify({type: "demoMobileNo request", data: data}));
    $('#msg').val(''); //clear form
    return false;
});

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}