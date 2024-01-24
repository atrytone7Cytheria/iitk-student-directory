const { response } = require("express");
var admin = require("firebase-admin");
const functions = require('firebase-functions');

const bkutils = require('./bkutils');
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

