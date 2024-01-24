const functions = require('firebase-functions');
var admin = require("firebase-admin");

const userbill = require('./userbill');

exports.addUserTransactionForPaidViaPaymtGW = functions
  .database/*.instance('pgmgmt-619ec-default-rtdb')*/
  .ref('/{siteName}/userTransactionStatus/{customerId}/{orderId}') 
  .onWrite((change, context) => {

    var customerId = context.params.customerId;
    var orderId = context.params.orderId;
    var SITE = context.params.siteName;

    const afterOrderVal = change.after.val();

    var bkTransactionKey = afterOrderVal.bkTransactionKey;
    const date = new Date();
    //console.log(':::::::::::addUserTransactionForPaidViaPaymtGW: afterorderVal:'+afterOrderVal);
    if (afterOrderVal.status == "TXN_SUCCESS") {
        //TODO add transaction for this user:
        var billData = {};
        
        if (bkTransactionKey === null || bkTransactionKey == undefined) {
            console.log(':::::::::::addUserTransactionForPaidViaPaymtGW: bkTransactionKey is NULLLLLLL:'+bkTransactionKey);
            bkTransactionKey = admin.database().ref().push().key;
            admin.database().ref(SITE+'/userTransactionStatus/'+customerId+'/'+orderId).update({
                "bkTransactionKey":bkTransactionKey
            });
        } else {
            console.log(':::::::::::addUserTransactionForPaidViaPaymtGW: bkTransactionKey is NOTTTT NULLLLLLL:'+bkTransactionKey);
        }


        //Why cant orderId be used instead of new bkTransactionKey
        billData["AccTransactions/" + customerId + "/" + bkTransactionKey] = {
          "accountUID": customerId,
          "billTag": orderId,
          "description": "Collection, paytm ",
          "mLongCreatedTimestamp": + date,
          "mLongModifiedTimestamp": + date,
          "modifiedTransactionTimestamp": + date,
          "timeMillis": + date,
          "transactionAmount": Math.round(afterOrderVal.amount), //Use thisUserTransactionref.amount instead??
          "uid": bkTransactionKey,
          "type": "paytm"
        };
        console.log('New transaction for user:' + JSON.stringify(billData));
        admin.database().ref(SITE).update(billData);
        //Mark the bills as paid:
        var thisUserTransactionref;
        admin.database().ref("/" + SITE + "/userTransactionStatus/" + customerId + '/' + orderId).once('value').then(function (customerPaidBills) {
          thisUserTransactionref = (customerPaidBills.val());
          console.log("**********addUserTransactionForPaidViaPaymtGW******************paid bills: "+thisUserTransactionref);
          
          thisUserTransactionref.userbills.forEach(oneUserBillId => {
            console.log("**********addUserTransactionForPaidViaPaymtGW******************paid bills: "+oneUserBillId);
            userbill.moveBillFromPendingToReceived(SITE, customerId, oneUserBillId, "paytm/pg ref#"+orderId+" amt:"+Math.round(thisUserTransactionref.amount)+ "---"+date.toLocaleString(),-1, bkTransactionKey);
          });
          
          if (thisUserTransactionref.amount > 3699) {
            //TODO make and use const for 10
            userbill.addOneUserBillAndMarkItReceived(SITE, customerId, "Online payment discount", 10, true);
          }  
        });
      }


    

      return "OK";
});

/*TODO Test:
  Transaction can be:
  * Newly added
  * Modified
  * Deleted
 */
//TODO: COmment it out...
  //exports.ComputeAndUpdateAccountBalanceOLD = functions
  //.database/*.instance('pgmgmt-619ec-default-rtdb')*/
  /*.ref('/XXXX/{siteName}/AccTransactions/{accountId}/{transactionId}/transactionAmount')
  .onWrite((change, context) => {
    //console.log("\nis it getting triggered");
    //const transaction = change.before.val();
 
    accountId = context.params.accountId;
    console.log("Site:"+context.params.siteName+", Function: ComputeAndUpdateAccountBalance Account id:" + accountId + ", transaction uid:" + context.params.transactionId);

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
    }

    console.log(" before value=" + beforeAmount + ", after value=" + afterAmount);

    var accBalance = 0;
    admin.database().ref('/' + context.params.siteName + '/Accounts/' + accountId + '/computedBalance').once('value').then(function (snap) {
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

      admin.database().ref('/' + context.params.siteName + "/Accounts/" + updateAccountId).update({
        "computedBalance": accBalance
      }).then(() => {

        const today = new Date();
        // 2020-11-24T10:20:14.782Z
        const day = today.getDate();        // 24
        const month = today.getMonth();     // 10 (Month is 0-based, so 10 means 11th Month)
        const year = today.getFullYear();   // 2020
        const timestamp = today.getTime();

        admin.database().ref('/' + context.params.siteName + '/Accounts/' + accountId).once('value').then(function (accSnap) {
          var account = accSnap.val();
          admin.database().ref('/' + context.params.siteName + "/ledger/" + year + "/" + month + "/" + day + "/" + timestamp).update({
            "accId": updateAccountId,
            "transactionId": context.params.transactionId,
            "transactionAmount": afterAmount,
            "name": account.name
          });
        });

        admin.database().ref('/' + context.params.siteName + "/AccTransactionsStatus/" + updateAccountId).update({
          "status": "SANE"
        });
      });
      return
    });
    return "OK";
  });*/


  exports.ComputeAndUpdateAccountBalance = functions
  .database/*.instance('pgmgmt-619ec-default-rtdb')*/
  .ref('/{siteName}/AccTransactions/{accountId}/{transactionId}')
  .onWrite((change, context) => {
    //console.log("\nis it getting triggered");
    //const transaction = change.before.val();

    accountId = context.params.accountId;
    console.log("Site:" + context.params.siteName + ", Function: ComputeAndUpdateAccountBalance Account id:" + accountId + ", transaction uid:" + context.params.transactionId);

    var beforeTransaction = change.before.val();
    var beforeAmount = 0;
    //if transaction is null it is a new account or a new transaction
    if (beforeTransaction !== null) {
      beforeAmount = Number(beforeTransaction.transactionAmount);
      //beforeAmount = transaction.transactionAmount;
    } else {
      console.log(" BeforeTransaction is null");
      beforeAmount = 0;
    }

    var afterTransaction = change.after.val();
    var afterAmount = 0;
    if (afterTransaction !== null) {
      afterAmount = Number(afterTransaction.transactionAmount);
    } else {
      console.log(" AfterTransaction is null");
      afterAmount = 0;
    }

    console.log(" before value=" + beforeAmount + ", after value=" + afterAmount+",  afterTransaction:"+JSON.stringify(afterTransaction));

    /*admin.database().ref('/' + context.params.siteName + '/Accounts/' + accountId + '/roomNo').once('value').then(function (snap) {
      //Account itself is gone, dont bother calculating the balance
      if (snap.val() === null) {
        console.log("  THIS CANT BE ... WHY: GONE Account id:" + accountId + ", dont bother calculating the balance Acc Loc:" + SITE + '/Accounts/' + accountId + '/computedBalance' + "#");
        return;
      }

      updateAccountId = context.params.accountId;
      var roomNo = snap.val();


      var balanceRef = admin.database().ref('/' + context.params.siteName + '/AccIndexes/active/'+roomNo+'/'+accountId+'/balance');

      balanceRef.transaction(function (currentBalance) {
        console.log(" Calculated accBalance= " + (currentBalance + afterAmount - beforeAmount));
        return currentBalance + afterAmount - beforeAmount;
      });*/



    {
      const today = new Date();
      // 2020-11-24T10:20:14.782Z
      const day = today.getDate();        // 24
      const month = today.getMonth();     // 10 (Month is 0-based, so 10 means 11th Month)
      const year = today.getFullYear();   // 2020
      const timestamp = today.getTime();

      admin.database().ref('/' + context.params.siteName + '/Accounts/' + accountId).once('value').then(function (accSnap) {
        var account = accSnap.val();

        //Handle deleted account
        if (account == null)
          return "OK";

        var roomNo = account.roomNo;
        var myAccNo = account.uid;
        var balanceRef = admin.database().ref('/' + context.params.siteName + '/AccIndexes/active/' + roomNo + '/' + myAccNo + '/balance');

        //TODO: WTF why is roomNo null, figure out 
        //Why is rooNo null check required.
        if (roomNo != null) {
          balanceRef.transaction(function (currentBalance) {

            if ((currentBalance != null) && (currentBalance != undefined) && !Number.isNaN(currentBalance)) {
              console.log("Account id:" + myAccNo + " Calculated accBalance= " + (currentBalance + afterAmount - beforeAmount));
              return currentBalance + afterAmount - beforeAmount;
            } else {
              console.log("Account id:" + myAccNo + " Else Calculated accBalance= " + (afterAmount - beforeAmount));
              return afterAmount - beforeAmount;
            }
          });
        }

        if (afterAmount < 0) {
          admin.database().ref('/' + context.params.siteName + "/ledger/receivable/" + year + "/" + month + "/" + day + "/" + timestamp).update({
            "accId": accountId,
            "transactionId": context.params.transactionId,
            "transactionAmount": afterAmount,
            "name": account.name,
            "note":afterTransaction != null ? afterTransaction.description: "DeletedTransac",
            "billTag":afterTransaction != null ? afterTransaction.billTag: "DeletedTransac"
          });
        } else {
          admin.database().ref('/' + context.params.siteName + "/ledger/received/" + year + "/" + month + "/" + day + "/" + timestamp).update({
            "accId": accountId,
            "transactionId": context.params.transactionId,
            "transactionAmount": afterAmount,
            "name": account.name,
            "note":afterTransaction != null ? afterTransaction.description: "DeletedTransac",
            "billTag":afterTransaction != null ? afterTransaction.billTag: "DeletedTransac"
          });
        }
      });
    }
    return "OK";
  });