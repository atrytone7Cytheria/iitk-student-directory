const functions = require('firebase-functions');
var admin = require("firebase-admin");
const bkutils = require('./bkutils');

exports.generateEBBillInfoListener = functions
.database/*.instance('pgmgmt-619ec-default-rtdb')*/
.ref('/{siteName}/jobs/monthlybill/{monthlyBillTag}/genEbBills')
.onWrite((change, context) => {
  SITE = context.params.siteName;
  var monthlyBillTag = context.params.monthlyBillTag;

  console.log("............generateEBBillInfoListener SITE name is:"+SITE+", params.siteName:"+context.params.siteName+", operation:"+billOperation);
  var billOperation = change.after.val();
  console.log("")
  if (billOperation === "generate") {
    generateEBBillInfo(monthlyBillTag);
  } else if (billOperation === "delete") {
    deleteEBBills(monthlyBillTag);
  } else if (billOperation === "generated") {
    //deleteEBBills(monthlyBillTag);
    console.log("\n\n **** Eb bills for BillTag:"+monthlyBillTag+" is (already?) generated");
  } else {
    console.log("\n\n **** Unsupported EBbill operation: " + billOperation);
    //deleteEBBills(monthlyBillTag);
  }
  return "OK";
});

async function deleteEBBills(monthlyBillTag) {

  //if (monthlyBillObj.EBBillStatus != 'INIT') {
    console.log("..............OK DB Ref is:"+SITE + '/BillTags/EB'+monthlyBillTag);
     admin.database().ref(SITE + '/BillTags/EB'+monthlyBillTag).once('value').then(billSnap => {
      var bills = billSnap.val();
      console.log('............Bill Snap len:'+bills);//JSON.stringify(billSnap));

      var billCount = billSnap.length;
      //for (var i = 0; (i+1) < billSnap.length; i++) {
      //  var transactionId = billSnap[i].key;
      //  var accountId = billSnap[i].val();
      billSnap.forEach(function (oneBill, index) {
        var transactionId = oneBill.key;
        var accountId = oneBill.val();
        console.log("........................Deleting transactionId:"+transactionId+", accountID:"+accountId);
        admin.database().ref(SITE+ '/AccTransactions/'+accountId+'/'+transactionId).remove();
        admin.database().ref(SITE+ '/BillTags/EB'+monthlyBillTag+'/'+transactionId).remove();
        admin.database().ref(SITE+ '/PendingBills/'+accountId+'/'+transactionId).remove();
        admin.database().ref(SITE + '/MonthlyBills/' + monthlyBillTag + '/EBBillStatus').set("INIT");
      });
      /*var transactionId = billSnap[i].key;
      var accountId = billSnap[i].val();
      consolde.log("........................Deleting transactionId:"+transactionId+", accountID:"+accountId);
      admin.database().ref(SITE+ '/AccTransactions/'+accountId+'/'+transactionId).remove();
      admin.database().ref(SITE+ '/PendingBills/'+accountId+'/'+transactionId).remove();*/

      return admin.database().ref(SITE + '/MonthlyBills/' + monthlyBillTag + '/EBBillStatus').set("INIT"); /*.then(snap => {
        return resolve("Success");
      });*/
    });
  //} else {
  //  resolve('Success');
  //}
}

//Move to a util file??
exports.loadPendingBillData = function(billData, note,  accountId, amount, dueDate, monthlyBillTag, transactionKey) {
//function loadPendingBillData(billData, note,  accountId, amount, dueDate, monthlyBillTag) {
  //let newTransactionKey = admin.database().ref().push().key;
  billData["PendingBills/" + accountId + "/" + transactionKey] = {
    "description": note,
    "transactionAmount": amount,
    "dueDate": dueDate,
    "uid": transactionKey,
    "billTag":monthlyBillTag
  };
}

//Move to a util file??
exports.loadReceivedBillData = function(billData, note, collectionNote, accountId, amount, collectedAmount, dueDate, monthlyBillTag, transactionKey) {
  //function loadPendingBillData(billData, note,  accountId, amount, dueDate, monthlyBillTag) {
    let newTransactionKey = admin.database().ref().push().key;
    billData["ReceivedBills/" + accountId + "/" + newTransactionKey] = {
      "description": note,
      "transactionAmount": amount,
      "dueDate": dueDate,
      "uid": newTransactionKey,
      "billTag":monthlyBillTag,
      "notes": collectionNote,
      "collectedAmount":collectedAmount, 
      "collectionTransactionUid":transactionKey
    };
  }

async function generateEBBillInfo(monthlyBillTag) {
    console.log("LET us retrieve:" + SITE + '/MonthlyBills/' + monthlyBillTag + "#");
    const meterUnitRateSnap = await admin.database().ref(SITE + '/Globals/eb_unit_rate').once('value'); //9;
    const meterUnitRate = meterUnitRateSnap.val();
    console.log("\n Retrieved EB unit rate:"+meterUnitRate);
    admin.database().ref(SITE + '/MonthlyBills/' + monthlyBillTag + '/').once('value').then(function (billObjSnap) {
      var monthlyBillObj = billObjSnap.val();
      if (monthlyBillObj == null) {
        console.log("\n **** ERROR: MonthlyBill OBject not found under /MonthlyBills/, cannot start the bill generation job");
        return;
      }
  
      //Delete already created bills for this billTag TODO
      //await deleteEBBills(monthlyBillObj);

      admin.database().ref(SITE + '/MonthlyBills/' + monthlyBillTag + '/EBBillStatus').set("GENERATING"); 

      console.log("\n Retrieved monthlyBill object with BillTag:" + monthlyBillTag + ", billOBj:" + JSON.stringify(monthlyBillObj)+", EB unit rate:"+meterUnitRate);

      var cumulativeEBBillAmount = 0;

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
            //console.log("\n Processing room:" + roomId);
            //console.log("\n Processing room:" + roomId + ", room users data==>" + JSON.stringify(roomUsersData));
            //roomUsersData.forEach(function(inmateSnap) {
 
            var usersInthisRoom = [];
            var userNo = 0;
            roomUsersSnapshot.forEach(function (inmateSnap) {
                
              console.log("==>user:" + JSON.stringify(inmateSnap));
              var inmateInfo = inmateSnap.val();
              if (bkutils.userJoinedLastMonthOrBefore(inmateInfo, monthlyBillTag)) {
                usersInthisRoom[userNo] = inmateInfo.name;
                userNo++;
              }
            });

            const numPersons = userNo; //roomUsersSnapshot.numChildren();
            if (numPersons == 0) {
                console.log("\n:::::: EB Bill GEn for users now, RoomNo:"+roomId+", numpersons="+numPersons+", isFixed="+metersObj[roomId].fixedCharge);
                return;
            }

            var chargePerPerson = 0;
            if (metersObj[roomId].fixedCharge == true) {
              chargePerPerson = metersObj[roomId].chargePerPerson;
            } else {
               chargePerPerson = Math.ceil(meterUnitRate * (metersObj[roomId].meterReading - metersObj[roomId].lastMeterReading) / numPersons);
            }
            
            // generateEBInfo(inmateSnap.key, inmateInfo, monthlyBillTag, chargePerPerson, roomId);
            
            const monthlyMaintenance = monthlyBillObj.maintenanceAmount;
            console.log("\n:::::: EB Bill GEn for users now, RoomNo:"+roomId+", numpersons="+numPersons+", isFixed="+metersObj[roomId].fixedCharge+", chargePerperson="+chargePerPerson, ', monthlyMaintenance='+monthlyMaintenance);

            var ebBillData = {};
            var perHeadCharge = Math.round(((metersObj[roomId].meterReading - metersObj[roomId].lastMeterReading)/numPersons*meterUnitRate) + monthlyMaintenance);
            ebBillData["ebBillData/" + monthlyBillTag + "/" + roomId] = {
                "lastReading": metersObj[roomId].lastMeterReading,
                "lastReadingDate":monthlyBillObj.lastReadingDate,
                "currentReading": metersObj[roomId].meterReading,
                "currReadingDate":metersObj[roomId].readingDate,
                "totalUnits": metersObj[roomId].meterReading - metersObj[roomId].lastMeterReading,
                "numPersons": numPersons,
                "perHeadEBUnits": Math.round((metersObj[roomId].meterReading - metersObj[roomId].lastMeterReading)/numPersons),
                "perHeadCharge": perHeadCharge,
                "usersInthisRoom":usersInthisRoom
            };

            admin.database().ref(SITE).update(ebBillData);

            roomUsersSnapshot.forEach(function (inmateSnap) {
                
              console.log("==>user:" + JSON.stringify(inmateSnap));
              var inmateInfo = inmateSnap.val();
              if (bkutils.userJoinedLastMonthOrBefore(inmateInfo, monthlyBillTag)) {

                const monthNames = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"
                ];
                var ref = admin.database().ref();
                var newPostRef = ref.push();
                var newTransactionKey = newPostRef.key;
                var accountId = inmateSnap.key;
                const date = new Date();
                var billData = {};
                billData["AccTransactions/" + accountId + "/" + newTransactionKey] = {
                  "accountUID": accountId,
                  "billTag": "EB"+monthlyBillTag,
                  "description": "EB " + monthNames[date.getMonth()],
                  "mLongCreatedTimestamp": + date,
                  "mLongModifiedTimestamp": + date,
                  "modifiedTransactionTimestamp": + date,
                  "previousBalance": Number(inmateInfo.balance),
                  "timeMillis": + date,
                  "transactionAmount": -perHeadCharge,
                  "uid": newTransactionKey
                };


                var dueDate = exports.getDueDate(inmateInfo.doj);
                billData["PendingBills/" + accountId + "/" + newTransactionKey] = {
                  "description": "EB " + monthNames[date.getMonth()],
                  "transactionAmount": perHeadCharge,
                  "dueDate": dueDate,
                  "uid": newTransactionKey,
                  "billTag":monthlyBillTag
                };

                //loadPendingBillData(billData, "EB "+ monthNames[date.getMonth()], accountId, perHeadCharge, dueDate, monthlyBillTag);

                cumulativeEBBillAmount += perHeadCharge;

                admin.database().ref(SITE).update(billData);  

                var billTag = {};
                billTag["BillTags/" + "EB" + monthlyBillTag] = {
                  [newTransactionKey]: accountId
                };
                admin.database().ref(SITE).child("BillTags").child("EB"+monthlyBillTag).update({[newTransactionKey]:accountId});
                //update(billTag);  


            //TODO:
            //Add a pending transaction for user for EB bill
              }
            });





            //Add the transaction to user pending list under 
              //  /UserBills/{UID}/pending/{transactionID}/

            /*
            roomId
            metersObj[roomId].lastMeterReading
            metersObj[roomId].meterReading   //current reading
            metersObj[roomId].readingDate
            TotalUnits: metersObj[roomId].meterReading - metersObj[roomId].lastMeterReading
            numPersons
            PerHeadUnitCount: TotalUnits/numPersons
            PerHeadCharges: PerHeadUnitCount * 9
            */

            //console.log("\n Meter reading for room:" + roomId + " ==>" + JSON.stringify(metersObj[roomId]));
          });
  
        }).then(function () {
          //admin.database().ref(SITE + `/jobs/monthlybill/${monthlyBillTag}/genbills`).set("generated");
  //    monthlyBillObj.billStatus = "GENERATED";
          //admin.database().ref(SITE + '/MonthlyBills/' + monthlyBillTag + '/billStatus').set("GENERATED");
          //admin.database().ref(SITE + `/jobs/monthlybill/${monthlyBillTag}/genbills`).set("generated");
          admin.database().ref(SITE + `/jobs/monthlybill/${monthlyBillTag}/genEbBills`).set("generated");
          admin.database().ref(SITE + '/MonthlyBills/' + monthlyBillTag + '/EBBillStatus').set("GENERATED"); 
          admin.database().ref(SITE + '/MonthlyBills/' + monthlyBillTag + '/ebCumulativeAmount').set(cumulativeEBBillAmount); 
        });     
      });
      //
    });
    return "OK";
  }

  exports.getDueDate = function(joiningDate) {
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1;
    var parts = joiningDate.split('-');
    var dueDate = parts[0]+'-'+month+'-'+dateObj.getUTCFullYear();
    console.log('......in getDueDate:'+dueDate);
    return dueDate;
  }

  exports.getDueDateFmtForToday = function() {
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1;
    var day = dateObj.getDate();
    var dueDate = day+'-'+month+'-'+dateObj.getUTCFullYear();
    //console.log('......in getDueDate:'+dueDate);
    return dueDate;
  }

  function renderEBBillData(request, response) {
    
  }
  