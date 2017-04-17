"use strict";


// npm packages required for app.js
const express = require("express"); //webserver/middleware
const bodyParser = require("body-parser"); //req.body parser
const helmet = require("helmet"); //security modules collection
const basicAuth = require("express-basic-auth"); //basic auth for express routes
const rateLimit = require("express-rate-limit"); //limiting no. of requests towards Express
const favicon = require("serve-favicon"); //favicons
const morgan = require("morgan"); // http requests logging
const jquery = require('jquery');
const JSONbig = require('json-bigint');

const REST_PORT = (process.env.PORT || 8080);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// App configuration
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var app = express();

// Parsing incoming requests nicely
app.use(bodyParser.text({
    type: "application/json"
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Variables
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var google = require('googleapis');
    var OAuth2 = google.auth.OAuth2;
    var oauth2Client = new OAuth2(
        '714257246673-28nntr8pes7h637edhlkinqlneqnbj9d.apps.googleusercontent.com', //YOUR_CLIENT_ID
        'kTfck1WWzDaSNJ96KS2BYu16', //YOUR_CLIENT_SECRET
        'https://hybrid-unknownbe.c9users.io/oauthcallback' //YOUR_REDIRECT_URL
    );
    var plus = google.plus('v1');
    var drive = google.drive('v3');
    var gmail = google.gmail('v1');
    var googleUser = 'andriesdepuydt@gmail.com';

    var API_KEY = 'AIzaSyAk8sAWGxHecKy6oflprG3NBb0Fj8f7PKY'; // specify your API key here
    var htmlString ='';
    var authURL = '';


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Logging
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Require global logging set-up that exports the necessary functions
////const logger = require("./../lib/appLogger.js");

// Combine application logs with HTTP logs in one file/output. To be used, if needed. However, Heroku logs HTTP requests already, so we do this only for other platforms.
// Further rules are in the appLogger.js library above, so logging of other things will work normally.
////if (PLATFORM !== "heroku") {
////    app.use(morgan("combined", { stream: logger.stream }));
////}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Routers and APIs
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/oauthurl/', (req, res) => {
    console.log('LOG: app.get() oauthurl');

    try {
        return res.status(200).json({
            authURL: authURL
        });
    } catch (err) {
        return res.status(400).json({
            status: "error",
            error: err
        });
    }
    
}); 
   
app.get('/oauthcallback/', (req, res) => {
    console.log('LOG: app.get() oauthcallback');

    try {
        console.log('LOG: received oath code: ' + req.query.code);
        oauth2Client.getToken(req.query.code, function (err, tokens) {
            // Now tokens contains an access_token and an optional refresh_token. Save them.
            console.log(tokens);
            if (!err) {
                oauth2Client.setCredentials(tokens);
                console.log('LOG: oath2Client credentials are set');
            }
        });
        
        
        google.options({
            auth: oauth2Client
        });
        

        
        
        return res.status(200).json({
            status: "ok"
        });
        
    } catch (err) {
        console.log('req.code: ' + req.code);
        return res.status(400).json({
            status: "error",
            error: err
        });
    }
    
});


app.get('/drivedump/', (req, res) => {
    console.log('LOG: start drive list');
    var fetchPage = function(pageToken, pageFn, callback) {
        drive.files.list({
            auth: oauth2Client,
            q: "name contains 'vinkenstraat'",
            fields: 'nextPageToken, files(id, name)',
            spaces: 'drive',
            pageToken: pageToken
        }, function(err, res) {
            if(err) {
                callback(err);
            } else {
                res.files.forEach(function(file) {
                    console.log('Found file: ', file.name, file.id);
                });
                if (res.nextPageToken) {
                    console.log("Page token", res.nextPageToken);
                    pageFn(res.nextPageToken, pageFn, callback);
                } else {
                    callback();
                }
            }
        });
    };
    fetchPage(null, fetchPage, function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log(' All pages fetched');
        }
    });
    res.send('ok');
 
});
    
    
app.get('/maildump/', (req, res) => {
    console.log('LOG: start mail list');
    var fetchPage = function(pageToken, pageFn, callback) {
        gmail.users.messages.list({
            auth: oauth2Client,
            userId: googleUser,
            labelIds: 'Label_11'/*,
            q: "name contains 'vinkenstraat'",
            fields: 'nextPageToken, files(id, name)',
            spaces: 'drive',
            pageToken: pageToken*/
        }, function(err, res) {
            if(err) {
                callback(err);
            } else {
                
                for(var i = 0; !!res.messages[i]; i++) {
                    getMailMessage(googleUser, res.messages[i].id); // API call for mail message details
                    console.log('LOG: mail list loop // ' + res.messages[i].id);
                }
                var nextPageToken = res.nextPageToken;
                    
                if (res.nextPageToken) {
                    console.log('LOG: mail list page token' + res.nextPageToken);
                    pageFn(res.nextPageToken, pageFn, callback);
                } else {
                    callback();
                }
            }
        });
    };
    fetchPage(null, fetchPage, function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log(' All pages fetched');
        }
    });
    console.log(htmlString);
    //res.send('ok');
    return res.status(200).json({
            htmlString: htmlString
        });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Server init + Socket routing
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
* This could be used later for https configuration with proxy pass through
* 1. Create self-signed certificates:
* $ mkdir ssh
* $ cd ssh
* $ openssl genrsa 1024 > private.key
* $ openssl req -new -key private.key -out cert.csr
* $ openssl x509 -req -in cert.csr -signkey private.key -out certificate.pem
* --
* 2. Start server like this (and pass to io below)
var secureServer = https.createServer({
    key: fs.readFileSync("./../ssh/private.key"),
    cert: fs.readFileSync("./../ssh/certificate.pem")
  }, app)
  .listen(REST_PORT, function () {
    console.log("Secure Server listening on port " + REST_PORT);
});
*/

// Initialize server + websockets
// This will initialize 
////var io = require("./../lib/io.js").initialize(app.listen(REST_PORT, () => {
////    logger.info("Application ready on port " + REST_PORT + " . Environment: " + NODE_ENV);
////}));
app.listen(REST_PORT, () => {
    console.log('LOG: Application ready on port ' + REST_PORT);
    console.log('LOG: Start TRY OUT ZONE');
    getAccessToken(oauth2Client);
    console.log('LOG: End TRY OUT ZONE');
    
});

// In the libraries below, io is used, hence we need to require them only afterwards
////const logMsg = require("./../lib/logMsg.js");
////const sentiment = require("./../lib/sentiment.js");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Functions & Business Logic
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    function getAccessToken (oauth2Client, callback) {
        // generate a url that asks permissions for Google+ and Google Calendar scopes
        var scopes = [
            'https://www.googleapis.com/auth/plus.me',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.appdata',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/drive.metadata',
            'https://www.googleapis.com/auth/drive.metadata.readonly',
            'https://www.googleapis.com/auth/drive.photos.readonly',
            'https://www.googleapis.com/auth/drive.readonly',
            'https://mail.google.com/'/*,
            'https://www.googleapis.com/auth/gmail.metadata', 
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/gmail.readonly'*/
        ];

        authURL = oauth2Client.generateAuthUrl({
            // 'online' (default) or 'offline' (gets refresh_token)
            access_type: 'offline',
            // If you only need one scope you can pass it as a string
            scope: scopes,
        
            // Optional property that passes state parameters to redirect URI
            // state: { foo: 'bar' }
        });
         


        console.log('Visit the url: ', authURL);
    }
/*
    plus.people.get({
            auth: API_KEY,
            userId: '+google'
            }, function (err, user) {
            console.log('Result: ' + (err ? err.message : user.displayName));
        });
*/

    //listMessages('andriesdepuydt@gmail.com');

/*    
    jquery.getJSON('http://twitter.com/status/user_timeline/treason.json?count=10&callback=?',function(data) {
  console.log(data);
    });
*/    



    




function getMailMessage(googleUser, id) {
        
    console.log('LOG: Start of getMailMessage');
    var fetchPageMessage = function(pageToken, pageFn, callback) {
        gmail.users.messages.get({
            auth: oauth2Client,
            userId: googleUser,
            id: id
        }, function(err, res) {
            if(err) {
                console.log('LOG: gmail.users.messages.get error');
                callback(err);
            } else {
                //console.log(res);
                for(var i = 0; !!res.payload.headers[i]; i++) {
                    if(res.payload.headers[i].name == 'From' || res.payload.headers[i].name== 'To' || res.payload.headers[i].name== 'Date' || res.payload.headers[i].name== 'Subject') {
                        console.log(res.payload.headers[i].name + ': ' + res.payload.headers[i].value);
                        htmlString = htmlString + res.payload.headers[i].name + ': ' + res.payload.headers[i].value + ' <br>';
                    }
                }
                htmlString = htmlString + res.snippet + ' <br><hr>';
                var nextPageToken = res.nextPageToken;
                    
                if (res.nextPageToken) {
                    console.log("Page token", res.nextPageToken);
                    pageFn(res.nextPageToken, pageFn, callback);
                } else {
                    callback();
                }
            }
        });
    };
    fetchPageMessage(null, fetchPageMessage, function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log(' All pages fetched');
        }
    });
    console.log(htmlString);
}
            
    
    





/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Error and exception handling
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Please don't crash on uncaught exceptions, as we hold this all in memory. When moving to DB persistency later, let's implement automated restarts, though.
process.on("uncaughtException", function (err) {
  console.error(err);
});

// Generic error handler, no stacktraces leaked to user
app.use(function(err, req, res, next) {
    console.error(err);
    return res.status(500).json({status: "error"});
/* Rendering error page - perhaps for later experiments
*  res.render('error', {
*    message: err.message,
*    error: {}
*  }); */
});