const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const PORT = process.env.PORT || 5000;
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const delayed = require('delayed');

// Hard-code them here or use process.env.TWILIO_AUTH_TOKEN, if it is saved in environment variable.
const accountSid = '';
const authToken = '';
const twilio = require('twilio')(accountSid, authToken);

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.post('/', (req, res) => {
  let delay = req.body.delaynum;
  const secOrMin = req.body.timer;

  if (secOrMin == 'second') {
    delay = delay * 1000;
  } else if (secOrMin == 'minute') {
    delay = delay * 1000 * 60;
  }

  res.sendFile(path.join(__dirname, 'public', 'call.html'));
  delayed.delay(function() {
    twilio.calls.create({
      url: 'https://twiml-phonebuzz-p3.herokuapp.com/voice',
      to: req.body.phonenumber,
      from: '+14049484020'
    }, (err, call) => {
      if (err) {
        console.log(err);
      } else {
        console.log(call.sid + ' to ' + req.body.phonenumber);
      }
    });
  }, delay);
});

// Handle POST request from Twilio.
app.post('/voice', (req, res) => {
    const twiml = new VoiceResponse();

    let gather = twiml.gather({
      action: '/handle'
    });
    gather.say('Welcome to PhoneBuzz! Please enter a number');

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  });

app.post('/handle', (req, res) => {
  const client = require('twilio');
  // Uncomment first if statement and comment second if statemnt WHEN testing the app locally. Validates the X-Twilio-Signature. Default is optimized with Heroku.
  if (client.validateExpressRequest(req, authToken, { url: 'https://twiml-phonebuzz-p3.herokuapp.com/handle'})) {
    const twiml = new VoiceResponse();
    const num = req.body.Digits;

    if (num > 0) {
      const mes = fizzBuzzEngine(num);
      twiml.say(mes);
    } else {
      twiml.redirect('/voice');
    }

    res.type('text/xml');
    res.send(twiml.toString());
    } else {
    res.status(403).send('Fraud detected.');
  }
});

// Local Express app hosting at localhost:5000
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

/**
  @author Marvin Cangcianno
  Fizz Buzz Engine. Rule of the game can be found at https://en.wikipedia.org/wiki/Fizz_buzz

  @param num upper bound positive integer
  @return string containing the game, from 1 to num.
**/
function fizzBuzzEngine(num) {
  let message = '';

  for (let i = 1; i <= num; i++) {
    if (i % 3 == 0 && i % 5 == 0) {
      message += 'Fizz Buzz';
    } else if (i % 3 == 0) {
      message += 'Fizz';
    } else if (i % 5 == 0) {
      message += 'Buzz';
    } else {
      message += i.toString();
    }

    if (i != num) {
      message += ', ';
    }
  }

  return message;
}
