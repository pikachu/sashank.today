var twilio = require('twilio');
var schedule = require('node-schedule');
var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var fs = require("fs");
var PORT = 8080;
var mongoose = require("mongoose");
var Feeling = require("./models/Feeling");
var dotenv = require("dotenv");

dotenv.load();
var accountSid = process.env.SID; // Your Account SID from www.twilio.com/console
var authToken = process.env.AUTH;   // Your Auth Token from www.twilio.com/console
var client = twilio(accountSid, authToken);

mongoose.connect(process.env.MONGOURL);
mongoose.connection.on("error", function() {
    console.log(
        "MongoDB Connection Error. Please make sure that MongoDB is running."
    );
    process.exit(1);
});

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use("/public", express.static("public"));

var COLORS = ["FF9191", "9D91FF", "8BCE80", "B880CE"];
var MONTHS = new Array();
MONTHS[0] = "January";
MONTHS[1] = "February";
MONTHS[2] = "March";
MONTHS[3] = "April";
MONTHS[4] = "May";
MONTHS[5] = "June";
MONTHS[6] = "July";
MONTHS[7] = "August";
MONTHS[8] = "September";
MONTHS[9] = "October";
MONTHS[10] = "November";
MONTHS[11] = "December";
 
var rule = new schedule.RecurrenceRule();
rule.hour = [15, 20, 3]; 
rule.minute = 30
var j = schedule.scheduleJob(rule, function(){
    console.log('SENDING!');
    client.sendMessage({
        To: process.env.SASHANK_PHONE,  // Text this number
        From: process.env.TWILIO_NUM,
        Body: 'How do you feel right now? Respond with a phrase that could complete this sentence: "Right now, I feel _____."' // body of the SMS message

    }, function(err, responseData) { //this function is executed when a response is received from Twilio
        if (!err) { // "err" is an error received during the request, if any
            console.log(responseData.from); // outputs "+14506667788"
            console.log(responseData.body); // outputs "word to your mother."

        } else {
            console.log(err)
        }
    });
});

app.post("/feeling", function(req, res) {
    if (req.body.From != process.env.SASHANK_PHONE) return;
    console.log(req.body.Body);
    if (!req.body.Body) return res.error("no feelings :(");
    var f = new Feeling({ feeling: req.body.Body });
    f.save(function(err) {
        if (err) throw err;
        return res.send("<Response><Message>Thanks! Check out https://www.sashank.today</Message></Response>");
    });
});


app.get("/", function(req, res) {
    var color = COLORS[Math.floor(Math.random() * COLORS.length)];
    Feeling.findOne({}, {}, { sort: { created_at: -1 } }, function(err, feeling) {
        if (err) throw err;
        var time = feeling.created_at;
        var hour = (time.getHours() - 5) % 24;
        var isAM = true;
        if (hour > 12) {
            hour = hour % 12;
            isAM = false;
        }
        if (hour == 0) hour = 12;
        var minutes = time.getMinutes < 10 ? `0${time.getMinutes()}` : time.getMinutes()
        var time_str = `${MONTHS[time.getMonth()]} ${time.getDate()}, ${hour}:${minutes} ${isAM ? 'AM' : 'PM'}`
        Feeling.find({}, function(err, feelings) {
            if (err) throw err;
            var feelings_arr = feelings.map(x => x.feeling)
            res.render('today',{
                feeling: feeling.feeling,
                timeStr: time_str,
                feelings: feelings_arr.reverse(),
                color: color
            })
        })
    });
});

app.listen(PORT, function() {
    console.log("Server listening on port:", PORT);
});
