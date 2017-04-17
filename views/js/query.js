/*
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
                headers: {"x-subscription-type":"new chat"}, // We want to listen to new chats
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

var text_max = 640;
var events = new longPoll();

$('#counter_message').html(text_max);
$('#msg').keyup(function() {
    var text_length = $('#msg').val().length;
    var text_remaining = text_max - text_length;
    $('#counter_message').html(text_remaining);
});

events.subscribe(function(data) {
    if (data.type == "new chat") {
        console.log("LOG: New chat, refreshing!");
        $("#messages").load(location.href+" #messages>*","");
    } else {
        console.warn("LOG: Unknown event:", data.type);
    }
});

$('form').submit(function() {
    if ($('#msg').val() == '' || $('#msg').val().length > 640) {
        console.warn("WARN: Cannot send empty or too long form.");
        return false;
    } else {
        var data = {
            fbid: $('#fbid').text(),
            text: $('#msg').val(),
            user: $('#user').text()
        };
        events.publish(JSON.stringify({type: "send chat message", data: data}));
        $('#msg').val(''); //clear form
        $('#counter_message').html(text_max); // reset counter
        console.log("LOG: Form submitted.");
        return false;
    }
});

$('input:radio[name="pause"]').change(function(){
    if ($(this).val() == 'ON') {
        console.log("LOG: Starting bot for this FBID!");
        var data = {
            fbid: $('#fbid').text(),
            isPaused: false,
            user: $('#user').text()
        };
        events.publish(JSON.stringify({type: "pause", data: data}));
    }
    if ($(this).val() == 'OFF') {
        console.log("LOG: Stopping bot for this FBID!");
        var data = {
            fbid: $('#fbid').text(),
            isPaused: true,
            user: $('#user').text()
        };
        events.publish(JSON.stringify({type: "pause", data: data}));
    }
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

*/


function listMessages(userId, query, callback) {
  var getPageOfMessages = function(request, result) {
    request.execute(function(resp) {
      result = result.concat(resp.messages);
      var nextPageToken = resp.nextPageToken;
      if (nextPageToken) {
        request = gapi.client.gmail.users.messages.list({
          'userId': userId,
          'pageToken': nextPageToken,
          'q': query
        });
        getPageOfMessages(request, result);
      } else {
        callback(result);
      }
    });
  };
  var initialRequest = gapi.client.gmail.users.messages.list({
    'userId': userId,
    'q': query
  });
  getPageOfMessages(initialRequest, []);
}




function getMessage(userId, messageId, callback) {
  gapi.client.init();
  var request = gapi.client.gmail.users.messages.get({
    'userId': userId,
    'id': messageId
  });
  request.execute(callback);
}

function test() {
    return 'andries'
    
}