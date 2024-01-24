const vhadmin = require('./vhadmin');
const bkutils = require('./bkutils');

var admin = require("firebase-admin");

exports.getUserBill = function(user_id) {
    if (process.env.FUNCTIONS_EMULATOR /*&& !vhadmin.userHasAdminAccess(user_id)*/) { //BETA testing user:IKKK Test user
        const ref = admin.database().ref(SITE + '/Accounts/gKsCqAcdNbUgRYzieCtIoKaxYVA3');
        return ref.once('value').then(snap => snap.val());    
    } else {
    const ref = admin.database().ref(SITE + '/Accounts/'+ user_id);
    return ref.once('value').then(snap => snap.val());
    }
}

exports.getPendingBills = function(user_id) {
  if (process.env.FUNCTIONS_EMULATOR && !vhadmin.userHasAdminAccess(user_id)) { //BETA testing user:IKKK Test user
      const ref = admin.database().ref(SITE + '/PendingBills/gKsCqAcdNbUgRYzieCtIoKaxYVA3');
      return ref.once('value').then(snap => snap.val());    
  } else {
  const ref = admin.database().ref(SITE + '/PendingBills/'+ user_id);
  return ref.once('value').then(snap => snap.val());
  }
}

exports.getReceivedBills = function(user_id) {
  if (process.env.FUNCTIONS_EMULATOR && !vhadmin.userHasAdminAccess(user_id)) { //BETA testing user:IKKK Test user
      const ref = admin.database().ref(SITE + '/ReceivedBills/gKsCqAcdNbUgRYzieCtIoKaxYVA3');
      return ref.once('value').then(snap => snap.val());    
  } else {
  const ref = admin.database().ref(SITE + '/ReceivedBills/'+ user_id);
  return ref.once('value').then(snap => snap.val());
  }
}

exports.handler = function(request, response)  {
    SITE = request.params.siteName;
    //console.log('userbill........ site is.....................'+request.params.siteName+', user uid:'+request.user.uid);
    this.getUserBill(request.user.user_id).then(userbill => {
      //console.log("Site is:"+SITE);
      //console.log("Site is in match:"+request.params.siteName);
      //console.log("user JSON Is ........" + JSON.stringify(userbill));
      this.getPendingBills(request.user.user_id).then(pendingBills => {
        var user = request.user;
        var [totalOutstanding, transactionIds] = getTotalOutstanding(pendingBills);
        var discountAmt = 0;
        //TODO: make global constants
        if (totalOutstanding > 3699)
//        if (totalOutstanding > 3)
          discountAmt = 10;
        response.render('userbill', { SITE, userbill, pendingBills, user, totalOutstanding, discountAmt, transactionIds });
      });
    });
};



exports.getUserList = function(request, response) {
    const ref = admin.database().ref(SITE + '/AccIndexes/active');
    return ref.once('value').then(snap => snap.val());
}

//Called from the admin interface using hyperlink
exports.userinfo = function(request, response, userId)  {

  SITE = request.params.siteName;
  //console.log('ADMIN userbill........ site is.....................'+request.params.siteName+', user uid:'+userId);
  this.getUserBill(userId).then(userbill => {
    //console.log("Site is:"+SITE);
    //console.log("Site is in match:"+request.params.siteName);
    //console.log("userbill JSON Is ........" + JSON.stringify(userbill));
    this.getPendingBills(userId).then(pendingBills => {
      var user = request.user;

      var [totalOutstanding, transactionIds] = getTotalOutstanding(pendingBills);
      var discountAmt = 0;
      if (totalOutstanding > 3699)
        discountAmt = 10;
      response.render('userbill', { SITE, userbill, pendingBills, user, totalOutstanding, discountAmt, transactionIds});
    });
  });
};

function getTotalOutstanding(pendingBills) {
  var totalAmt = 0;
  var billIds = "";
  for (var pendingBillId in pendingBills) {
    var oneBill = pendingBills[pendingBillId];
    console.log("................onePendingBill of this user ..bill:" + JSON.stringify(oneBill));

    if (billIds =="")
      billIds = pendingBillId;
    else 
      billIds += ","+pendingBillId;
    totalAmt += Math.abs(oneBill.transactionAmount);
  }
  return [totalAmt, billIds];
}

exports.colorOneUser = async function (SITE, userId, roomId, pendingBills) {

  var minPendingAmtForRedSnap = await admin.database().ref(SITE + '/Globals/inmate_min_pending_amt_for_red').once('value');
  var minPendingAmtForRed = minPendingAmtForRedSnap.val();

  if (minPendingAmtForRed === null || minPendingAmtForRed === undefined) {
    console.log("................null or undefined minPendingAmtForRed:" + minPendingAmtForRed);
    minPendingAmtForRed = 1000;
  }

  console.log("................pendingBills of this user:" + JSON.stringify(pendingBills));
  var userColor = "green";
  if (pendingBills === null || pendingBills === undefined) {
    console.log('No pending bills for user:' + userId);
  } else {
    for (var pendingBillId in pendingBills) {
      var oneBill = pendingBills[pendingBillId];
      console.log("................onePendingBill of this user ..bill:" + JSON.stringify(oneBill));
      console.log("................userid:" + userId + ", billRef:" + pendingBillId + ", dueDate:" + oneBill.dueDate + ", numDaysSinceDueDate:" + bkutils.dateIsHowManyDaysBefore(oneBill.dueDate) + ", color:" + userColor);
      if (bkutils.dateIsHowManyDaysBefore(oneBill.dueDate) > 5) {
        if (userColor === "green") {
          userColor = "orange";
        }

        if (Math.abs(oneBill.transactionAmount) > minPendingAmtForRed) {
          userColor = "red";
        }
      }
      console.log("................... roomID:" + roomId + ", userId:" + userId + ", User color :" + userColor);
    }
  }
  var colorInfo = {};
  colorInfo['/AccIndexes/active/' + roomId + '/' + userId] = {
    "color": userColor
  };
  console.log("................... setting color roomID:" + roomId + ", userId:" + userId + ", User color :" + userColor);
  admin.database().ref(SITE + '/AccIndexes/active/' + roomId + '/' + userId + '/color').set(userColor);
  return userColor;
}

exports.userbillCollected = function(request, response, userId)  {

  SITE = request.params.siteName;

  console.log('usebillcollected userid: '+userId);
  this.getUserBill(userId).then(userbill => {
    this.getReceivedBills(userId).then(pendingBills => {
      var user = request.user;
      var roomId = userbill.roomNo;
      
      //TODO rename userbillPending to userbillPendingOrReceived
      response.render('userbillPending', { SITE, userbill, pendingBills, user });
    });

    });
  }

exports.userNewBill = function(request, response, userId)  {
  response.render('userNewBill', {userId});
}

//TODO remove async after restructuring
exports.userbillPending = /*async */function(request, response, userId)  {

  SITE = request.params.siteName;
  //console.log('ADMIN userbill........ site is.....................'+request.params.siteName+', user uid:'+userId);

  //////////////////ColorOneUser
 /* var minPendingAmtForRedSnap = await admin.database().ref(SITE + '/Globals/inmate_min_pending_amt_for_red').once('value');
  var minPendingAmtForRed = minPendingAmtForRedSnap.val();

  if (minPendingAmtForRed === null || minPendingAmtForRed === undefined) {
    console.log("................null or undefined minPendingAmtForRed:"+ minPendingAmtForRed);
      minPendingAmtForRed = 1000;
  }*/
  /////////////////
  this.getUserBill(userId).then(userbill => {
    //console.log("Site is:"+SITE);
    //console.log("Site is in match:"+request.params.siteName);
    //console.log("userbill JSON Is ........" + JSON.stringify(userbill));
    this.getPendingBills(userId).then(pendingBills => {
      var user = request.user;
      var roomId = userbill.roomNo;
      
      var userColor = "green";
      if (request.query.onlyBills == 'true')
        userColor = this.colorOneUser(SITE, userId, roomId, pendingBills);
      ////////////////
      /*
      console.log("................pendingBills of this user ..bill:"+JSON.stringify(pendingBills));
      var userColor = "green";
      for (var pendingBillId in pendingBills) {
        var oneBill = pendingBills[pendingBillId];
      //pendingBills.forEach(function (oneBill) {
        /////////////////////
          console.log("................onePendingBill of this user ..bill:"+JSON.stringify(oneBill));
          console.log("................userid:"+userId+", billRef:" + pendingBillId + ", dueDate:" + oneBill.dueDate + ", numDaysSinceDueDate:" + bkutils.dateIsHowManyDaysBefore(oneBill.dueDate) + ", color:" + userColor);
          if (bkutils.dateIsHowManyDaysBefore(oneBill.dueDate) > 5) {
            if (userColor === "green") {
              userColor = "orange";
            }

            if (Math.abs(oneBill.transactionAmount) > minPendingAmtForRed) {
              userColor = "red";
            }
          }

 
        console.log("................... roomID:" + roomId + ", userId:" + userId + ", User color :" + userColor);
      }//);
      var colorInfo = {};
      colorInfo['/AccIndexes/active/'+roomId+'/'+userId] = {
          "color": userColor
      };
      console.log("................... setting color roomID:" + roomId + ", userId:" + userId + ", User color :" + userColor);
      admin.database().ref(SITE + '/AccIndexes/active/'+roomId+'/'+userId + '/color').set(userColor);
      */
        /////////////////////////
      var isPendingBills = "true";
      response.render('userbillPending', { SITE, userbill, pendingBills, userId, isPendingBills });
    });

    });
  }

//why is it not working
const usermgmt = require('./usermgmt');

exports.moveBillFromPendingToReceived = function(SITE, userid, transactionId, notes, collectedAmount, newTransactionKey) {    
  var oldRef = admin.database().ref(SITE + '/PendingBills/'+userid+'/'+transactionId);
  var newRef = admin.database().ref(SITE + '/ReceivedBills/'+userid+'/'+transactionId);
  return oldRef.once('value', function(snap)  {
       var userBill = snap.val();
       userBill.notes = notes;
       //-1 denotes this pending bill is fully collected, ie the original invoiced amount is collected.
       if (collectedAmount == -1)
        userBill.collectedAmount = userBill.transactionAmount;
       else
        userBill.collectedAmount = collectedAmount;
       userBill.collectionTransactionUid = newTransactionKey;
       newRef.set(userBill, function(error) {
            if( !error ) {  oldRef.remove(); }
            else if( typeof(console) !== 'undefined' && console.error ) {  console.error(error); }
       });
  });
}

exports.markBillAsPaid = async function(request, response)  {

  SITE = request.params.siteName;
  var onlyBills = request.query.onlyBills;
  var userid = request.query.user;
  var transactionId = request.query.transactionId;
  var notes = request.query.notes;
  var collectedAmount = request.query.camount;

  //Can be removed, billTag info is available in 'snap' returned from moveBillFromPendingToReceived below
  //var monthlyBillTagSnap = await admin.database().ref(SITE + '/PendingBills/'+userid+'/'+transactionId +'/billTag').once('value');
  //var monthlyBillTag = monthlyBillTagSnap.val();

  console.log('***************** userid:'+userid+', transactionId:'+transactionId);

  var ref = admin.database().ref();
  var newPostRef = ref.push();
  var newTransactionKey = newPostRef.key;
//  this.moveBillFromPendingToReceived(movefromRef, moveToRef, notes, collectedAmount, newTransactionKey).then(snap => {
  this.moveBillFromPendingToReceived(SITE, userid, transactionId, notes, collectedAmount, newTransactionKey).then(snap => {

    var userTransactionInfo = snap.val();

    console.log('....................markBillAsPaid:'+JSON.stringify(userTransactionInfo)+", onlyBills="+onlyBills+", notes="+notes+", transactionId:"+transactionId);


    const date = new Date();
    //date.toLocaleString('en-US', {timeZone: 'Asia/Kolkata'});
    //date.setTime(date.getTime()+330000); //IST
    var billData = {};
    var transacAmount = Math.abs(userTransactionInfo.transactionAmount);
    var collectedAmountAbs = Math.abs(collectedAmount);
    var billTag = userTransactionInfo.billTag != null? userTransactionInfo.billTag: "legacy";
    billData["AccTransactions/" + userid + "/" + newTransactionKey] = {
      "accountUID": userid,
      "billTag": billTag,
      "description": "collect " + notes,
      "mLongCreatedTimestamp": + date,
      "mLongModifiedTimestamp": + date,
      "modifiedTransactionTimestamp": + date,
      //"previousBalance": Number(inmateInfo.balance), //TODO: do something here???
      "timeMillis": + date,
      "transactionAmount": collectedAmountAbs, //transacAmount,  
      "uid": newTransactionKey
    };

    ///
    //var cumCollectRef = admin.database().ref('/' + context.params.siteName + '/AccIndexes/active/' + roomNo + '/' + myAccNo + '/balance');    
    var cumCollectRef = admin.database().ref(SITE + '/MonthlyBills/' + billTag + '/totalCollectedAmount'); //.set(cumulativeEBBillAmount); 
    cumCollectRef.transaction(function (collectedBalance) {
      console.log(".................ok setting the collectedAmount for billTag:"+billTag+", trransac amt:"+transacAmount+", prev balance:"+collectedBalance+", total:"+(collectedBalance+transacAmount))
      return collectedBalance + transacAmount;
      });
      
    if (collectedAmountAbs != transacAmount) { //Should it be <
      var writeOffAmount = transacAmount - collectedAmountAbs;
      var writeOffRef = admin.database().ref(SITE + '/MonthlyBills/' + billTag + '/totalWriteOffAmount'); //.set(cumulativeEBBillAmount); 
      writeOffRef.transaction(function (writeOffBalance) {
        console.log(".................ok setting the writeOffAmount for billTag:"+billTag+", trransac amt:"+transacAmount+", writeOffAmount prev balance:"+writeOffBalance+", total:"+(writeOffBalance+writeOffAmount))
        return writeOffBalance + writeOffAmount;
        });
        moveToRef.child("collectedAmt").set(collectedAmountAbs);
    }

    console.log('....................markBillAsPaid billData:'+JSON.stringify(billData));
    admin.database().ref(SITE).update(billData).then(snap=>{
      if (onlyBills == "true") { //onlyBills=true called from userlist
        this.userbillPending(request, response, userid);
      } else {
        this.userinfo(request, response, userid);
      }
    });
  });

};


exports.userBillDuesString = function(request, response, userId)  {

  SITE = request.params.siteName;
 // this.getPendingBills(userId).then(pendingBills => {
    var billDuesString = "";
    const ref = admin.database().ref(SITE + '/PendingBills/'+ userId);
    ref.once('value').then(function (billDataSnap) {
      billDataSnap.forEach(function (billSnap) {
        //var bill = billData.val();
        var bill = billSnap.val();
        console.log("\n.............. bill" + JSON.stringify(bill));
        billDuesString += bill.description +"(due by:" + bill.dueDate+") : Rs."+Math.abs(bill.transactionAmount) + "%0a\n";
      });
      response.send(billDuesString);
  });
};

exports.createauthuser = function(request, response)  {

  SITE = request.params.siteName;
  var userId = request.query.user;
  this.getUserBill(userId).then(userAcc => {
    //console.log("Site is:"+SITE);
    //console.log("Site is in match:"+request.params.siteName);
    //console.log("userbill JSON Is ........" + JSON.stringify(userbill));
    this.createAuthUserForUID(request, response, userAcc);
  });
};

exports.createAuthUserForUID = function (request, response, userAcc) {
  admin.auth().createUser({
    uid: userAcc.uid,
    phoneNumber: userAcc.phone,
    displayName: userAcc.fullName,
    disabled: false,
  })
    .then(user => {
      console.log('::::::::::::::::::::::::::::::: User with phone:' + userAcc.phone + ' uid:' + userAcc.uid);
      response.send('Created authUser with phone:' + userAcc.phone + ' uid:' + userAcc.uid);
    }).catch((error) => {
      console.log('::::::::::::::::::::::::::::::: Failed to create authUser with phone:' + userAcc.phone + ' uid:' + userAcc.uid);
      console.log('Error creating new authUser:', error);
      response.send('Error creating new authUser:', error);
    });;
}

const billgen = require('./billgen');

exports.addOneUserBill = async function (SITE, userId, description, amount) {
  
  let monthlyBillTag = await (await admin.database().ref(SITE + '/Globals/current_bill_tag').once('value')).val();
  //console.log('**********billTag is:'+monthlyBillTag);

  var ref = admin.database().ref();
  var newPostRef = ref.push();
  var newTransactionKey = newPostRef.key;
  const date = new Date();
  var billData = {};

    billData["AccTransactions/" + userId + "/" + newTransactionKey] = {
      "accountUID": userId,
      "billTag": monthlyBillTag,
      "description": description,
      "mLongCreatedTimestamp": + date,
      "mLongModifiedTimestamp": + date,
      "modifiedTransactionTimestamp": + date,
      //TODO: Is previousBalance required
      //"previousBalance": Number(inmateInfo.balance),
      "timeMillis": + date,
      //TODO: only rent amount will be added here
      //Eb+maintenance will be added from eb bill generation separately.
      "transactionAmount": -amount,  
      "uid": newTransactionKey
    };

    //Add bill Tag
    billData["PendingBills/" + userId + "/" + newTransactionKey] = {
      "description": description,
      "transactionAmount": amount,
      "dueDate": billgen.getDueDateFmtForToday(),
      "uid": newTransactionKey,
      "billTag": monthlyBillTag
    };

    admin.database().ref(SITE).update(billData);  

    var billTag = {};
    billTag["BillTags/" + "RENT" + monthlyBillTag] = {
      [newTransactionKey]: userId
    };
    admin.database().ref(SITE).child("BillTags").child("RENT"+monthlyBillTag).update({[newTransactionKey]:userId}).then(snap => snap);
}



exports.addOneUserBillAndMarkItReceived = async function (SITE, userId, description, amount) {

  let monthlyBillTag = await (await admin.database().ref(SITE + '/Globals/current_bill_tag').once('value')).val();
  //console.log('**********billTag is:'+monthlyBillTag);

  var ref = admin.database().ref();
  var newPostRef = ref.push();
  var newTransactionKey = newPostRef.key;
  const date = new Date();
  var billData = {};

  billData["AccTransactions/" + userId + "/" + newTransactionKey] = {
    "accountUID": userId,
    "billTag": monthlyBillTag,
    "description": description,
    "mLongCreatedTimestamp": + date,
    "mLongModifiedTimestamp": + date,
    "modifiedTransactionTimestamp": + date,
    //TODO: Is previousBalance required
    //"previousBalance": Number(inmateInfo.balance),
    "timeMillis": + date,
    //TODO: only rent amount will be added here
    //Eb+maintenance will be added from eb bill generation separately.
    "transactionAmount": amount,
    "uid": newTransactionKey
  };

  //Add bill Tag
  billData["ReceivedBills/" + userId + "/" + newTransactionKey] = {
    "description": description,
    "transactionAmount": amount,
    "dueDate": billgen.getDueDateFmtForToday(),
    "uid": newTransactionKey,
    "billTag": monthlyBillTag,
    "collectedAmount": amount,
    "notes": description,
    "collectionTransactionUid": newTransactionKey
  };

  admin.database().ref(SITE).update(billData);

  var billTag = {};
  billTag["BillTags/" + "RENT" + monthlyBillTag] = {
    [newTransactionKey]: userId
  };
  admin.database().ref(SITE).child("BillTags").child("RENT" + monthlyBillTag).update({ [newTransactionKey]: userId }).then(snap => snap);
}
