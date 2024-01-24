const https = require('https');
/*
* import checksum generation utility
* You can get this utility from https://developer.paytm.com/docs/checksum/
*/
//const PaytmChecksum = require('./PaytmChecksum');
//const PaytmChecksum = require('./paytmchecksum');
const PaytmChecksum = require('paytmchecksum');
const PaytmConfig = require('./paytmconfig');
var admin = require("firebase-admin");
const functions = require('firebase-functions');
//-------------------------------


exports.generatePaytmPayLinkForInvoice = function (paytmParams, response) {

  console.log('key is..................' + PaytmConfig.PaytmConfig.key);
  console.log('mid is..................' + PaytmConfig.PaytmConfig.mid);
  console.log('mid is..................' + PaytmConfig.PaytmConfig.hostname);
  PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), PaytmConfig.PaytmConfig.key).then(function (checksum) {

    paytmParams.head = {
      "tokenType": "AES",
      "signature": checksum
    };

    var post_data = JSON.stringify(paytmParams);

    var options = {

      hostname: PaytmConfig.PaytmConfig.hostname,

      port: 443,
      path: '/link/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length
      }
    };

    var httpResponse = "";
    var post_req = https.request(options, function (post_res) {
      post_res.on('data', function (chunk) {
        httpResponse += chunk;
      });
      post_res.on('end', function () {
        console.log('Response: ', httpResponse);
        response.send('sent=' + post_data + '\n\n..Response=' + httpResponse);
      });
    });

    console.log("write to paytm server now....");
    post_req.write(post_data);
    post_req.end();
  });
}

exports.processResponse = async function (req, res) {
  console.log("....................OK OK OK in callback that is coool... indeeed req body-->" + JSON.stringify(req.body));
  SITE = req.params.siteName;

  //TODO: IKK: handle error cases and return appropriate message to user

  data = JSON.parse(JSON.stringify(req.body))

  const paytmChecksum = data.CHECKSUMHASH

  //  var transDateTimestamp = data.TXTDATE == undefined? (new Date()).getTime():data.TXTDATE;
  var transDateTimestamp = data.TXTDATE == undefined ? new Date().toJSON().slice(0, 10) : data.TXTDATE;
  //Update the db
  var orderData = {};
  //orderData["result/"+"request"] = JSON.parse(post_data);
  orderData["result/" + "response"] = data;
  admin.database().ref("/" + SITE + "/paytm/" + orderId).update(orderData);
  var userTransactionStatus = {};
  userTransactionStatus[data.ORDERID] = {
    "orderId": data.ORDERID,
    "status": data.STATUS,
    "amount": data.TXNAMOUNT,
    "dateTime": transDateTimestamp,
    "mode": "paytm"
  };

  var customerId;
  admin.database().ref(SITE + '/paytm/' + data.ORDERID + '/init/request/body/userInfo/custId').once('value').then(function (custId) {
    customerId = custId.val();
    console.log('Retrieved user id::::::::' + customerId);
    //admin.database().ref("/" + SITE + "/userTransactionStatus/" + customerId).update(userTransactionStatus);
    //admin.database().ref("/" + SITE + "/userTransactionStatus/" + customerId + "/lastTransaction").update(userTransactionStatus);

    admin.database().ref("/" + SITE + "/userTransactionStatus/" + customerId + '/' + data.ORDERID).update({
      "orderId": data.ORDERID,
      "status": data.STATUS,
      "amount": data.TXNAMOUNT,
      "dateTime": transDateTimestamp,
      "mode": "paytm"
    });
    admin.database().ref("/" + SITE + "/lastTransaction/" + customerId).update({
      "orderId": data.ORDERID,
      "status": data.STATUS,
      "amount": data.TXNAMOUNT,
      "dateTime": transDateTimestamp,
      "mode": "paytm"
    });

    if (data.STATUS == "TXN_SUCCESS") {
      //TODO add transaction for this user:
      var billData = {};
      const date = new Date();
      var newTransactionKey = admin.database().ref().push().key;
      billData["AccTransactions/" + customerId + "/" + newTransactionKey] = {
        "accountUID": customerId,
        "billTag": data.ORDERID,
        "description": "Collection, paytm ",
        "mLongCreatedTimestamp": + date,
        "mLongModifiedTimestamp": + date,
        "modifiedTransactionTimestamp": + date,
        "timeMillis": + date,
        "transactionAmount": Math.round(data.TXNAMOUNT),
        "uid": newTransactionKey
      };
      console.log('New transaction for user:' + JSON.stringify(billData));
      admin.database().ref(SITE).update(billData);

    } //Else TODO
    else {
      console.log('Transaction failed not adding accTransaction');
    }
  });


  var isVerifySignature = PaytmChecksum.verifySignature(data, PaytmConfig.PaytmConfig.key, paytmChecksum)
  if (isVerifySignature) {
    console.log("Checksum Matched");

    var paytmParams = {};

    paytmParams.body = {
      "mid": PaytmConfig.PaytmConfig.mid,
      "orderId": data.ORDERID,
    };

    PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), PaytmConfig.PaytmConfig.key).then(function (checksum) {
      paytmParams.head = {
        "signature": checksum
      };

      var post_data = JSON.stringify(paytmParams);

      var options = {
        hostname: PaytmConfig.PaytmConfig.hostname,

        port: 443,
        path: '/v3/order/status',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': post_data.length
        }
      };

      // Set up the request
      var response = "";
      var post_req = https.request(options, function (post_res) {
        post_res.on('data', function (chunk) {
          response += chunk;
        });

        post_res.on('end', function () {
          console.log('Response: ', response);

          res.send(`<html>
              <head>
                <title>Payment status</title>
              </head>
              <body>
                <h2>Please wait, loading your payment status</h2>
                            <script type="text/javascript"> window.location.replace("${PaytmConfig.PaytmConfig.mywebsite}/RazzakGarden/myhome?load=lasttransaction"); </script>
              </body>
          </html>`);

          res.end()
        });
      });

      // post the data
      post_req.write(post_data);
      post_req.end();
    });
  } else {
    console.log("Checksum Mismatched");
  }
  console.log("End of ....................OK OK OK in callback that is coool... indeeed");
};
  
 
  var orderId = 7232243721;
  var paytmParams = {};
  paytmParams.body = {
    "requestType": "Payment",
    "mid": PaytmConfig.PaytmConfig.mid,
    "websiteName": PaytmConfig.PaytmConfig.website,
    "orderId": orderId,
    /*"enablePaymentMode": [{
      "mode": "UPI",
      "channels": ["UPIPUSH"],
    }], */
    "callbackUrl": "http://135.250.127.49:5000/RazzakGarden/callback",

    "txnAmount": {
        "value": 7,
        "currency": "INR",
    },
    "userInfo": {
        "custId": "iindukumar@gmail.com",
    },
  }; 

const userbill = require('./userbill');
const { response } = require('express');

/*
* Generate checksum by parameters we have in body
* Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
*/
exports.initiatePayTmTransaction = function(paytmParams, clientResponse, orderId, SITE, userbill, transactionIdsArr) {
  PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), PaytmConfig.PaytmConfig.key).then(function (checksum) {

    paytmParams.head = {
      "signature": checksum
    };

    var post_data = JSON.stringify(paytmParams);

    var options = {

      /* for Staging */
      hostname: PaytmConfig.PaytmConfig.hostname,

      port: 443,
      path: '/theia/api/v1/initiateTransaction?mid='+PaytmConfig.PaytmConfig.mid+'&orderId='+orderId,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length
      }
    };

    console.log("....... path is :"+options.path+"..... hostname:"+options.hostname);
    var response = "";
    var post_req = https.request(options, function (post_res) {
      post_res.on('data', function (chunk) {
        response += chunk;
      });



      post_res.on('end', function () {
        console.log('Response: ', response);
        response = JSON.parse(response);
        console.log('txnToken:', response);
        //clientResponse.send('sent=' + post_data + '\n\n..Response=' + response);

        //Store the request, response in db
        var orderData = {};
        orderData["init/"+"request"] = JSON.parse(post_data);
        orderData["init/"+"response"] = response;
        admin.database().ref("/"+SITE + "/paytm/" + orderId).update(orderData);

        var bkTransactionKey = admin.database().ref().push().key;
        //console.log('..........creating bkTransactionKey key:'+bkTransactionKey);
//TODO Make it a function
        //Store it against user as 'inprogress' 
        var userTransactionStatus = {};
        userTransactionStatus[orderId] = {
            "orderId": orderId,
            "status": "inprogress",
            "amount": paytmParams.body.txnAmount.value, //Math.abs(userbill.computedBalance),
            "mode": "paytm",
            "uid": userbill.uid,
            "name":userbill.name,
            "bkTransactionKey":bkTransactionKey,
            "userbills":transactionIdsArr
          };
          admin.database().ref("/"+SITE + "/userTransactionStatus/"+userbill.uid).update(userTransactionStatus);
          admin.database().ref("/"+SITE + "/lastTransaction/"+userbill.uid).update({
            "orderId": orderId,
            "status": "inprogress",
            "amount": paytmParams.body.txnAmount.value, //Math.abs(userbill.computedBalance),
            "mode": "paytm",
            "uid": userbill.uid,
            "name":userbill.name,
            "userbills":transactionIdsArr
          });

        clientResponse.send(`<html>
        <head>
            <title>Show Payment Page</title>
        </head>
        <body>
            <center>
                <h1>Please do not refresh this page...</h1>
            </center>
            <form method="post" action="https://${PaytmConfig.PaytmConfig.hostname}/theia/api/v1/showPaymentPage?mid=${PaytmConfig.PaytmConfig.mid}&orderId=${orderId}" name="paytm" id="pytm">
                <table border="1">
                    <tbody>
                        <input type="hidden" name="mid" value="${PaytmConfig.PaytmConfig.mid}">
                            <input type="hidden" name="orderId" value="${orderId}">
                            <input type="hidden" name="txnToken" value="${response.body.txnToken}">
                 </tbody>
              </table>
                            <script type="text/javascript"> document.getElementById('pytm').submit(); </script>
           </form>
        </body>
     </html>`);
      });
    });

    console.log(".... writing post data to paytm...........:"+post_data);
    post_req.write(post_data);
    post_req.end();
  });
}

exports.initiatePayTmPayLinkTransaction = function(paytmParams, clientResponse, orderId, SITE, userbill, transactionIdsArr) {



  PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), PaytmConfig.PaytmConfig.key).then(function (checksum) {

    paytmParams.head = {
      "tokenType"   : "AES",
      "signature": checksum
    };

    var post_data = JSON.stringify(paytmParams);

    var options = {

      hostname: PaytmConfig.PaytmConfig.hostname,

      port: 443,
      path: '/link/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length
      }
    };

    console.log("....... path is :"+options.path+"..... hostname:"+options.hostname);
    var response = "";
    var post_req = https.request(options, function (post_res) {
      post_res.on('data', function (chunk) {
        response += chunk;
      });



      post_res.on('end', function () {
        console.log('Response: ', response);
        response = JSON.parse(response);
        console.log('txnToken:', response);
        //clientResponse.send('sent=' + post_data + '\n\n..Response=' + response);

        //Store the request, response in db
        var orderData = {};
        orderData["init/"+"request"] = JSON.parse(post_data);
        orderData["init/"+"response"] = response;
        admin.database().ref("/"+SITE + "/paytm/" + orderId).update(orderData);

        var bkTransactionKey = admin.database().ref().push().key;
        //console.log('..........creating bkTransactionKey key:'+bkTransactionKey);
//TODO Make it a function
        //Store it against user as 'inprogress' 
        var userTransactionStatus = {};
        userTransactionStatus[orderId] = {
            "orderId": orderId,
            "status": "inprogress",
            "amount": paytmParams.body.txnAmount.value, //Math.abs(userbill.computedBalance),
            "mode": "paytmLink",
            "uid": userbill.uid,
            "name":userbill.name,
            "bkTransactionKey":bkTransactionKey,
            "userbills":transactionIdsArr
          };
          admin.database().ref("/"+SITE + "/userTransactionStatus/"+userbill.uid).update(userTransactionStatus);
          admin.database().ref("/"+SITE + "/lastTransaction/"+userbill.uid).update({
            "orderId": orderId,
            "status": "inprogress",
            "amount": paytmParams.body.txnAmount.value, //Math.abs(userbill.computedBalance),
            "mode": "paytmLink",
            "uid": userbill.uid,
            "name":userbill.name,
            "userbills":transactionIdsArr
          });

        clientResponse.send(response.body.shortUrl);
      });
    });

    console.log(".... writing post data to paytm...........:"+post_data);
    post_req.write(post_data);
    post_req.end();
  });
}

var paytmPayLinkParams = {};

paytmPayLinkParams.body = {
    "mid"             : PaytmConfig.PaytmConfig.mid,
    "linkType"        : "GENERIC",
    "linkDescription" : "Test Payment description",
    "linkName"        : "VarshaHostel",
};


exports.collectPayLinkPayment = function (req, res) {
  SITE = req.params.siteName;
  var userid = req.query.customer;
  var amount = req.query.amount;
  let transactionIds = req.query.transactionIds;
  console.log('***********user_id:'+userid);
  console.log('***********user_id from params: '+req.params.user);
  console.log('*****************transactionIds:'+transactionIds);
  var transactionIdsArr = transactionIds != undefined? transactionIds.split(",").filter(function (element) {
         return element != "";
  }):"";
  console.log('*****************transactionIds:'+transactionIdsArr+", amount:"+amount);
  userbill.getUserBill(userid).then(userbill => {
    console.log("Site is:" + SITE);
    console.log("Site is in match:" + req.params.siteName);
    console.log("UserBill JSON Is ........" + JSON.stringify(userbill));
    orderId = new Date().getTime();
    if (process.env.FUNCTIONS_EMULATOR) {
      paytmPayLinkParams.body.statusCallbackUrl = "http://135.250.127.49:5000/" + SITE + "/paylinkcallback";
    } else {
      paytmPayLinkParams.body.statusCallbackUrl = "https://www.varshahostel.com/" + SITE + "/paylinkcallback";
    }
    paytmPayLinkParams.body.amount = Math.abs(amount);
    paytmPayLinkParams.body.customerId = userbill.uid;
    paytmPayLinkParams.body.merchantRequestId = orderId;
    //paytmPayLinkParams.invoiceId = orderId; //TODO:
    //paytmPayLinkParams.linkNotes = orderId; //TODO:
    paytmPayLinkParams.body.partialPayment = false; 
//    paytmPayLinkParams.redirectionUrlFailure = ; //TODO
    
    this.initiatePayTmPayLinkTransaction(paytmPayLinkParams, res, orderId, SITE, userbill, transactionIdsArr);
  });
}

exports.collectPayment = function (req, res) {
  SITE = req.params.siteName;
  var userid = req.query.customer;
  var amount = req.query.amount;
  let transactionIds = req.query.transactionIds;
  console.log('***********user_id:'+userid);
  console.log('***********user_id from params: '+req.params.user);
  console.log('*****************transactionIds:'+transactionIds);
  var transactionIdsArr = transactionIds != undefined? transactionIds.split(",").filter(function (element) {
         return element != "";
  }):"";
  console.log('*****************transactionIds:'+transactionIdsArr+", amount:"+amount);
  userbill.getUserBill(userid).then(userbill => {
    console.log("Site is:" + SITE);
    console.log("Site is in match:" + req.params.siteName);
    console.log("UserBill JSON Is ........" + JSON.stringify(userbill));
    orderId = new Date().getTime();
    paytmParams.body.orderId = orderId;
    paytmParams.body.txnAmount.value = Math.abs(amount); //Math.abs(userbill.computedBalance);
    paytmParams.body.userInfo.custId = userbill.uid;
    //TODO test set the callbackURL:
    if (process.env.FUNCTIONS_EMULATOR) {
      paytmParams.body.callbackUrl = "http://135.250.127.49:5000/" + SITE + "/callback";
    } else {
      paytmParams.body.callbackUrl = "https://www.varshahostel.com/" + SITE + "/callback";
    }
    this.initiatePayTmTransaction(paytmParams, res, orderId, SITE, userbill, transactionIdsArr);
  });
}

exports.initiateSetuTransaction = function (paytmParams, clientResponse, orderId, SITE, userbill) {
  
}



exports.generatePayTmToken1 = functions.https.onCall(async(data, context) => {

  console.log("********************Calling generatePayTmToken********************");
  var userid = data.userid;
  var amount = data.amount;
  SITE = data.SITE;
  return userbill.getUserBill(userid).then(userbill => {
    console.log("Site is:" + SITE);
    //console.log("Site is in match:" + req.params.siteName);
    console.log("UserBill JSON Is ........" + JSON.stringify(userbill));
    orderId = new Date().getTime();
    paytmParams.body.orderId = orderId;
    paytmParams.body.txnAmount.value = Math.abs(amount); //Math.abs(userbill.computedBalance);
    paytmParams.body.userInfo.custId = userbill.uid;
    //TODO test set the callbackURL:
    if (process.env.FUNCTIONS_EMULATOR) {
      paytmParams.body.callbackUrl = "http://135.250.127.49:5000/" + SITE + "/callback";
    } else {
      paytmParams.body.callbackUrl = "https://www.varshahostel.com/" + SITE + "/callback";
    }
    //this.initiateTransaction(paytmParams, res, orderId, SITE, userbill);

    //function(paytmParams, clientResponse, orderId, SITE, userbill) {
    return PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), PaytmConfig.PaytmConfig.key).then(function async(checksum) {

      paytmParams.head = {
        "signature": checksum
      };

      var post_data = JSON.stringify(paytmParams);

      var options = {

        /* for Staging */
        hostname: PaytmConfig.PaytmConfig.hostname,

        port: 443,
        path: '/theia/api/v1/initiateTransaction?mid=' + PaytmConfig.PaytmConfig.mid + '&orderId=' + orderId,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': post_data.length
        }
      };

      console.log("....... path is :" + options.path + "..... hostname:" + options.hostname);
      var response = "";
      var post_req = https.request(options, async function (post_res) {
        post_res.on('data', function (chunk) {
          response += chunk;
        });



        return post_res.on('end', async function () {
          console.log('Response: ', response);
          response = JSON.parse(response);
          console.log('-----txnToken:', response);
          //clientResponse.send('sent=' + post_data + '\n\n..Response=' + response);

          //Store the request, response in db
          var orderData = {};
          orderData["init/" + "request"] = JSON.parse(post_data);
          orderData["init/" + "response"] = response;
          admin.database().ref("/" + SITE + "/paytm/" + orderId).update(orderData);

          var bkTransactionKey = admin.database().ref().push().key;
          //console.log('..........creating bkTransactionKey key:'+bkTransactionKey);
          //TODO Make it a function
          //Store it against user as 'inprogress' 
          var userTransactionStatus = {};
          userTransactionStatus[orderId] = {
            "orderId": orderId,
            "status": "inprogress",
            "amount": Math.abs(userbill.computedBalance),
            "mode": "paytm",
            "uid": userbill.uid,
            "name": userbill.name,
            "bkTransactionKey": bkTransactionKey
          };
          admin.database().ref("/" + SITE + "/userTransactionStatus/" + userbill.uid).update(userTransactionStatus);
          admin.database().ref("/" + SITE + "/lastTransaction/" + userbill.uid).update({
            "orderId": orderId,
            "status": "inprogress",
            "amount": Math.abs(userbill.computedBalance),
            "mode": "paytm",
            "uid": userbill.uid,
            "name": userbill.name
          });

          console.log("******** return from promise????.......");
         return setTimeout(function() {
            console.log("******** timeout passed.......");
          return {
            mid: PaytmConfig.PaytmConfig.mid,
            orderId: orderId,
            txnToken: response.body.txnToken,
          };
        }, 2000);

        return {
          mid: PaytmConfig.PaytmConfig.mid,
          orderId: orderId,
          txnToken: response.body.txnToken,
        };

          clientResponse.send(`<html>
        <head>
            <title>Show Payment Page</title>
        </head>
        <body>
            <center>
                <h1>Please do not refresh this page...</h1>
            </center>
            <form method="post" action="https://${PaytmConfig.PaytmConfig.hostname}/theia/api/v1/showPaymentPage?mid=${PaytmConfig.PaytmConfig.mid}&orderId=${orderId}" name="paytm" id="pytm">
                <table border="1">
                    <tbody>
                        <input type="hidden" name="mid" value="${PaytmConfig.PaytmConfig.mid}">
                            <input type="hidden" name="orderId" value="${orderId}">
                            <input type="hidden" name="txnToken" value="${response.body.txnToken}">
                 </tbody>
              </table>
                            <script type="text/javascript"> document.getElementById('pytm').submit(); </script>
           </form>
        </body>
     </html>`);
        });
      });

      console.log(".... writing post data to paytm...........:" + post_data);
      post_req.write(post_data);
      post_req.end();
      return post_req;

    });
  });
  console.log("********************Done Calling generatePayTmToken");
});

exports.generatePayTmToken = functions.https.onCall(async (data, context) => {
  console.log("********************Calling generatePayTmToken********************");
  var userid = data.userid;
  var amount = data.amount;
  SITE = data.SITE;

  console.log('&&&&&&&&&&&&&&&&&Calling getUserBill.....');
  var customerBill;
  await userbill.getUserBill(userid).then(bill => {
    console.log('&&&&&&&&&&&&&&&&&getUserBill then.....');
    console.log("Site is:" + SITE);
    //console.log("Site is in match:" + req.params.siteName);
    //console.log("UserBill JSON Is ........" + JSON.stringify(userbill));
    customerBill = bill;
  });


  orderId = new Date().getTime() + "OrID";
  paytmParams.body.orderId = orderId;
  paytmParams.body.txnAmount.value = Math.abs(amount);
  paytmParams.body.userInfo.custId = customerBill.uid;
  if (process.env.FUNCTIONS_EMULATOR) {
    paytmParams.body.callbackUrl = "http://135.250.127.49:5000/" + SITE + "/callback";
  } else {
    paytmParams.body.callbackUrl = "https://www.varshahostel.com/" + SITE + "/callback";
  }

  console.log('&&&&&&&&&&&&&&&&&After Calling getUserBill.....');

  await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), PaytmConfig.PaytmConfig.key).then(async function (checksum) {

    paytmParams.head = {
      "signature": checksum
    };

    var post_data = JSON.stringify(paytmParams);

    var options = {

      /* for Staging */
      hostname: PaytmConfig.PaytmConfig.hostname,

      port: 443,
      path: '/theia/api/v1/initiateTransaction?mid=' + PaytmConfig.PaytmConfig.mid + '&orderId=' + orderId,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length
      }
    };

    console.log("....... path is :" + options.path + "..... hostname:" + options.hostname);
    var response = "";
    var txnToken;
    return new Promise(function (resolve, reject) {
      var post_req = https.request(options, async function (post_res) {
        post_res.on('data', function (chunk) {
          response += chunk;
        });



        await post_res.on('end', function () {
          console.log('Response: ', response);
          response = JSON.parse(response);
          console.log('-----txnToken:', response);
          //clientResponse.send('sent=' + post_data + '\n\n..Response=' + response);

          //Store the request, response in db
          var orderData = {};
          orderData["init/" + "request"] = JSON.parse(post_data);
          orderData["init/" + "response"] = response;
          admin.database().ref("/" + SITE + "/paytm/" + orderId).update(orderData);

          var bkTransactionKey = admin.database().ref().push().key;
          //console.log('..........creating bkTransactionKey key:'+bkTransactionKey);
          //TODO Make it a function
          //Store it against user as 'inprogress' 
          var userTransactionStatus = {};
          userTransactionStatus[orderId] = {
            "orderId": orderId,
            "status": "inprogress",
            "amount": Math.abs(amount),
            "mode": "paytm",
            "uid": userid,
            "name": customerBill.name,
            "bkTransactionKey": bkTransactionKey
          };
          admin.database().ref("/" + SITE + "/userTransactionStatus/" + customerBill.uid).update(userTransactionStatus);
          admin.database().ref("/" + SITE + "/lastTransaction/" + customerBill.uid).update({
            "orderId": orderId,
            "status": "inprogress",
            "amount": Math.abs(amount),
            "mode": "paytm",
            "uid": customerBill.uid,
            "name": customerBill.name,
            "phone": customerBill.phone

          }).then(function () {
            console.log("******** The final resolve????.......");
            resolve(response.body.txnToken);
          });

          console.log("******** return from promise????.......");
        });
      });


      console.log(".... writing post data to paytm...........:" + post_data);
      post_req.write(post_data);
      post_req.end();
      return post_req;
    });

  }).then((value) => {
    console.log('Ok in the then of promise value:' + value);
    txnToken = value;
  });

  console.log('&&&&&&&&&&&&&&&&& After generate Signature .....mid: ' + PaytmConfig.PaytmConfig.mid + ', orderID: ' + orderId +
    ', txnToken: ' + txnToken);

  return {
    mid: PaytmConfig.PaytmConfig.mid,
    orderId: orderId,
    txnToken: txnToken,
    host: PaytmConfig.PaytmConfig.hostname
  };

});