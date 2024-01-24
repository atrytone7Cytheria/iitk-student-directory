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

function getTransactions(monthlyBillTag) {
  //console.log('OKkkkkkkkkkkk................................. retrieving monthlybill tag:'+SITE + '/monthlySheet/' + monthlyBillTag);
  const ref = admin.database().ref(SITE + '/monthlySheet/' + monthlyBillTag);
  return ref.once('value').then(snap => snap.val());
}

function getMeterReadings(monthlyBillTag) {
  const ref = admin.database().ref(SITE + '/RoomMeter/' + monthlyBillTag);
  return ref.once('value').then(snap => snap.val());
}

function getBillTags() {
  const ref = admin.database().ref(SITE + '/MonthlyBills');
  return ref.once('value').then(snap => snap.val());
}

function getEBBillData(billtag) {
  const ref = admin.database().ref(SITE + '/ebBillData/' + billtag);
  return ref.once('value').then(snap => snap.val());
}

function getCollectionReport(request, response) {

  //var startDate = 
  //var endDate = 

  var reportType = request.query.reporttype;

  const today = new Date();
  // 2020-11-24T10:20:14.782Z
  var day = today.getDate();        // 24
  var month = today.getMonth();     // 10 (Month is 0-based, so 10 means 11th Month)
  var year = today.getFullYear();   // 2020
  var timestamp = today.getTime();

  console.log(":::::::getCollectionReport:::::: reportType=" + JSON.stringify(request.query) + ", day=" + day + ", month=" + month + ", year=" + year);
  if (reportType == "month") {

    if (false && process.env.FUNCTIONS_EMULATOR) {
      day = 5;
      month = 11;
      year = 2022;
      console.log(":::::::getCollectionReport:::::: reportType month For emulator testing day=" + day + ", month=" + month + ", year=" + year);
    }
    const ref = admin.database().ref(SITE + '/ledger/received' + '/' + year + '/' + month);
    return ref.once('value').then(snap => snap.val());
  } else if (reportType == "prevmonth") {

    var newMonth = today.getMonth() - 1;
    if (newMonth < 0) {
      newMonth += 12;
      today.setYear(d.getFullYear() - 1); // use getFullYear instead of getYear !
    }
    today.setMonth(newMonth);

    // 2020-11-24T10:20:14.782Z
    day = today.getDate();        // 24
    month = today.getMonth();     // 10 (Month is 0-based, so 10 means 11th Month)
    year = today.getFullYear();   // 2020
    timestamp = today.getTime();

    console.log(":::::::getCollectionReport:::::: reportType prev month For emulator testing day=" + day + ", month=" + month + ", year=" + year);

    const ref = admin.database().ref(SITE + '/ledger/received' + '/' + year + '/' + month);
    return ref.once('value').then(snap => snap.val());
  } else {
    if (true && process.env.FUNCTIONS_EMULATOR) {
      day = 5;
      month = 11;
      year = 2022;
      console.log(":::::::getCollectionReport:::::: For emulator testing day=" + day + ", month=" + month + ", year=" + year);
    }

    const ref = admin.database().ref(SITE + '/ledger/received/' + year + '/' + month + '/' + day);
    return ref.once('value').then(snap => snap.val());
  }
}

app.get('/ttt', (request, response) => {
  //response.send(`${Date.now()}`);
  console.log("this is tttt");
  response.send(`Hello expresss....`);
});

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

/*
app.param('siteName', function(req, res, next, name) {
  console.log('::::::::::::::::::::::::::::::::in app.param siteName:::'+name);

  SITE = name;
  //var userInfo =  JSON.parse(JSON.stringify(req.user));
  //console.log('::::::::::::::::::::::::::::::::in app.param phone number:'+JSON.stringify(req.user, ["phone_number"]))
  console.log('::::::::::::::::::::::::::::::::in app.param phone number:'+getPhoneNumber(req.user))
  //console.log('::::::::::::::::::::::::::::::::::::phone:', req.user['phone_number']);
  //var uidInDB = getUIDfromPhoneNumber(req.user.phone_number);
  //console.log('::::::::::::::::::::::::::::::::in app.param phone number:+'+req.user.phone_number+', uid:'+JSON.stringify(uidInDB));

  //console.log('::::::::::::::::::::::::::::::UID from phone number'+getUIDfromPhoneNumber(getPhoneNumber(req.user)));
  getUIDfromPhoneNumber(getPhoneNumber(req.user)).then(phoneInfo => {
    console.log('::::::::::::::::::::::::::::::UID from phone number:',phoneInfo);
    next();
  });

});

//Shit shit shit shit shit shit shit shit
//Learn this js shit shit shit shit shit shit shit shit
//For the life of me I dont know why user.phone_number or user['phone_number'] just dont work
// it gives an error
//     TypeError: Cannot read property 'phone_number' of undefined
function getPhoneNumber(obj) {
  //console.log('::::::::::::::::::::: in getPhoneNumber value is:'+ obj['phone_number']);
  for (const key in obj) {
    const value = obj[key];
    console.log('key is :'+key+', value ='+obj[key]+', value is:'+obj['phone_number']);
    return obj['phone_number'];
  }  
}

function stringify(obj) {
  let objString = '';
  // We add the opening curly brace
  objString += '{';
  for (const key in obj) {
      const value = obj[key];
      console.log('key is :'+key+', value ='+obj[key]+', value is:'+obj['phone_number']);
      
      objString += `"${key}":`;
      
      if (typeof obj[key] === 'object') {
          objString += `${stringify(value)}`;
      } else if (typeof value === 'string') {
          objString += `"${value}"`;
      } else if (typeof obj[key] === 'number') {
          objString += `${value}`;
      }
      
      // We add the comma
      objString += `,`;
  }
  // We add the closing curly brace
  objString += '}';
  return objString;
}

function getUIDfromPhoneNumber(phone) {
  console.log('::::::::::::::::::::::::::::::::in getUIDfromPhoneNumber db location:::'+SITE + '/PhoneIndex/'+phone);
  return admin.database().ref(SITE + '/PhoneIndex/'+phone).once('value').then(snap => snap.val());
}*/

app.get('/help', (req, res) => {
  res.render('help');
});

app.get('/aboutus', (req, res) => {
  res.render('aboutus');
});

app.get('/termsandconditions', (req, res) => {
  res.render('termsandconditions');
});

app.get('/privacypolicy', (req, res) => {
  res.render('privacypolicy');
});
app.get('/productsandservices', (req, res) => {
  res.render('productsandservices');
});

app.get('/refundandcancellation', (req, res) => {
  res.render('refundandcancellation');
});

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

app.post('/:siteName/callback', (req, res) => {
  //  console.log("....................OK OK OK in callback that is coool... indeeed req body-->"+JSON.stringify(req.body));
  SITE = req.params.siteName;

  paytm.processResponse(req, res);
  return;
});



const PaytmConfig = require('./paytmconfig');
const paytm = require('./paytm');

var myToggle = 0;

app.get('/:siteName/collectpay', (req, res) => {
  SITE = req.params.siteName;
  var userid = req.query.customer;
  console.log('.....Collect Pay for user:' + userid + ', in the SITE:' + SITE);
  paytm.collectPayment(req, res);
});

app.get('/:siteName/collectpaylink', (req, res) => {
  SITE = req.params.siteName;
  var userid = req.query.customer;
  console.log('.....Collect PayLink for user:' + userid + ', in the SITE:' + SITE);
  paytm.collectPayLinkPayment(req, res);
});

const setu = require('./setu');
app.get('/qr', (req, res) => {
  SITE = req.params.siteName;
  
console.log('Qrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr');
/* var userid = req.user.user_id; //req.query.customer;
client.on('qr', qr => {
  qrcode.generate(qr, {small: true});
  res.send('qrrr');
});
  if (process.env.FUNCTIONS_EMULATOR) {
    userid = "gKsCqAcdNbUgRYzieCtIoKaxYVA3";
  }
  */

  setu.fetchAuthToken(null, null);
  //setu.generateSetuPayLink(null, null);
});


const vhadmin = require('./vhadmin');

app.use(cors);
app.use(cookieParser);
app.use(validateFirebaseIdToken);



app.get('/:siteName/lasttransaction', (req, res) => {
  SITE = req.params.siteName;
  var userid = req.user.user_id; //req.query.customer;

  if (process.env.FUNCTIONS_EMULATOR) {
    userid = "gKsCqAcdNbUgRYzieCtIoKaxYVA3";
  }

  console.log('retrieve :' + '/' + SITE + '/userTransactionStatus/' + userid);
  admin.database().ref('/' + SITE + '/lastTransaction/' + userid).once('value').then(function (orderInfo) {

    var orderDetails = JSON.parse(JSON.stringify(orderInfo.val()));
    console.log("OrderDetails::::::::::::" + orderDetails + ', userid:' + userid);
    //if (orderDetails != null)
    res.render('transactionstatus', { SITE, orderDetails });
    //else

  });
});


app.get('/:siteName/monthlysheet', (request, response) => {

  // restrict user to admin only
  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }

  SITE = request.params.siteName;
  getTransactions(request.query.tag).then(transactions => {
    //console.log("JSON Is ........"+JSON.stringify(transactions));
    getMeterReadings(request.query.tag).then(meterReadings => {
      //console.log("Readings JSON Is ........"+JSON.stringify(meterReadings));
      //var reverseTransactions = JSON.stringify(transactions).reverse();
      //var revTrans = $.​parseJSON(transactions);
      //var revT = JSON.parse(transactions);
      //console.log("rev trans:"+ JSON.stringify(transactions));

      response.render('monthlysheetsection', { transactions, meterReadings });
    });
  });
});


const userbill = require('./userbill');


app.get('/:siteName/createauthuser', (req, res) => {
  SITE = req.params.siteName;

  // restrict to admin only
  if (vhadmin.userHasAdminAccess(req.user) === false) {
    response.render('unauthorized');
    return;
  }
  userbill.createauthuser(req, res);
});


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
app.get('/:siteName/rooms', (request, response) => {

  // restrict user to admin only
  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }

  rooms.handler(request, response);
});


/*app.get('/:siteName/register', (request, response) => {

  console.log('register..............................................register');
  // restrict user to admin only
  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }

  response.render('register');
});*/

app.get('/:siteName/userbill', (request, response) => {
  // console.log('::::::::::..........................USER ID:'+request.user.user_id+', phone number:'+request.user.phoneNumber);
  userbill.handler(request, response);
});


app.get('/:siteName/userbillPending', (request, response) => {
  // restrict user to admin only
  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }

  var userid = request.query.user;
  var isPendingBills = "true";
  userbill.userbillPending(request, response, userid, isPendingBills);
});

app.get('/:siteName/userNewBill', (request, response) => {
  // restrict user to admin only
  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }

  var userid = request.query.user;
  userbill.userNewBill(request, response, userid);
});

app.get('/:siteName/addauserbill', (request, response) => {
  // restrict user to admin only
  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }

  var SITE = request.params.siteName;

  var userid = request.query.user;
  var descr = request.query.trans_desc;
  var amount = request.query.trans_amt;

  userbill.addOneUserBill(SITE, userid, descr, amount).then(snapVal => {
      userbill.userbillPending(request, response, userid, true);
  });
});

app.get('/:siteName/userbillCollected', (request, response) => {
  // restrict user to admin only
  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }

  var userid = request.query.user;
  userbill.userbillCollected(request, response, userid);
});

app.get('/:siteName/userinfo', (request, response) => {
  // restrict user to admin only
  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }

  var userid = request.query.user;
  userbill.userinfo(request, response, userid);
});



app.get('/:siteName/markBillAsPaid', (request, response) => {
  // restrict user to admin only
  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }
 
  userbill.markBillAsPaid(request, response);
});

app.get('/:siteName/billdues', (request, response) => {
  // restrict user to admin only
  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }

  var userid = request.query.user;
  userbill.userBillDuesString(request, response, userid);
});


const usermgmt = require('./usermgmt');
//exports.generatePhoneIndex = usermgmt.generatePhoneIndex;
exports.resetActiveUserBalancesToZero = usermgmt.resetActiveUserBalancesToZero;
exports.generateActUserRentAdvanceInfoInIndex = usermgmt.generateActUserRentAdvanceInfoInIndex;

app.get('/:siteName/newusers', (request, response) => {

  console.log('in stagedaccounts handler ........')
  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }

  usermgmt.stagedUsers(request, response);
});


app.get('/:siteName/userlist', (request, response) => {

  console.log('in userlist handler ........')
  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }

  usermgmt.handler(request, response);
});

app.get('/:siteName/colorthecustomers', (request, response) => {

  console.log('>>>>>>>>>>>>>>>in colorTheCustomer handler ........')
  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }

  usermgmt.colorTheCustomers(request, response);
});


app.get('/:siteName/moveuser', (request, response) => {

  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }

  usermgmt.moveUser(request, response);
});

app.get('/:siteName/approveuser', (request, response) => {

  console.log("::::::::::::::::OK in approveuser::::::::::::::::::::::::::::::::::");
  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }

  usermgmt.approveNewUser(request, response);
});

app.get('/:siteName/myinfo', (request, response) => {
  console.log("::::::::::::::::OK in myinfo::::::::::::::::::::::::::::::::::");
//  console.log('::::::::::..........................USER ID:'+request.user.user_id+', phone number:'+JSON.stringify(request.user));
  userbill.handler(request, response);
});

app.get('/:siteName/tags', (request, response) => {

  // restrict user to admin only
  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }

  SITE = request.params.siteName;
  var sheettype = request.query.sheettype;
  var billtag = request.query.billtag;

  if (sheettype != null) {
    getEBBillData(billtag).then(ebBillData => {
      //console.log("Site is:" + SITE);
      //console.log("Site is in match:" + request.params.siteName);
      //console.log("ebBill Info JSON Is ........" + JSON.stringify(ebBillData));
      response.render('ebbilldetails', { SITE, ebBillData, billtag });
    });
  } else {
    //console.log('Tags........ site is.....................' + request.params.siteName);
    getBillTags().then(billTags => {
      //console.log("Site is:" + SITE);
      //console.log("Site is in match:" + request.params.siteName);
      //console.log("tags JSON Is ........" + JSON.stringify(billTags));
      response.render('billtags', { SITE, billTags });
    });
  }
});

app.get('/:siteName/collectionreport', (request, response) => {

  // restrict user to admin only
  if (vhadmin.userHasAdminAccess(request.user) === false) {
    response.render('unauthorized');
    return;
  }

  SITE = request.params.siteName;
  var reportType = request.query.reporttype;
//  console.log('Tags........ site is.....................' + request.params.siteName);
  getCollectionReport(request, response).then(collectionReport => {
    //console.log("Site is:" + SITE);
    //console.log("Site is in match:" + request.params.siteName);
    //console.log("Collection JSON Is ........" + JSON.stringify(collectionReport));
    response.render('collectionreport', { SITE, collectionReport, reportType });
  });
});

exports.app = functions.https.onRequest(app);

/*exports.bigben = functions.https.onRequest((req, res) => {
  const hours = (new Date().getHours() % 12) + 1  // London is UTC + 1hr;
  res.status(200).send(`<!doctype html>
    <head>
      <title>Time</title>
    </head>
    <body>
      ${'BONG '.repeat(hours)}

    </body>
  </html>`);
});*/

exports.UpdateRoomOccupancyInfo = rooms.UpdateRoomOccupancyInfo;
//exports.UpdateAllRoomOccupancyInfo = rooms.UpdateAllRoomOccupancyInfo;

const transactions = require('./transactions');
exports.addUserTransactionForPaidViaPaymtGW = transactions.addUserTransactionForPaidViaPaymtGW;
// exports.ComputeAndUpdateAccountBalance = transactions.ComputeAndUpdateAccountBalance;
exports.generatePayTmToken = paytm.generatePayTmToken;

/*TODO: Index info updation for Account
  Account can be
   1. Newly created
       --> add the account info appropriately under the room in which user is added
          --> change.before will be null
   2.  can be deleted
       --> delete the account info appropriately under the room in which user is added
           --> change.after will be null
   3. Account can be modified
       --> If the user room changes, add the account info to the new room
       --> Delete the user info under the old room no.
       --> Copy New Info under the new roomNo.

       newRoomNo
       oldRoomNo
       balance
       doj
       name
       phone
   4. TODO TODO: Had to take care of moving to archive and master accounts (non inmate accounts), add separate functions for them??

*/
exports.updateIndexInfo = functions
  .database/*.instance('pgmgmt-619ec-default-rtdb')*/
  .ref('/{siteName}/Accounts/{accountId}')
  .onWrite((change, context) => {

    //console.log("TTREUpdateAccountIndexInfo is it getting triggered... SITE: " + context.params.siteName);
    accountId = context.params.accountId;

    const beforeAccount = change.before.val();
    var oldRoomNo = null;
    if (beforeAccount != null)
      oldRoomNo = beforeAccount.roomNo;

    const afterAccount = change.after.val();
    var newRoomNo = null;
    if (afterAccount != null)
      newRoomNo = afterAccount.roomNo;


    console.log(" ==> UpdateAccountIndexInfo accountId:" + accountId + ", oldRoomNo:" + oldRoomNo + ", new room no:" + newRoomNo);
    if (oldRoomNo !== newRoomNo) {
      console.log(" ==> UpdateAccountIndexInfo newRoomNo differnt from old");
      if (oldRoomNo != null) {
        console.log(" ==> UpdateAccountIndexInfo remove account from oldRoomNo");
        admin.database().ref("/" + context.params.siteName + "/AccIndexes/active/" + oldRoomNo + "/" + accountId).remove();
      }
    }

    if (newRoomNo != null) {
      console.log(" ==> UpdateAccountIndexInfo add to new roomNo");
      admin.database().ref("/" + context.params.siteName + "/AccIndexes/active/" + newRoomNo + "/" + accountId).update({
        "balance": afterAccount.computedBalance,
        "name": afterAccount.name,
        "doj": afterAccount.inmateJoiningDateStr,
        "phone": afterAccount.phone,
        "rent":afterAccount.inmateRent,
        "collectedAdvance":afterAccount.collectedOnDayOne,
        "advance": afterAccount.inmateAdvance
      }).then(() => {
        admin.database().ref("/" + context.params.siteName + "/AccIndexes/allAccounts/" + accountId).update({
          "balance": afterAccount.computedBalance,
          "name": afterAccount.name,
          "doj": afterAccount.inmateJoiningDateStr,
          "phone": afterAccount.phone,
          "roomNo": newRoomNo,
          "rent":afterAccount.inmateRent,
          "collectedAdvance":afterAccount.collectedOnDayOne,
          "advance": afterAccount.inmateAdvance  
        });
      });

      /*var phoneIndexData = {};
      phoneIndexData["PhoneIndex/" + afterAccount.phone] = {
          "phone": afterAccount.phone,
          "uid":accountId
      };*/

      var phoneNox = afterAccount.phone;
      if (beforeAccount == null) {
        admin.auth().createUser({
          uid: accountId,
          phoneNumber: phoneNox,
          displayName: afterAccount.name,
          disabled: false,
        })
          .then(user => {
            console.log('::::::::::::::::::::::::::::::: User with phone:' + afterAccount.phone + ' created uid:' + user.uid);
          }).catch((error) => {
            console.log('::::::::::::::::::::::::::::::: Failed User with phone:' + afterAccount.phone + ' created uid:' + accountId);
            console.log('Error creating new user:', error);
          });;
      }

      //TODO: else if afterAccount == null (account is being deleted) delete fireAuth user also?????
    }
    return "OK";
  });

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function isJoiningDateinPrevMonthOrBefore(joiningDate) {
  var lastDayPrevMonth = new Date();
  console.log("date=" + lastDayPrevMonth);
  lastDayPrevMonth.setDate(0);
  lastDayPrevMonth.setHours(23);
  lastDayPrevMonth.setMinutes(59);
  lastDayPrevMonth.setSeconds(59);

  console.log("......................xxxxx last Day of prev month=" + lastDayPrevMonth);

  // const input_date_str = "2020-12-31";
  var input_date = new Date(joiningDate);
  console.log("input date=" + input_date);

  if (input_date <= lastDayPrevMonth) {

    if (joiningDate.search(/2021-12-/) == -1)
      return true;
    else {
      return false;
      console.log("...............xxxxxx skipping date :" + joiningDate);
    }
  } else {
    return false;
  }
}

const billgen = require('./billgen');
exports.generateEBBillInfoListener = billgen.generateEBBillInfoListener;

//var first = false;
async function 
billGenerate(accountId, inmateInfo, monthlyBillTag, chargePerPerson, roomId, newTransactionKey) {

  //if (first == false)
  //  return;
  //first = false;

  // SHOULDnt we wait for the fetch to complete before doing rest of the work... hmmm async keyword above takes care of it????
  var rentSnap = await admin.database().ref(SITE + '/Accounts/' + accountId + "/inmateRent").once('value');
  //console.log("\n retrieve rent:"+SITE + '/Accounts/'+accountId+"/inmateRent"+", rent is:"+JSON.stringify(rentSnap));
  var maintenanceAmtSnap = await admin.database().ref(SITE + '/Globals/inmate_maintenance_amt').once('value');
  //payable= rent+eb+maintenance
  var transactionAmount = rentSnap.val() + chargePerPerson + Number(maintenanceAmtSnap.val()); //40 should be fetched from db, ie from Globals/inmates_maintenance_amt ??

  const date = new Date();

  var billData = {};

  if (bkutils.userJoinedLastMonthOrBefore(inmateInfo, monthlyBillTag)) {
    billData["AccTransactions/" + accountId + "/" + newTransactionKey] = {
      "accountUID": accountId,
      "billTag": monthlyBillTag,
      "description": "Rent " + monthNames[date.getMonth()],
      "mLongCreatedTimestamp": + date,
      "mLongModifiedTimestamp": + date,
      "modifiedTransactionTimestamp": + date,
      "previousBalance": Number(inmateInfo.balance),
      "timeMillis": + date,
      //TODO: only rent amount will be added here
      //Eb+maintenance will be added from eb bill generation separately.
      "transactionAmount": -rentSnap.val(),  
      "uid": newTransactionKey
    };

    //Add bill Tag
    var dueDate = billgen.getDueDate(inmateInfo.doj);
    billData["PendingBills/" + accountId + "/" + newTransactionKey] = {
      "description": "Rent " + monthNames[date.getMonth()],
      "transactionAmount": rentSnap.val(),
      "dueDate": dueDate,
      "uid": newTransactionKey,
      "billTag": monthlyBillTag
    };

    admin.database().ref(SITE).update(billData);  

    var billTag = {};
    billTag["BillTags/" + "RENT" + monthlyBillTag] = {
      [newTransactionKey]: accountId
    };
    admin.database().ref(SITE).child("BillTags").child("RENT"+monthlyBillTag).update({[newTransactionKey]:accountId});
  }

  billData["monthlySheet/" + monthlyBillTag + "/" + newTransactionKey] = {
    "doj": inmateInfo.doj,
    "roomNo": roomId,
    "inmateName": inmateInfo.name,
    "inmatePhoneNo": inmateInfo.phone,
    "previousBalance": -inmateInfo.balance,
    //"rent": isJoiningDateinPrevMonthOrBefore(inmateInfo.doj)? rentSnap.val():0,
    //"ebAmount": isJoiningDateinPrevMonthOrBefore(inmateInfo.doj)?chargePerPerson:0,
    "rent": bkutils.userJoinedLastMonthOrBefore(inmateInfo, monthlyBillTag) ? rentSnap.val() : 0,
    "ebAmount": bkutils.userJoinedLastMonthOrBefore(inmateInfo, monthlyBillTag) ? chargePerPerson : 0,
    "accountUID": accountId,
    "transactionUid": newTransactionKey
  };

  //TODO update the computed number of persons for each of the room also

  console.log("\n maintenanceAmt=" + maintenanceAmtSnap.val() + ", chargePerPerson=" + chargePerPerson + ", Rent = " + rentSnap.val() + ", transactionAmount=" + transactionAmount + ", Bill data===>" + JSON.stringify(billData));

  return admin.database().ref(SITE).update(billData);
}

/*exports.genMonthlyBillsDEPRECATED = functions
  .database//.instance('pgmgmt-619ec-default-rtdb')
  .ref('/{siteName}/jobs/monthlybill/{monthlyBillTag}/genbills')
  .onWrite((change, context) => {
    SITE = context.params.siteName;
    var monthlyBillTag = context.params.monthlyBillTag;

    var billOperation = change.after.val();
    console.log("")
    if (billOperation === "generate") {
      generateBills(monthlyBillTag);
    } else if (billOperation === "delete") {
      deleteBills(monthlyBillTag);
    } else {
      console.log("\n\n **** Unsupported bill operation: " + billOperation);
    }
    return "OK";
  }); */


exports.genMonthlyBills = functions
  .database/*.instance('pgmgmt-619ec-default-rtdb')*/
  .ref('/{siteName}/jobs/monthlybill/{monthlyBillTag}/genRentBills')
  .onWrite((change, context) => {
    SITE = context.params.siteName;
    var monthlyBillTag = context.params.monthlyBillTag;

    var billOperation = change.after.val();
    console.log("")
    if (billOperation === "generate") {
      generateBillsNEW(monthlyBillTag);
    } else if (billOperation === "delete") {
      deleteBills(monthlyBillTag);
    } else {
      console.log("\n\n **** Unsupported bill operation: " + billOperation);
    }
    return "OK";
  });

function deleteBills(monthlyBillTag) {
  console.log("\n Deleting monthly bills, bill tag:" + monthlyBillTag);
  admin.database().ref(SITE + '/monthlySheet/' + monthlyBillTag + '/').once('value').then(function (monthlyBillsSnap) {
    var monthlyBills = monthlyBillsSnap.val();
    if (monthlyBills === null) {
      console.log("No monthly bills found, nothing to do... exiting");
      admin.database().ref(SITE + `/jobs/monthlybill/${monthlyBillTag}/genRentBills`).set("deleted");
      return;
    }
    //console.log("monthly bills==>"+JSON.stringify(monthlyBills));
    monthlyBillsSnap.forEach(function (bill) {
      var billData = bill.val();
      console.log("\nDelting bill" + JSON.stringify(bill));
      admin.database().ref(SITE + `/AccTransactions/${billData.accountUID}/${billData.transactionUid}`).remove();
      admin.database().ref(SITE+ `/PendingBills/${billData.accountUID}/${billData.transactionUid}`).remove();
      admin.database().ref(SITE+ '/BillTags/RENT'+monthlyBillTag+'/'+billData.transactionUid).remove();
    });
    admin.database().ref(SITE + '/monthlySheet/' + monthlyBillTag + '/').remove();
    admin.database().ref(SITE + `/jobs/monthlybill/${monthlyBillTag}/genRentBills`).set("deleted");
    admin.database().ref(SITE + '/MonthlyBills/' + monthlyBillTag + '/billStatus').set("EB_RECORDED");


    return;
  });
}


function generateBillsNEW(monthlyBillTag) {
  //first = true;
  console.log("LET us retrieve:" + SITE + '/MonthlyBills/' + monthlyBillTag + "#");
  admin.database().ref(SITE + '/MonthlyBills/' + monthlyBillTag + '/').once('value').then(function (billObjSnap) {
    var monthlyBillObj = billObjSnap.val();
    if (monthlyBillObj == null) {
      console.log("\n **** ERROR: MonthlyBill OBject not found under /MonthlyBills/, cannot start the bill generation job");
      return;
    }
    console.log("\n Retrieved monthlyBill object with BillTag:" + monthlyBillTag + ", billOBj:" + JSON.stringify(monthlyBillObj));

    var cumulativeRentAmount = 0; 
    //TODO: should make it part of the above once block, can the fetch be made parallel and we need to wait for all of them to succeed??
    admin.database().ref(SITE + '/AccIndexes/active/').once('value').then(function (activeInmateSnap) {
      var allActiveInmatesObj = activeInmateSnap.val();
      if (allActiveInmatesObj == null) {
        console.log("\n **** ERROR: Fetching all inmates under /AccIndexes/active/ failed, cannot start the bill generation job");
        return;
      }
      console.log("\n Retrieved all active inmates for monthlyBill gen with BillTag:" + monthlyBillTag);

      //Retrieve room meter for this monthly bill
      admin.database().ref(SITE + '/RoomMeter/' + monthlyBillObj.readingDate).once('value').then(function (metersSnap) {
        var metersObj = metersSnap.val();
        if (metersObj == null) {
          console.log("\n **** ERROR: Fetching room meters under /RoomMeter/ for reading date:" + monthlyBillObj.readingDate);
          return;
        }
        console.log("\n Retrieved Meter readings for reading date:" + monthlyBillObj.readingDate);

        activeInmateSnap.forEach(function (roomUsersSnapshot) {
          var roomId = roomUsersSnapshot.key;
          var roomUsersData = roomUsersSnapshot.val();
          console.log("\n Processing room:" + roomId);
          console.log("\n Processing room:" + roomId + ", room users data==>" + JSON.stringify(roomUsersData));
          //roomUsersData.forEach(function(inmateSnap) {
          const numPersons = roomUsersSnapshot.numChildren();
          const meterUnitRate = 10.5;
          var chargePerPerson = 0;
          if (metersObj[roomId].fixedCharge == true) {
            chargePerPerson = metersObj[roomId].chargePerPerson;
          } else {
            chargePerPerson = Math.ceil(meterUnitRate * (metersObj[roomId].meterReading - metersObj[roomId].lastMeterReading) / numPersons + 40);
          }
          console.log("\n call billGenerate for users now, RoomNo:" + roomId + ", numpersons=" + numPersons + ", isFixed=" + metersObj[roomId].fixedCharge + ", chargePerperson=" + chargePerPerson);
          roomUsersSnapshot.forEach(function (inmateSnap) {
            console.log("==>user:" + JSON.stringify(inmateSnap));

            var inmateInfo = inmateSnap.val();

            var ref = admin.database().ref();
            var newPostRef = ref.push();
            var newTransactionKey = newPostRef.key;

            billGenerate(inmateSnap.key, inmateInfo, monthlyBillTag, chargePerPerson, roomId, newTransactionKey);
            cumulativeRentAmount += inmateInfo.rent;
            console.log("==>user rent:" + inmateInfo.rent+", cumulative Rent:"+cumulativeRentAmount);
          });
          console.log("\n Meter reading for room:" + roomId + " ==>" + JSON.stringify(metersObj[roomId]));
        });

      }).then(function () {
        console.log("==>uFinal cumulative Rent:"+cumulativeRentAmount);
        admin.database().ref(SITE + `/jobs/monthlybill/${monthlyBillTag}/genRentBills`).set("generated");
        //    monthlyBillObj.billStatus = "GENERATED";
        admin.database().ref(SITE + '/MonthlyBills/' + monthlyBillTag + '/billStatus').set("GENERATED");
        admin.database().ref(SITE + '/MonthlyBills/' + monthlyBillTag + '/rentCumulativeAmount').set(cumulativeRentAmount);
      });
    });

  });
  return "OK";
}

function numberOfPplJoininedInPrevMonthOrBefore(roomUsersSnapshot, monthlyBillTag) {
  var numberOfPersons = 0;
  roomUsersSnapshot.forEach(function (inmateSnap) {
    var inmateInfo = inmateSnap.val();
    console.log("In numberOfPplJoininedInPrevMonthOrBefore: user=" + inmateInfo.name + ", inmateDOJ=" + inmateInfo.doj + ", billTag=" + monthlyBillTag);
    if (bkutils.userJoinedLastMonthOrBefore(inmateInfo, monthlyBillTag)) {
      numberOfPersons++;
    }
  });
  return numberOfPersons;
}

const bkutils = require('./bkutils');
const { response } = require('express');

//TODO Enhancement Generate bills for one room user:
function generateBillsForRoom(monthlyBillTag, roomId) {
  //TODO
}

function generateBills(monthlyBillTag) {
  console.log("LET us retrieve:" + SITE + '/MonthlyBills/' + monthlyBillTag + "#");
  admin.database().ref(SITE + '/MonthlyBills/' + monthlyBillTag + '/').once('value').then(function (billObjSnap) {
    var monthlyBillObj = billObjSnap.val();
    if (monthlyBillObj == null) {
      console.log("\n **** ERROR: MonthlyBill OBject not found under /MonthlyBills/, cannot start the bill generation job");
      return;
    }
    console.log("\n Retrieved monthlyBill object with BillTag:" + monthlyBillTag + ", billOBj:" + JSON.stringify(monthlyBillObj));

    //TODO: should make it part of the above once block, can the fetch be made parallel and we need to wait for all of them to succeed??
    admin.database().ref(SITE + '/AccIndexes/active/').once('value').then(function (activeInmateSnap) {
      var allActiveInmatesObj = activeInmateSnap.val();
      if (allActiveInmatesObj == null) {
        console.log("\n **** ERROR: Fetching all inmates under /AccIndexes/active/ failed, cannot start the bill generation job");
        return;
      }
      console.log("\n Retrieved all active inmates for monthlyBill gen with BillTag:" + monthlyBillTag);

      //Retrieve room meter for this monthly bill
      admin.database().ref(SITE + '/RoomMeter/' + monthlyBillObj.readingDate).once('value').then(function (metersSnap) {
        var metersObj = metersSnap.val();
        if (metersObj == null) {
          console.log("\n **** ERROR: Fetching room meters under /RoomMeter/ for reading date:" + monthlyBillObj.readingDate);
          return;
        }
        console.log("\n Retrieved Meter readings for reading date:" + monthlyBillObj.readingDate);

        activeInmateSnap.forEach(function (roomUsersSnapshot) {
          var roomId = roomUsersSnapshot.key;
          var roomUsersData = roomUsersSnapshot.val();
          console.log("\n Processing room:" + roomId);
          console.log("\n Processing room:" + roomId + ", room users data==>" + JSON.stringify(roomUsersData));
          //roomUsersData.forEach(function(inmateSnap) {
          const numPersons = numberOfPplJoininedInPrevMonthOrBefore(roomUsersSnapshot, monthlyBillTag);  //roomUsersSnapshot.numChildren();
          const meterUnitRate = 8.4;
          var chargePerPerson = 0;
          if (metersObj[roomId].fixedCharge == true) {
            chargePerPerson = metersObj[roomId].chargePerPerson;
          } else {
            chargePerPerson = Math.ceil(meterUnitRate * (metersObj[roomId].meterReading - metersObj[roomId].lastMeterReading) / numPersons + 100);
          }
          console.log("\n call billGenerate for users now, RoomNo:" + roomId + ", numpersons=" + numPersons + ", isFixed=" + metersObj[roomId].fixedCharge + ", chargePerperson=" + chargePerPerson);
          roomUsersSnapshot.forEach(function (inmateSnap) {
            console.log("==>user:" + JSON.stringify(inmateSnap));
            var inmateInfo = inmateSnap.val();

            var ref = admin.database().ref();
            var newPostRef = ref.push();
            var newTransactionKey = newPostRef.key;

            billGenerate(inmateSnap.key, inmateInfo, monthlyBillTag, chargePerPerson, roomId, newTransactionKey);
          });
          console.log("\n Meter reading for room:" + roomId + " ==>" + JSON.stringify(metersObj[roomId]));
        });

      }).then(function () {
        admin.database().ref(SITE + `/jobs/monthlybill/${monthlyBillTag}/genbills`).set("generated");
        //    monthlyBillObj.billStatus = "GENERATED";
        admin.database().ref(SITE + '/MonthlyBills/' + monthlyBillTag + '/billStatus').set("GENERATED");
      });
    });

  });
  return "OK";
}





//generatePaytmPayLinkForInvoice(paytmParams)



//Commented, unused code:

/*exports.addLedgerEntry = functions
  .database //.instance('pgmgmt-619ec-default-rtdb')
  .ref(SITE + '/AccTransactionsXXX/{accountId}/{transactionId}/')
  .onWrite((change, context) => {
    //console.log("\nis it getting triggered");
    //const transaction = change.before.val();

    accountId = context.params.accountId;
    console.log("Function: addLedgerEntry Account id:" + accountId + ", transaction uid:" + context.params.transactionId);

    var beforeAmount = 0;
    //if transaction is null it is a new account or a new transaction
    if (change.before.val() !== null) {
      beforeAmount = Number(change.before.val());
      //beforeAmount = transaction.transactionAmount;
    } else {
      console.log(" BeforeTransaction is null");
      beforeAmount = 0;
    }

    var afterAmount = 0;
    if (change.after.val() !== null) {
      afterAmount = Number(change.after.val());
    } else {
      console.log(" AfterTransaction is null");
      afterAmount = 0;
      //Remove this transaction ledger entry
    }

    console.log(" before value=" + beforeAmount + ", after value=" + afterAmount);

    var accBalance = 0;
    admin.database().ref(SITE + '/Accounts/' + accountId + '/computedBalance').once('value').then(function (snap) {
      //Account itself is gone, dont bother calculating the balance
      if (snap.val() === null) {
        console.log("  THIS CANT BE ... WHY: GONE Account id:" + accountId + ", dont bother calculating the balance Acc Loc:" + SITE + '/Accounts/' + accountId + '/computedBalance' + "#");
        return;
      }

      updateAccountId = context.params.accountId;
      accBalance = snap.val();
      console.log("\n   previous accBalance= " + accBalance + ", transaction prevValue:" + beforeAmount + ", new Value:" + afterAmount);

      accBalance = accBalance + afterAmount - beforeAmount;

      console.log(" Calculated accBalance= " + accBalance);

      return admin.database().ref(SITE + "/Accounts/" + updateAccountId).update({
        "computedBalance": accBalance
      });

    });
    console.log("End of function: .......................\n");
    return "OK";
  }); */

/*TODO: Index info updation for Account
  Account can be
   1. Newly created
       --> add the account info appropriately under the room in which user is added
          --> change.before will be null
   2.  can be deleted
       --> delete the account info appropriately under the room in which user is added
           --> change.after will be null
   3. Account can be modified
       --> If the user room changes, add the account info to the new room
       --> Delete the user info under the old room no.
       --> Copy New Info under the new roomNo.

       newRoomNo
       oldRoomNo
       balance
       doj
       name
       phone
   4. TODO TODO: Had to take care of moving to archive and master accounts (non inmate accounts), add separate functions for them??

*/

//Look at billgen.js
//{siteName}/jobs/monthlybill/{monthlyBillTag}/genebbills


//CRON.........
/*exports.scheduledFunction = functions.pubsub.schedule('every day 00:05').onRun((context) => {
  console.log('This will be run every 5 minutes!');
});


exports.scheduledFunction = functions.pubsub.schedule('every 1 minute').onRun((context) => {
  console.log('This will be run every 5 minutes!');
});*/

exports.scheduledFunctionCrontab = functions.pubsub.schedule('15 14 * * *')
  .timeZone('Asia/Kolkata') // Users can choose timezone - default is America/Los_Angeles
  .onRun((context) => {
  console.log('This will be run every day at 14:15 AM IST!');

  usermgmt.colorAllTheCustomers2("RazzakGarden", null);
  return null;
});

// exports.beforeCreate = functions.auth.user().beforeCreate((user, context) => {
//   var allowedUsers = ['OcKrYAhROgU7vcWsgbqsgna0uiN2', 'wnUNZDCxzgXmzlmCb0dHpUPkiUO2', 'ZIUJv3Vim7Ptctz1oU6LHmpeZMy2'];

//   // if they are not in the list, they cannot make an account
//   // throwing this error will prevent account creation
//   if(allowUsers.indexOf(user.uid) == -1) throw new functions.auth.HttpsError('permission-denied');

// });