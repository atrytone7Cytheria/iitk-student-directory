const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const client = new Client();

const functions = require('firebase-functions');
const cookieParser = require('cookie-parser')();
const cors = require('cors')({ origin: true });
const https = require('https');

// import {
//   beforeUserCreated,
//   beforeUserSignedIn,
// } from "firebase-functions/v2/identity";


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

var admin = require("firebase-admin");
const engines = require('consolidate');

//admin.initializeApp(functions.config().firebase);
admin.initializeApp(/*{
  databaseURL: "https://pgmgmt-619ec-default-rtdb.firebaseio.com/"
  functions.config().firebase
}*/);
var SITE = "/Deploy_14Feb21";

const express = require('express');
const app = express();
var hbs = require('handlebars');
const cons = require('consolidate');

hbs.registerHelper("hasAdminAccess", function(user) {
  return vhadmin.userHasAdminAccess(user);
});

hbs.registerHelper("getTheDay", function(dateStr) {
  var date = new Date(dateStr);
  return date.getUTCDate();
});

hbs.registerHelper("total", function (oldBalance, rent, eb) {
  return parseInt(oldBalance) + parseInt(rent) + parseInt(eb);
});

hbs.registerHelper("vhabsolute", function (number) {
  return Math.abs(number);
});


hbs.registerHelper("isEqualTo", function (str1, str2) {
  return str1 === str2;
});

hbs.registerHelper("inverseUserStatus", function (val) {
  return val === "active" ? "archive" : "active";
});

hbs.registerHelper("stringyfy", function (object) {
  return JSON.stringify(object);
});

hbs.registerHelper("reverseSign", function (val) {
  return -val;
});

hbs.registerHelper("dateString", function (timestamp) {
  var refDate = new Date(+timestamp);
  return refDate.toLocaleString();
});

//NOT working yet :(((( TODO: need to figure out
hbs.registerHelper("dateStringIST", function (timestamp) {
  var refDate = new Date(+timestamp);
  refDate.setTime(refDate.getTime()+330000); //5.5 *60000
  return refDate.toLocaleString();
});

hbs.registerHelper("subtract", function (a, b) {
  return parseInt(a) - parseInt(b);
});

hbs.registerHelper('isEbRecorded', function (v1, options) {
  if (v1 === "EB_RECORDED") {
    return options.fn(this);
  }
  return options.inverse(this);
});

hbs.registerHelper('isdefined', function (value) {
  return value !== undefined && value !== null;
});


hbs.registerHelper('orderSuccessful', function (orderStatus) {
  return (orderStatus === "TXN_SUCCESS");
});

hbs.registerHelper('isTrue', function (boolVar, options) {
  if (boolVar === "true") {
    return options.fn(this);
  }
  return options.inverse(this);
});

hbs.registerHelper('pendingAmountGreaterThanZero', function (value) {
  return value < 0;
});


hbs.registerHelper('serialNo', function (options) {
  var currentSerialNo = options.data.root['serialNo'];
  //console.log("############Current serial No is:"+currentSerialNo);
  if (currentSerialNo === undefined) {
    currentSerialNo = 1;
  } else {
    currentSerialNo++;
  }

  options.data.root['serialNo'] = currentSerialNo;
  return currentSerialNo;
});

hbs.registerHelper('totalAmount', function (value, options) {
  var totalAmtVal = options.data.root['totalAmount'];
  //console.log("############Current serial No is:"+currentSerialNo);
  if (totalAmtVal === undefined) {
    totalAmtVal = value;
  } else {
    totalAmtVal += value;
  }

  options.data.root['serialNo'] = currentSerialNo;
  return currentSerialNo;
});


hbs.registerHelper('oddOrEven', function (options) {
  var oddOrEven = options.data.root['oddOrEven'];
  if (oddOrEven === undefined) {
    oddOrEven = "odd";
  } else if (oddOrEven === "odd") {
    oddOrEven = "even"
  } else {
    oddOrEven = "odd";
  }

  options.data.root['oddOrEven'] = oddOrEven;
  return oddOrEven;
});

hbs.registerPartial("VhFooter", "<div class='menuitem'><a href=\"https://www.varshahostel.com\">Home</a></div> <div class='menuitem'><a href=\"https://www.varshahostel.com\aboutus\">About us</a></div>");
//<div class='menuitem'><a href="javascript:window.demo.getRooms()">Rooms</a></div>
//<div class='menuitem'><a href="javascript:window.demo.getBillTags()">Bill Tags</a></div>
//<div class='menuitem'><a href="javascript:window.demo.collectPayment()">Pay Bill</a></div>");
//hbs.registerPartial("transactionstatus",
var fs = require('fs');

var partialsDir = __dirname + '/views/partials';

var filenames = fs.readdirSync(partialsDir);

filenames.forEach(function (filename) {
  var matches = /^([^.]+).hbs$/.exec(filename);
  if (!matches) {
    return;
  }
  var name = matches[1];
  var template = fs.readFileSync(partialsDir + '/' + filename, 'utf8');
  hbs.registerPartial(name, template);
});
//hbs.registerPartials(__dirname + './views/partials');


app.engine('hbs', engines.handlebars);
app.set('views', './views');
app.set('view engine', 'hbs');

app.get('/', (request, response) => {
  //response.send(`${Date.now()}`);
  res.send(`Hello ${req.user.phone_number}`);
});

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdToken = async (req, res, next) => {
  //console.log('...........................................:::::::::::Check if request is authorized with Firebase ID token');

  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
    !(req.cookies && req.cookies.__session)) {
    console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
      'Make sure you authorize your request by providing the following HTTP header:',
      'Authorization: Bearer <Firebase ID Token>',
      'or by passing a "__session" cookie.');
    res.status(403).send('Unauthorized');
    //    throw Error();
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else if (req.cookies) {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).send('Unauthorized');
    return;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    //console.log('ID Token correctly decoded', decodedIdToken);
    req.user = decodedIdToken;
    //console.log('::::::::::::::::::::::::::::::::in validateFirebaseIdToken phone number:+'+req.user.phone_number);
    next();
    return;
  } catch (error) {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized access');
    return;
  }
};

app.get('/stusearch', (req, res) => {
  // res.send('qrrrXXXXX in stusearch*******************');

  res.render('stusearch');
  console.log("***********************Get setusearch..................");
  // usermgmt.getStudentsList(req, res);
});

app.get('/studentlist', (req, res) => {
  // res.send('qrrrXXXXX in stusearch*******************');

  // res.render('stusearch');
  console.log("***********************Get students list..................");
  usermgmt.getStudentsList(req, res);
});

app.get('/myhome', (req, res) => {
  console.log("***********************myhome..................");
  res.render('myhome');
});

app.get('/:siteName/myhome', (req, res) => {

  var userid = req.query.user;
  var orderId = req.query.orderId;
  var SITE = req.params.siteName;

  console.log('::::::::::::::::::::::::::::::::::::Let us load myhome req.query is :' + JSON.stringify(req.query));
  console.log('::::::::::::::::::::::::::::::::::::Let us load myhome req.user:' + req.user);

  res.send('qrrrXXXXX');
  //Load user home information (phone, name, date of )
  //TODO:Following code can be removed and only render line needs to be there, lasttransaction is implemented from the client side (myhome.js)
  if (orderId) {
    // console.log('retrieve :' + '/' + SITE + '/userTransactionStatus/' + userid + '/' + orderId)
    admin.database().ref('/' + SITE + '/userTransactionStatus/' + userid + '/' + orderId).once('value').then(function (orderInfo) {

      var orderDetails = JSON.parse(JSON.stringify(orderInfo.val()));
      console.log("OrderDetails::::::::::::" + orderDetails + ', userid:' + userid + ', orderid:' + orderId);
      res.render('myhome', { SITE, orderDetails });
    });
  } else {
    /*var userId = req.user.uid;
  
    if (loadType == 'transaction') {
      admin.database().ref("/" + SITE + "/userTransactionStatus/" + userId + "/lastTransaction").once('value').then(function (lastTransaction) {
  
      });
    }*/

    //TODO if not razzak garden or jai nagar just return UnAuthorized
    res.render('myhome', { SITE });
  }
});


const vhadmin = require('./vhadmin');

app.use(cors);
app.use(cookieParser);
app.use(validateFirebaseIdToken);




const userbill = require('./userbill');




app.get('/:siteName/menu', (req, res) => {

  SITE = req.params.siteName;

  console.log('.....Retreiving menu .....SITE:' + SITE);
  // @ts-ignore
  //res.send("My Info Hello "+ JSON.stringify(req.user.phone_number));
  if (vhadmin.userHasAdminAccess(req.user))
    res.render('adminmenu', { SITE });
  else
    res.render('customermenu', { SITE });
});

const rooms = require('./rooms');









const bkutils = require('./bkutils');
const { response } = require('express');

