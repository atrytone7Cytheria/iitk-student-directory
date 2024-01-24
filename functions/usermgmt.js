const { response } = require("express");
var admin = require("firebase-admin");
const functions = require('firebase-functions');

const bkutils = require('./bkutils');
const userbill = require('./userbill');

var SITE;

//NOT TESTED CODE??, 
exports.updatePhoneIndex = functions
.database
.ref('/{siteName}/AccIndexes/{userStatus}/{roomNo}/{userId}')
.onWrite((change, context) => {
  SITE = context.params.siteName;
  var userId = context.params.userId;
  var roomNo = context.params.roomNo;
  var userStatus = context.params.userStatus;
  
  const afterAccount = change.after.val();
  var newRoomNo = null;
  if (afterAccount != null)
    newRoomNo = afterAccount.roomNo;

    return "OK";
});

exports.generatePhoneIndex = functions
.database
.ref('/{siteName}/jobs/Index/PhoneIndex')
.onWrite((change, context) => {
  SITE = context.params.siteName;

  generatePhoneIndices();
  return "OK";
});

function generatePhoneIndices() {
  console.log('...............ok starting generatePhoneIndices');
  admin.database().ref(SITE + '/AccIndexes/active/').once('value').then(function (activeInmateSnap) {
    activeInmateSnap.forEach(function (roomUsersSnapshot) {
      var roomId = roomUsersSnapshot.key;
      var roomUsersData = roomUsersSnapshot.val();
      roomUsersSnapshot.forEach(function (inmateSnap) {
        var uid = inmateSnap.key;
        var userIndex = inmateSnap.val();        
        console.log("==------>user:" + JSON.stringify(inmateSnap));
        var inmateInfo = inmateSnap.val();
        //if (bkutils.userJoinedLastMonthOrBefore(inmateInfo, monthlyBillTag)) {
        //  usersInthisRoom[userNo] = inmateInfo.name;
        //  userNo++;
        //}
        var phoneIndexData = {};
        phoneIndexData["PhoneIndex/" + userIndex.phone] = {
            "phone": userIndex.phone,
            "uid":uid
        };

        admin.database().ref(SITE).update(phoneIndexData);

      });
    });
  });
}

exports.generateActUserRentAdvanceInfoInIndex = functions
.database
.ref('/{siteName}/jobs/Index/rentadvance')
.onWrite((change, context) => {
  SITE = context.params.siteName;

  generateRentAdvanceInfoInIndex();
  return "OK";
});

function generateRentAdvanceInfoInIndex() {
  const ref = admin.database().ref(SITE + '/AccIndexes/active');
  ref.once('value').then(function(roomsSnap) {
    roomsSnap.forEach(function (roomUsersSnapshot) {
      var roomId = roomUsersSnapshot.key;
      roomUsersSnapshot.forEach(function (inmateSnap) {
        var userId = inmateSnap.key;
        var inmateIndexInfo = inmateSnap.val();
        admin.database().ref(SITE + '/Accounts/'+userId).once('value').then(function(userAccSnap) {
          var userAcc = userAccSnap.val();
          var userRentAdvanceData = {};
          userRentAdvanceData["AccIndexes/active/" + roomId + "/" + userId] = {
            "balance":inmateIndexInfo.balance,
            "doj":inmateIndexInfo.doj,
            "name":inmateIndexInfo.name,
            "phone":inmateIndexInfo.phone,
            "rent": userAcc.inmateRent,
            "advance": userAcc.inmateAdvance,
            "collectedAdvance": userAcc.collectedOnDayOne,
          };
          //console.log("....updating rent advance:"+JSON.stringify(userRentAdvanceData));
          admin.database().ref(SITE).update(userRentAdvanceData);
        });
      });
    });
  });
}

//TODO: add archive user list support also ....
exports.getUserList = function(request, response, usertype) {
    SITE = request.params.siteName;
    //let usertype = request.query.usertype!=null?request.query.usertype:"active";
    const ref = admin.database().ref(SITE + '/AccIndexes/'+usertype);
    return ref.once('value').then(snap => snap.val());
}

exports.handler = function(request, response)  {
  SITE = request.params.siteName;

  //console.log(':::::::::::::::::::userbill LIst....... site is.....................'+request.params.siteName+', user uid:'+request.user.uid);
  let usertype = request.query.usertype!=null?request.query.usertype:"active";
  let printOption = request.query.print!=null?request.query.print:"false";
  
  this.getUserList(request, response, usertype).then(userList => {
    //console.log("########Site is:"+SITE);
    //console.log("########Site is in match:"+request.params.siteName);
    //console.log("########rooms JSON Is ........" + JSON.stringify(userList));
    //console.log("########usertype:"+usertype);
    response.render('userlist', { SITE, userList, usertype, printOption });
  });
};

exports.resetActiveUserBalancesToZero = functions
.database
.ref('/{siteName}/jobs/bills/reset')
.onWrite((change, context) => {
//exports.resetActiveUserBalancesToZero = function(request, response)  {
  SITE = context.params.siteName;
  //console.log("########Site is:"+SITE);

  admin.database().ref(SITE + '/AccIndexes/active/').once('value').then(function (activeInmateSnap) {
    var allActiveInmatesObj = activeInmateSnap.val();
    if (allActiveInmatesObj == null) {
      console.log("\n **** ERROR: Fetching all inmates under /AccIndexes/active/ failed, cannot proceed with resetActiveUserBalancesToZero");
      return;
    }
    activeInmateSnap.forEach(function (roomUsersSnapshot) {
      var roomId = roomUsersSnapshot.key;
      var roomUsersData = roomUsersSnapshot.val();
      console.log("\n Processing room:" + roomId);
      console.log("\n Processing room:" + roomId + ", room users data==>" + JSON.stringify(roomUsersData));


      roomUsersSnapshot.forEach(function (inmateSnap) {
        console.log("==>user:" + JSON.stringify(inmateSnap));
        var inmateInfo = inmateSnap.val();

        if (inmateInfo.balance != 0) {

          var ref = admin.database().ref();
          var newPostRef = ref.push();
          var newTransactionKey = newPostRef.key;

          //console.log("########Site is in match:"+request.params.siteName);
          //console.log("########rooms JSON Is ........" + JSON.stringify(userList));
          //console.log("########usertype:"+usertype);
          //response.render('userlist', { SITE, userList, usertype, printOption });
          const date = new Date();
          var billData = {};
          var monthlyBillTag = 'reset' + date.toLocaleDateString();
          var accountId = inmateSnap.key;

          billData["AccTransactions/" + accountId + "/" + newTransactionKey] = {
            "accountUID": accountId,
            "billTag": monthlyBillTag,
            "description": "Resetting balance to zero",
            "mLongCreatedTimestamp": + date,
            "mLongModifiedTimestamp": + date,
            "modifiedTransactionTimestamp": + date,
            "previousBalance": Number(inmateInfo.balance),
            "timeMillis": + date,
            "transactionAmount": -Number(inmateInfo.balance),
            "uid": newTransactionKey
          };

          billData["monthlySheet/" + monthlyBillTag + "/" + newTransactionKey] = {
            "doj": inmateInfo.doj,
            "roomNo": roomId,
            "inmateName": inmateInfo.name,
            "inmatePhoneNo": inmateInfo.phone,
            "previousBalance": -inmateInfo.balance,
            //"rent": isJoiningDateinPrevMonthOrBefore(inmateInfo.doj)? rentSnap.val():0,
            //"ebAmount": isJoiningDateinPrevMonthOrBefore(inmateInfo.doj)?chargePerPerson:0,
            "rent": -Number(inmateInfo.balance),
            "ebAmount": 0,
            "accountUID": accountId,
            "transactionUid": newTransactionKey
          };

          admin.database().ref(SITE).update(billData);
        }
      });
    });
  });
});

//move user from archive to active and vice versa
exports.moveUser = function(request, response) {
  var userId = request.query.user;
  var roomId = request.query.room;
  let movefrom = request.query.movefrom!=null?request.query.movefrom:"archive";
  let moveto = movefrom == "archive"? "active":"archive"

  SITE = request.params.siteName;
  
  //console.log('::::::::::::::::::::::moveuser... request.params'+JSON.stringify(request.params));
  //console.log('::::::::::::::::::::::moveuser.... userid:'+userId+", roomId:"+roomId+", movefrom:"+movefrom+", moveto:"+moveto);

  var movefromRef = admin.database().ref(SITE + '/AccIndexes/'+movefrom+'/'+roomId+'/'+userId);
  var moveToRef = admin.database().ref(SITE + '/AccIndexes/'+moveto+'/'+roomId+'/'+userId);
  this.moveFbRecord(movefromRef, moveToRef);

  var movefromBranch = movefrom == "archive"? "/archive":"";
  var moveToBranch = moveto == "archive"? "/archive":"";

  var movefromRef = admin.database().ref(SITE + movefromBranch + '/AccTransactions/'+userId);
  var moveToRef = admin.database().ref(SITE + moveToBranch + '/AccTransactions/'+userId);
  this.moveFbRecord(movefromRef, moveToRef);

  var movefromRef = admin.database().ref(SITE + movefromBranch + '/Accounts/'+userId);
  var moveToRef = admin.database().ref(SITE + moveToBranch + '/Accounts/'+userId);
  this.moveFbRecord(movefromRef, moveToRef).then(snap =>{
    this.getUserList(request, response, movefrom).then(userList => {
      //console.log("########Site is:"+SITE);
      //console.log("########Site is in match:"+request.params.siteName);
      //console.log("########rooms JSON Is ........" + JSON.stringify(userList));
      let usertype = movefrom;
      //console.log("########usertype:"+usertype);
      response.render('userlist', { SITE, userList, usertype });
  });
});

 /* ref.once('value').then(function (snap) {
    var fromVal =snap.val();
    console.log('from val:'+fromVal);
    
    admin.database().ref(SITE + '/AccIndexes/'+moveto+'/'+roomId+'/'+userId).update({
      "balance": fromVal.balance,
      "name": fromVal.name,
      "doj": fromVal.doj,
      "phone": fromVal.phone,
    });
  });*/
}

//Thank you : https://gist.github.com/katowulf/6099042
exports.moveFbRecord = function(oldRef, newRef) {    
  return oldRef.once('value', function(snap)  {
       newRef.set( snap.val(), function(error) {
            if( !error ) {  oldRef.remove(); }
            else if( typeof(console) !== 'undefined' && console.error ) {  console.error(error); }
       });
  });
}

exports.colorAllTheCustomers2 = async function(SITE, response) {
  //SITE = request.params.siteName;
  console.log("in color the customers all: SITE:"+SITE);

  var pendingBillsSnap = await admin.database().ref(SITE + '/PendingBills/').once('value');
  
  var allPendingBills = pendingBillsSnap.val();
  //console.log("in color the customers pending bills fetched key:"+pendingBillsSnap.key+"...val="+JSON.stringify(pendingBillsSnap.val()));

  if (allPendingBills === null)
    return response !=null ? response.send("pending bills branch is null ...hmmm"):"OK";

  var minPendingAmtForRedSnap = await admin.database().ref(SITE + '/Globals/inmate_min_pending_amt_for_red').once('value');
  var minPendingAmtForRed = minPendingAmtForRedSnap.val();

  if (minPendingAmtForRed === null || minPendingAmtForRed === undefined) {
    console.log("................null or undefined minPendingAmtForRed:"+ minPendingAmtForRed);
      minPendingAmtForRed = 1000;
  }


  console.log("................minPendingAmtForRed:"+ JSON.stringify(minPendingAmtForRed));

  const ref = admin.database().ref(SITE + '/AccIndexes/active');
  ref.once('value').then(function(roomsSnap) {
    roomsSnap.forEach(function (roomUsersSnapshot) {
      var roomId = roomUsersSnapshot.key;
      roomUsersSnapshot.forEach(function (inmateSnap) {
        var userId = inmateSnap.key;
        var inmateIndexInfo = inmateSnap.val();
        var thisUsersBills = allPendingBills[userId];

        userbill.colorOneUser(SITE, userId, roomId, thisUsersBills);
        /*console.log("................userid:"+userId+", pending bills:"+JSON.stringify(thisUsersBills));
        var userColor = "green";
        if (thisUsersBills === null || thisUsersBills === undefined) {
          console.log('No pending bills for user:' + userId);
        } else {
          for (var pendingBillId in thisUsersBills) {
            var oneBill = thisUsersBills[pendingBillId];
            console.log("................of this user billRef:"+ pendingBillId +"..bill:"+JSON.stringify(oneBill));
            console.log("................userid:"+userId+", billRef:" + pendingBillId + ", dueDate:" + oneBill.dueDate + ", numDaysSinceDueDate:" + bkutils.dateIsHowManyDaysBefore(oneBill.dueDate) + ", color:" + userColor);
            if (bkutils.dateIsHowManyDaysBefore(oneBill.dueDate) > 5) {
              if (userColor === "green") {
                userColor = "orange";
              }

              if (Math.abs(oneBill.transactionAmount) > minPendingAmtForRed) {
                userColor = "red";
              }
            }
          }
          console.log("................... roomID:" + roomId + ", userId:" + userId + ", User color :" + userColor);
          var colorInfo = {};
          colorInfo['/AccIndexes/active/'+roomId+'/'+userId] = {
              "color": userColor
          };
        }
        console.log("................... setting color roomID:" + roomId + ", userId:" + userId + ", User color :" + userColor);
        admin.database().ref(SITE + '/AccIndexes/active/'+roomId+'/'+userId + '/color').set(userColor);
        */
      });
    });
    return response !=null ? response.send("Colored the user") : "OK";
  });
}

exports.colorTheCustomers = function(request, response)  {
  SITE = request.params.siteName;

  this.colorAllTheCustomers2(SITE, response);
  return "OK"  ;
};

exports.fetchStagedAccounts = function(request, response) {
  const ref = admin.database().ref(SITE + '/Staging/Accounts');
  return ref.once('value').then(snap => snap.val());

  /*ref.once('value').then(function(stagedUsersSnap) {
    stagedUsersSnap.forEach(function (oneStagedUserSnapshot) {
      var userId = oneStagedUserSnapshot.key;
      var stagedUserAcc = oneStagedUserSnapshot.val();

    });
  });*/
}

exports.stagedUsers = function(request, response)  {
  SITE = request.params.siteName;

  console.log(':::::::::::::::::::stagedUsers LIst....... site is.....................'+request.params.siteName+', user uid:'+request.user.uid);
  let printOption = request.query.print!=null?request.query.print:"false";
  
  this.fetchStagedAccounts(request, response).then(stagedUserList => {
    //console.log("########Site is:"+SITE);
    //console.log("########Site is in match:"+request.params.siteName);
    //console.log("########rooms JSON Is ........" + JSON.stringify(stagedUserList));
    response.render('stageduserslist', { SITE, stagedUserList, printOption });
  });
};

const billgen = require('./billgen');

exports.approveNewUser = async function (request, response) {
  SITE = request.params.siteName;
  var userId = request.query.user;

  console.log("let us approve user: " + userId + ", .................");

  const ref = admin.database().ref(SITE + '/Staging/Accounts/' + userId);
  const newRef = admin.database().ref(SITE + '/Accounts/' + userId);
  const billTagSnap = await admin.database().ref(SITE + '/Globals/current_bill_tag').once('value');
  const billTag = billTagSnap.val();
  //let stagedUsers = this.stagedUsers;


  await ref.once('value').then(snap => {
    let userAcc = snap.val();

    //userAcc.billTag = billTag;

    if (userAcc == null) {
      console.log("********************* approveNewUser ****** This user doesnt exist in the new user list: "+userId);
      //response.send("This user doesnt exist in the new user list: "+userId);
      return;
    }

    console.log("Approve user...:" + JSON.stringify(userAcc));
    //Move the account from staing to production branch in db
    newRef.set(userAcc, function (error) {
      if (!error) {
          ref.remove(); 
      }
      else if (typeof (console) !== 'undefined' && console.error) { console.error(error); }

      //Add user bill for rent and advance to Received or Pending bills based on the amount collected on day one.
      //Add  partial bills for rent and advance to Received or Pending bills based on the amount collected on day one.
      //Add Transactions to user 
      let userRent = userAcc.inmateRent;
      let userAdvance = userAcc.inmateAdvance;
      let collectedOnDayOne = userAcc.collectedOnDayOne;

      var transactionsbillData = {};

      //add a transaction for user as receivable with a value of rent
      let pendingBillTransactionKey = loadTransactionData(transactionsbillData, -(userRent), "Joining Rent", userId, billTag);
      //console.log("...................pendingBillTransactionKey:" + pendingBillTransactionKey);
      if (userRent <= collectedOnDayOne) { //User paid rent fully
        //add a transaction for user as received with a value of rent
        let newTransactionKey = loadTransactionData(transactionsbillData, (userRent),  userAcc.joiningNote, userId, billTag);

        //add user bill for rent in the received bills
        billgen.loadReceivedBillData(transactionsbillData, "Joining Rent", userAcc.joiningNote, userId, userRent, userRent, userAcc.inmateJoiningDateStr, billTag, newTransactionKey);

      } else {
        //rent not paid fully
        let receivedRent = collectedOnDayOne;
        if (receivedRent != 0) { //user has paid some rent (partial rent) > 0
          //add a transaction for user as received with a value of receivedRent
          let newTransactionKey = loadTransactionData(transactionsbillData, receivedRent,  userAcc.joiningNote, userId, billTag);
          //add user bill for rent in the received bills with received amount of ReceivedRent
          billgen.loadReceivedBillData(transactionsbillData, "Joining Rent",  userAcc.joiningNote, userId, userRent, receivedRent, userAcc.inmateJoiningDateStr, billTag, newTransactionKey);

          //          //add user bill for rent in the Pending bills with amount of userRent - receivedRent
          //          billgen.loadPendingBillData(transactionsbillData, "Joining Rent pending", userId, userRent - receivedRent, userAcc.inmateJoiningDateStr, billTag);

        }
        //add user bill for rent in the Pending bills with amount of userRent - receivedRent
        billgen.loadPendingBillData(transactionsbillData, "Joining Rent pending", userId, userRent - receivedRent, userAcc.inmateJoiningDateStr, billTag, pendingBillTransactionKey);
      }

      let advanceReceived = collectedOnDayOne - userRent;

      //add a transaction for user as receivable with a value of userAdvance
      let pendingAdvBillTransactionKey = loadTransactionData(transactionsbillData, -(userAdvance), "Joining Advance", userId, billTag);
      if (advanceReceived > 0) { //User has paid some advance
        if (advanceReceived != userAdvance) { //user has paid some rent (partial rent)

          //add a transaction for user as received with a value of advanceReceived
          let newTransactionKey = loadTransactionData(transactionsbillData, advanceReceived,  userAcc.joiningNote, userId, billTag);
          //add user bill for advance in the received bills with received amount of advanceReceived
          billgen.loadReceivedBillData(transactionsbillData, "Joining advance",  userAcc.joiningNote, userId, userAdvance, advanceReceived, userAcc.inmateJoiningDateStr, billTag, newTransactionKey);
       
          //add user bill for rent in the Pending bills with amount of userAdvance - advanceReceived
          billgen.loadPendingBillData(transactionsbillData, "Joining advance pending", userId, userAdvance - advanceReceived, userAcc.inmateJoiningDateStr, billTag, pendingAdvBillTransactionKey);

        } else {
          let newTransactionKey = loadTransactionData(transactionsbillData, userAdvance,  userAcc.joiningNote, userId, billTag);
          //add user bill for advance in the received bills with received amount of userAdvance
          billgen.loadReceivedBillData(transactionsbillData, "Joining advance",  userAcc.joiningNote, userId, userAdvance, userAdvance, userAcc.inmateJoiningDateStr, billTag, newTransactionKey);
        }
      } else { //No advance is paid
        //add user bill for rent in the Pending bills with amount of userAdvance
        billgen.loadPendingBillData(transactionsbillData, "Joining advance pending", userId, userAdvance, userAcc.inmateJoiningDateStr, billTag, pendingAdvBillTransactionKey);
      }

      //Update the rent, advance amount collected statistics in monthly bill.

      if (collectedOnDayOne > 0) {
        var cumCollectRef = admin.database().ref(SITE + '/MonthlyBills/' + billTag + '/totalCollectedAmount'); //.set(cumulativeEBBillAmount); 
        cumCollectRef.transaction(function (collectedBalance) {
          console.log(".................ok setting the collectedAmount for billTag:" + billTag + ", trransac amt:" + collectedOnDayOne + ", prev balance:" + collectedBalance + ", total:" + (collectedBalance + collectedOnDayOne))
          return collectedBalance + collectedOnDayOne;
        });
      }

      if (advanceReceived > 0) {
        var advanceCollectedRef = admin.database().ref(SITE + '/MonthlyBills/' + billTag + '/advanceAmount'); //.set(cumulativeEBBillAmount); 
        advanceCollectedRef.transaction(function (advanceBalance) {
          console.log(".................ok setting the advanceReceived for billTag:" + billTag + ", trransac amt:" + advanceReceived + ", prev balance:" + advanceBalance + ", total:" + (advanceBalance + advanceReceived))
          return advanceBalance + advanceReceived;
        });
      } //else add userAdvance to a receivableAdvance.

      //console.log("************ update transactionBilslsData: "+ JSON.stringify(transactionsbillData));
      //TODO:??? Why do I have to do JSON.stringify and JSON.parse hmmmmmmmmmmmmmmmmmm
      //admin.database().ref(SITE).update(JSON.parse(JSON.stringify(transactionsbillData)));
      admin.database().ref(SITE).update(transactionsbillData);
    });
  });
  this.stagedUsers(request, response);
}

function loadTransactionData(billData, amount, note, userid, billTag) {
  const date = new Date();
  var newTransactionKey = admin.database().ref().push().key;
  billData["AccTransactions/" + userid + "/" + newTransactionKey] = {
    "accountUID": userid,
    "billTag": billTag,
    "description": note,
    "mLongCreatedTimestamp": + date,
    "mLongModifiedTimestamp": + date,
    "modifiedTransactionTimestamp": + date,
    "timeMillis": + date,
    "transactionAmount": amount,
    "uid": newTransactionKey
  };
  return newTransactionKey;
}

exports.getStudentsList = function(request, response) {
  // const searchType = request.params.search;
  // const hall = request.params.hall;
  // const wing = request.params.wing;
  // const roomNo = request.params.roomno;
  // const rollNo = request.params.rollno;
  // const year = request.params.year;
  
  const year = request.query.year;
  const gender = request.query.gender;
  const searchType = request.query.search;
  const hall = request.query.hall;
  const wing = request.query.wing;
  const roomNo = request.query.roomno; //not required??
  const rollNo = request.query.rollno; //not required??
  const dept = request.query.dept; 
  const bgroup = request.query.bgroup; 
  const prog = request.query.prog; 

  console.log("*****************In getSetudentsList searchType="+searchType+", hall="+hall+", wing="+wing+", roomNo="+roomNo+", rollNo="+rollNo+", year="+year+", gender="+gender+", dept="+dept+", bgroup="+bgroup+", prog="+prog);
  //let usertype = request.query.usertype!=null?request.query.usertype:"active";

  //Should we even allow all user listing ... perhaps allow for admin/super users
  var  ref = admin.database().ref('/');
  if (searchType === 'all') {
     ref = admin.database().ref('/');
  } else {
      if (hall == null || hall == undefined) {
        console.log("hall cannot be null .......");
        return null;
      }
      ref = admin.database().ref('/'+hall);
    if (wing) {
      if (!hall) {console.log("hall cannot be null when wing is set"); return null; }
      
      ref = admin.database().ref('/'+hall+'/'+wing);
    }

    //TODO?? 
    //Room number is unique in a hall, should be able to search without the hall number??
    if (roomNo) {
      if (!hall || !wing) {console.log("hall or wing cannot be null when room is set"); return null; }
      ref = admin.database().ref('/'+hall+'/'+wing+'/'+roomNo);
    }

    if (rollNo) {
      if (!hall || !wing || !roomNo) {console.log("hall wing, room number  cannot be null when roll number is set"); return null; }
      ref = admin.database().ref('/'+hall+'/'+wing+'/'+roomNo+'/'+rollNo);
    }
  }

  return ref.once('value').then(snap => { 
    var halls = snap.val() 
    console.log("\n\nUser list is "+JSON.stringify(snap.val()));
    // return makeStudentList(searchType, snap);

    // const year = request.query.year;
    // const gender = request.query.gender;
    // const searchType = request.query.search;
    // const hall = request.query.hall;
    // const wing = request.query.wing;
    // const roomNo = request.query.roomno; //not required??
    // const rollNo = request.query.rollno; //not required??
    // const dept = request.query.dept; 
    // const bgroup = request.query.bgroup; 
    // const prog = request.query.prog; 
    
    halls = makeStudentList(searchType, snap, year, gender, hall, wing, roomNo, rollNo, dept, bgroup, prog);
    response.render('students', { halls, searchType }); 
  });
}

function makeStudentList(searchType, snap, year, gender, hall, wing, roomNo, rollNo, dept, bgroup, prog) {

  var searchData = {};
  if (searchType == 'all') {
    snap.forEach(function (hallSnapShot){
      var hallName = hallSnapShot.key;
      console.log('Processing hall: '+hallName+', hall data: '+JSON.stringify(hallSnapShot.val()));
      hallSnapShot.forEach(function (wingSnapShot){
        var wingName = wingSnapShot.key;
        console.log('-->Processing wing: '+wingName+', wing data: '+JSON.stringify(wingSnapShot.val()));  
        wingSnapShot.forEach(function (roomSnapShot) {
          var roomName = roomSnapShot.key;
          console.log('---->Processing room: '+roomName+', room data: '+JSON.stringify(roomSnapShot.val()));  
          roomSnapShot.forEach(function (studentSnapShot) {
            var studentId = studentSnapShot.key;
            var studentRec = studentSnapShot.val();
            console.log('------>Processing student: '+ studentId+', student data: '+JSON.stringify(studentSnapShot.val()));
            var matched = true;

            if (year) {
              if (year != studentRec.year)
                  matched = false;
            }
            if (gender) {
              if (gender != studentRec.gender)
                  matched = false;
            }
            if (hall) {
              // if (hall != studentRec.hall)
              if (hall != hallName)
                  matched = false;
            }
            if (wing) {
              // if (wing != studentRec.wing)
              if (wing != wingName)
                  matched = false;
            }
            if (roomNo) {
              if (roomNo != studentRec.roomNo)
                  matched = false;
            }
            if (rollNo) {
              if (rollNo != studentRec.rollNo)
                  matched = false;
            }
            if (dept) {
              if (dept != studentRec.dept)
                  matched = false;
            }
            if (bgroup) {
              if (bgroup != studentRec.bgroup)
                  matched = false;
            }
            if (prog) {
              if (prog != studentRec.prog)
                  matched = false;
            }
            if (matched) {

              // searchData[hallName][wingName][roomName] = Object.assign(searchData[hallName][wingName][roomName], stuObj);

              // var stuObj = {}; 
              // stuObj[studentId] = studentRec;
              // var roomObj= {}; 
              // roomObj[roomName] = Object.assign(searchData[hallName][wingName][roomName], stuObj);
              // var wingObj = {};
              // wingObj[wingName] = Object.assign(searchData[hallName][wingName], roomObj);
              // var hallObj = {};
              // hallObj[hallName] = Object.assign(searchData[hallName], wingObj);

              // searchData = Object.assign(searchData, hallObj);
              //                   //  {[hallName]: 
              //                   //           {wingName: 
              //                   //             {roomName: 
              //                   //               { studentId:
              //                   //                 studentRec
              //                   //               }
              //                   //             }
              //                   //           }
              //                   //         });
              var hallExists = false;
              for (const h in searchData) {
                var thisHall = searchData[h];
                if (h == hallName) {
                  hallExists = true;
                  var wingExists = false;
                  for (const w in thisHall) {
                    var thisWing = searchData[h];
                    if (w === wingName) {
                      wingExists = true;
                      var roomExist = false;
                      for (const r in thisWing) {
                        var thisRoom = searchData[r];
                        if (r == roomName) {
                          thisRoom[studentId] = studentRec;
                          roomExist = true;
                        }
                      }
                      if (!roomExist) {
                        console.log("\n&&&&&&&&&&&room not existing:"+roomName);
                        var stuObj = {}; 
                        stuObj[studentId] = studentRec;          
                        // var roomObj= {}; 
                        // roomObj[roomName] = stuObj;   
                        console.log("wing obje bef:"+JSON.stringify(thisWing))       ;
                        thisWing[wingName][roomName] = stuObj;
                        console.log("wing obje after:"+JSON.stringify(thisWing))       ;
                      }
                    }
                  }
                  if (!wingExists) {
                    console.log("\n&&&&&&&&&&&wing not existing:"+wingName);
                    var stuObj = {}; 
                    stuObj[studentId] = studentRec;          
                    var roomObj= {}; 
                    roomObj[roomName] = stuObj;          
                    thisHall[hallName][wingName] = roomObj;
                  }
                }
              }
              if (!hallExists) {
                console.log("\n&&&&&&&&&&&hall not existing:"+hallName);
                var stuObj = {}; 
                stuObj[studentId] = studentRec;          
                var roomObj= {}; 
                roomObj[roomName] = stuObj;          
                var wingObj = {}; 
                wingObj[wingName] = roomObj;          
                searchData[hallName] = wingObj;
              }

console.log("************** OK matched: searchData: "+JSON.stringify(searchData));

            }
          });
        });
      });
    });
  }
  return searchData;
  // var halls = searchData;
  // response.render('students', { halls, searchType }); 
}

// {"Hall-1":{"Wing-1":{"102":{"-NVyNdhU95OdyC7T6oK4":{"Year":"23","department":"MECH","name":"Deepika","phone":"+919876543210"}}}},
// "Hall-2":{"Wing-1":{"101":{"-NVyNdhU95OdyC7T6oK4":{"Year":"23","department":"EEE","name":"Varsha","phone":"+919876543211"}}}}}

// {"Hall-1":{"102":{"-NVyNdhU95OdyC7T6oK4":{"Year":"23","department":"MECH","name":"Deepika","phone":"+919876543210"}},
// "Wing-1":{"101":{"-NVyNdhU95OdyC7T6oK4":{"Year":"23","department":"CSC","name":"Elakya","phone":"+919876543210"}}}},

// "Hall-2":{"Wing-1":{"101":{"-NVyNdhU95OdyC7T6oK4":{"Year":"23","department":"EEE","name":"Varsha","phone":"+919876543211"}}}}}

// {"Hall-1":{"Wing-1":{"101":{"-NVyNdhU95OdyC7T6oK4":{"Year":"23","department":"CSC","name":"Elakya","phone":"+919876543210"}},"102":{"-NVyNdhU95OdyC7T6oK4":{"Year":"23","department":"MECH","name":"Deepika","phone":"+919876543210"}}}},"Hall-2":{"Wing-1":{"101":{"-NVyNdhU95OdyC7T6oK4":{"Year":"23","department":"EEE","name":"Varsha","phone":"+919876543211"}}}}}

