//'use strict';

var authUser;
//console.log('Site is ..........'+SITE);
// Initializes the Demo.
function Demo() {

  var ui = new firebaseui.auth.AuthUI(firebase.auth());
  var SITE = 'iitk';

  var dropDownData;
  console.log("loading data here....");

  

  ui.start('#firebaseui-container', {
    'callbacks': {
      'signInSuccess': function (user, credential, redirectUrl) {
        //this.prototype.onAuthStateChanged(user);
        //Demo.prototype.onAuthStateChanged(user);
        console.log(' In in ui start callbacks, signInSuccess ....');
        //this.onAuthStateChanged(user);
        authUser = user;
        return false;
      }
    },
    signInOptions: [
      firebase.auth.PhoneAuthProvider.PROVIDER_ID
    ],
    // Other config options...
    'signInOptions': [
      {
        provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        recaptchaParameters: {
          type: 'image',
          size: 'invisible',
          badge: 'bottomleft'
        },
        defaultCountry: 'IN',
        defaultNationalNumber: '1234567890',
        loginHint: '+11234567890'
      }
    ],
  });

  document.addEventListener('DOMContentLoaded', function () {
    // Shortcuts to DOM Elements.
    this.signOutButton = document.getElementById('demo-sign-out-button');
    this.submitButton = document.getElementById('submit-button');
    this.responseContainer = document.getElementById('demo-response');
    this.fullWidthContainer = document.getElementById('fullwidth');

    this.responseContainerCookie = document.getElementById('demo-response-cookie');
    this.fetchMenuItems = window.location.protocol + "//" + window.location.host + "/" + SITE + "/menu";
    this.billTags = window.location.protocol + "//" + window.location.host + "/" + SITE + "/tags";
    this.rooms = window.location.protocol + "//" + window.location.host + "/" + SITE + "/rooms";
    this.payBill = window.location.protocol + "//" + window.location.host + "/" + SITE + "/collectpay";
    this.billDues = window.location.protocol + "//" + window.location.host + "/" + SITE + "/billdues";
    this.markBillAsPaidURL = window.location.protocol + "//" + window.location.host + "/" + SITE + "/markbillaspaid";
    this.addAUserBillURL = window.location.protocol + "//" + window.location.host + "/" + SITE + "/addauserbill";
    this.pendingPayments = window.location.protocol + "//" + window.location.host + "/" + SITE + "/userbill";
    this.lasttransaction = window.location.protocol + "//" + window.location.host + "/" + SITE + "/lasttransaction";
    this.collectionreport = window.location.protocol + "//" + window.location.host + "/" + SITE + "/collectionreport";
    this.userlist = window.location.protocol + "//" + window.location.host + "/" + SITE + "/userlist";
    this.myinfo = window.location.protocol + "//" + window.location.host + "/" + SITE + "/myinfo";
    this.signedOutCard = document.getElementById('demo-signed-out-card');
    this.signedInCard = document.getElementById('demo-signed-in-card');
    this.menuDiv = document.getElementById('vhmenu');
    
  //   const searchType = request.params.search;
  // const hall = request.params.hall;
  // const wing = request.params.wing;
  // const roomNo = request.params.roomno;
  // const rollNo = request.params.rollno;

  this.studentList = window.location.protocol + "//" + window.location.host+'/studentlist'; 
  this.studentSearch = window.location.protocol + "//" + window.location.host+'/stusearch'; 
    
    // Bind events.
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    //    this.submitButton.addEventListener('click', this.submitForm.bind(this));
    firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));


  }.bind(this));
}

Demo.prototype.loadSubContent = function (uid, operation) {
  //console.log('In loadContent now check for auth currentUser:'+firebase.auth().currentUser+', load type='+loadType);
  divTag = document.getElementById('searchresult');

 

  firebase.auth().currentUser.getIdToken().then(function (token) {
    //console.log('loadContent Sending request to', this.fetchMenuItems, 'with ID token in Authorization header.');
    var title = "load sub content";
    var req = new XMLHttpRequest();
    req.onload = function () {
      divTag.innerHTML = "<td></td><td align='center' colspan='11'>"+req.responseText+"</td>"; 

      //console.log("response received:"+req.responseText+", ....... var:");
      
    }.bind(this);
    req.onerror = function () {
      this.responseContainer.innerText = 'There was an error';
    }.bind(this);

    // console.log('Div id is :'+uid+"_"+operation);
    divTag.innerHTML = "<td colspan='11'>loading, please wait...</td>";
    //divTag.style.visibility = "block";
    divTag.style.display = "table-row";

    switch (operation) {
      case "newtransaction":
        console.log("In new Transactin...")
        var url = window.location.protocol + "//" + window.location.host + "/" + SITE + "/userNewBill" + "?user=" + uid;
        req.open('GET', url, true);
        break;
      case "pendingbills":
        document.getElementById(uid+"_"+operation+"_image").src = "../images/up_arrow.jpeg"; //load appropriate color arrow
        var url = window.location.protocol + "//" + window.location.host + "/" + SITE + "/userbillPending" + "?user=" + uid;
        req.open('GET', url, true);
        break;
      case "receivedbills":
          document.getElementById(uid+"_"+operation+"_image").src = "../images/up_arrow.jpeg"; 
          var url = window.location.protocol + "//" + window.location.host + "/" + SITE + "/userbillCollected" + "?user=" + uid;
          req.open('GET', url, true);
          break;
      case "searchStudents":
          var year = document.getElementById('year').value;
          var gender = document.getElementById('gender').value;
          var dept = document.getElementById('dept').value;
          var bgroup = document.getElementById('bgroup').value;
          var hall = document.getElementById('hall').value;
          var wing = document.getElementById('wing').value;
          var prog = document.getElementById('prog').value;
          console.log("year= "+year);
          var url = this.studentList + "?search=all"; //&year="+year+"&gender="+gender+"&dept="+dept+"&bgroup="+bgroup+"&hall="+hall+"&wing="+wing+"&prog="+prog;
          if (year) url += "&year="+year;
          if (gender) url += "&gender="+gender;
          if (dept) url += "&dept="+dept;
          if (bgroup) url += "&bgroup="+bgroup;
          if (hall) url += "&hall="+hall;
          if (wing) url += "&wing="+wing;
          if (prog) url += "&prog="+prog;
          console.log("url="+url);
          // req.open('GET', this.studentList + "?search=all");
          req.open('GET', url, true);
          break;
      }    
     req.setRequestHeader('Authorization', 'Bearer ' + token);
     req.send();
  }.bind(this));
};

Demo.prototype.loadContent = function (loadType, params) {
  console.log('In loadContent load type='+loadType);
  firebase.auth().currentUser.getIdToken().then(function (token) {
    //console.log('loadContent Sending request to', this.fetchMenuItems, 'with ID token in Authorization header.');
    var title = "My Home";
    var req = new XMLHttpRequest();
    req.onload = function () {
      // console.log("in onload of loadContent response text= "+req.responseText);
      // this.responseContainer.innerText = req.responseText;
      //  this.responseContainer.innerHTML = req.responseText;
      this.fullWidthContainer.innerHTML = req.responseText;
      document.title = title;
    }.bind(this);
    req.onerror = function () {
      this.responseContainer.innerText = 'There was an error';
    }.bind(this);
    switch (loadType) {
      case "billtags":
        //req.open('GET', this.billTags, true);


        let sheettype = params.get('sheettype');
        let billtag = params.get('billtag');
//        console.log('::::::::::::::::::::::sheettype type=' + sheettype);
        if (sheettype != null)
          req.open('GET', this.billTags + "?sheettype=" + sheettype + "&billtag=" + billtag, true);
        else
          req.open('GET', this.billTags, true);
        title = "Bill Tags";

        break;
      case "pendingpay":
        req.open('GET', this.pendingPayments, true);
        title = "Pending payments";
        break;
      case "lasttransaction":
        req.open('GET', this.lasttransaction, true);
        title = "Last transaction";
        break;
      case "rooms":
        req.open('GET', this.rooms, true);
        title = "rooms"
        break;
      case "approveuser": {
       // console.log('::::::::::::::::::::::approve');
        let userId1 = params.get('user');
        var url = window.location.protocol + "//" + window.location.host + "/" + SITE + "/approveuser" + "?user=" + userId1;
        //var url = window.location.protocol + "//" + window.location.host + "/" + SITE + "/moveuser" + "?user=" + userId1 + "&room=" + room + "&movefrom=" + moveType;
        req.open('GET', url, true);
        }
        break;

      case "stageduserlist": {
        //  console.log('::::::::::::::::::::::stageduserlist');
          title = "New User list";

          let print = params.get('print');
          if (print != 'true')
            print = 'false';

          var url = window.location.protocol + "//" + window.location.host + "/" + SITE + "/newusers";
          req.open('GET', url + "?print=" + print, true);
        }
        break;
      case "userlist":
        //console.log('::::::::::::::::::::::userlist url:'+this.userlist);
        let usertype = params.get('usertype');
        if (usertype != 'archive') {
          usertype = 'active';
        }

        let print = params.get('print');
        if (print != 'true')
          print = 'false';

        title = "User list ("+usertype+")";
        
        req.open('GET', this.userlist + "?usertype=" + usertype + "&print=" + print, true);
        break;

      case "collectionreport":
        let reporttype = params.get('reporttype');
        //console.log('::::::::::::::::::::::report type=' + reporttype);
        if (reporttype != null)
          req.open('GET', this.collectionreport + "?reporttype=" + reporttype, true);
        else
          req.open('GET', this.collectionreport, true);
        //req.open('GET', this.collectionreport, true);
        title = "Collection report";
        break;
      /*case "collectpay":
          req.open('GET', this.payBill, true);
          break; */
      case "userinfo":
        let userId = params.get('user');
        var url = window.location.protocol + "//" + window.location.host + "/" + SITE + "/userinfo" + "?user=" + userId;
        req.open('GET', url, true);
        title = "User Info";
        break;
      case "moveuser":
        let userId1 = params.get('user');
        let room = params.get('room');
        let moveType = params.get('movefrom');
        //console.log('userid:' + userId1 + ', room:' + room + ', movetype=' + moveType);
        var url = window.location.protocol + "//" + window.location.host + "/" + SITE + "/moveuser" + "?user=" + userId1 + "&room=" + room + "&movefrom=" + moveType;
        req.open('GET', url, true);
        break;
        case "createauthuser":
        let user = params.get('user');
        var url = window.location.protocol + "//" + window.location.host + "/" + SITE + "/createauthuser" + "?user=" + user;
        req.open('GET', url, true);
        break;
      case "qr":
        //console.log('::::::::::::::::::::::WRRRR');
        var url = window.location.protocol + "//" + window.location.host + "/qr";
        req.open('GET', url, true);
        break;
      case "colorthecustomers":
          var url = window.location.protocol + "//" + window.location.host + "/" + SITE + "/colorthecustomers";
          console.log('::::::::::::::::::::::colorthecustomers url:'+url);
          req.open('GET', url, true);
          //req.open('GET', this.userlist + "?usertype=" + usertype + "&print=" + print, true);
      break;
      /*case "register":
        //console.log('::::::::::::::::::::::register');
        var url = window.location.protocol + "//" + window.location.host + "/" + SITE + "/register";
        req.open('GET', url, true);
        break;*/
//Varshu start
    case "studentlist":
        //console.log('::::::::::::::::::::::userlist url:'+this.userlist);
        // let usertype = params.get('usertype');
        // if (usertype != 'archive') {
        //   usertype = 'active';
        // }

        // let print = params.get('print');
        // if (print != 'true')
        //   print = 'false';

        title = "Student list";
        console.log("in case for studentlist");
        
        req.open('GET', this.studentList + "?search=all"); //" + usertype + "&print=" + print, true);
       break;

        case "search":
          //console.log('::::::::::::::::::::::userlist url:'+this.userlist);
          // let usertype = params.get('usertype');
          // if (usertype != 'archive') {
          //   usertype = 'active';
          // }
  
          // let print = params.get('print');
          // if (print != 'true')
          //   print = 'false';
  
          title = "Search Student";
          console.log("in case for search student");
          
          req.open('GET', this.studentSearch); //" + usertype + "&print=" + print, true);
          break;
//

      default:
        req.open('GET', this.myinfo, true);
        // console.log('Ok load default nothing.....or load basic user details TODO::::');
        break;
    }
    req.setRequestHeader('Authorization', 'Bearer ' + token);
    req.send();
   }.bind(this));
};


//VP: REMOVE
function getUserInfo(uid) {
  const ref = firebase.database().ref(SITE + '/Customers/' + uid);
  return ref.once('value').then(snap => snap.val());
}

// Triggered on Firebase auth state change.
Demo.prototype.onAuthStateChanged = function (user) {
  console.log(' .....In onAuthStateChanged ....' + user);
  if (user) {
    //console.log('onAuthStateChanged: ....' + user.uid);
    authUser = user;
    this.signedOutCard.style.display = 'none';
    this.signedInCard.style.display = 'block';
    this.startFunctionsRequest();

   
    //----

    //Load page content:
    //console.log("111 onAuthStateChanged load page content......"+window.location.href);
    let urlRef = new URL(window.location.href);
    let params = new URLSearchParams(urlRef.search);
    let userId = params.get('user');
    let orderId = params.get('orderId');
    let load = params.get('load');
    //console.log("on load completed......"+userId+', orderId:'+orderId, );
    //console.log("..........ok let us load: "+ load);
    this.loadContent(load, params);
    //-------------End load page content


  } else {
    this.signedOutCard.style.display = 'block';
    this.signedInCard.style.display = 'none';
  }
};

// Initiates the sign-in flow using GoogleAuthProvider sign in in a popup.
Demo.prototype.signIn = function () {
  //firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
  //var ui = new firebaseui.auth.AuthUI(firebase.auth());
};

// Signs-out of Firebase.
Demo.prototype.signOut = function () {
  firebase.auth().signOut();
  // clear the __session cookie
  document.cookie = '__session=';
  //window.location.href = "https://www.varshahostel.com";
};

Demo.prototype.sendWhatsapReminder = function (phone, name, day) {
  var dateObj = new Date();
  var month = dateObj.getUTCMonth() + 1;
  //console.log('day:'+day)
  var dateStr = day + "/" + month + "/" + dateObj.getUTCFullYear();
  var url = "https://wa.me/" + phone + "?text="
    + "Attention: " + name + ",%0a\n"
    + "Your 'Varsha Hostel' payment due date is on or before " + dateStr + ", please pay as soon as possible. "
    + "%0a\n%0a\nIf you have paid already, please send payment screen shot to this number.";

  //console.log('url:'+url);
  window.open(url, '_blank').focus();
}

//TODO: REMOVE THIS function
Demo.prototype.markBillAsPaid = function (uid, transactionId) {
  console.log('in markBillAsPaid');
  /////////////////////////
  firebase.auth().currentUser.getIdToken().then(function (token) {
    //console.log('Sending request to', this.fetchMenuItems, 'with ID token in Authorization header.');
    var req = new XMLHttpRequest();
    req.onload = function () {
      this.fullWidthContainer.innerHTML = req.responseText;
    }.bind(this);
    req.onerror = function () {
      this.responseContainer.innerText = 'There was an error';
    }.bind(this);

    var notes = document.getElementById('notes').value;
    var getURL = this.markBillAsPaidURL + "?user=" + uid+"&transactionId=" + transactionId+"&notes="+notes;

    req.open('GET', getURL, true);
    req.setRequestHeader('Authorization', 'Bearer ' + token);
    req.send();
  }.bind(this));
}

//Called from userlist context
Demo.prototype.markBillAsPaidNew = function (uid, transactionId) {
  console.log('in markBillAsPaidNew');
  /////////////////////////
  firebase.auth().currentUser.getIdToken().then(function (token) {
    //console.log('Sending request to', this.fetchMenuItems, 'with ID token in Authorization header.');
    var req = new XMLHttpRequest();
    req.onload = function () {
      //this.fullWidthContainer.innerHTML = req.responseText;
      document.getElementById(uid+"_pendingbills").innerHTML = "<td></td><td align='center' colspan='11'>"+req.responseText+"</td>"; 
      //document.getElementById("user+_"+uid).style = "color: blue";
    }.bind(this);
    req.onerror = function () {
      //this.responseContainer.innerText = 'There was an error';
      document.getElementById(uid+"_pendingbills").innerHTML = "<td></td><td align='center' colspan='11'>There was an error</td>"; 

    }.bind(this);

    var notes = document.getElementById(transactionId+'_notes').value;
    var collectedAmount = document.getElementById(transactionId+'_collected').value;
    var getURL = this.markBillAsPaidURL + "?user=" + uid+"&transactionId=" + transactionId+"&notes="+notes+"&camount="+collectedAmount+"&onlyBills=true";
console.log(".... getUrl is:"+getURL);
    req.open('GET', getURL, true);
    req.setRequestHeader('Authorization', 'Bearer ' + token);
    req.send();
  }.bind(this));
}

Demo.prototype.addAUserBill = function (uid) {
  console.log('in markBillAsPaidNew');
  /////////////////////////
  firebase.auth().currentUser.getIdToken().then(function (token) {
    var req = new XMLHttpRequest();
    req.onload = function () {
      //this.fullWidthContainer.innerHTML = req.responseText;
      console.log('in add a user bill.... responseTxt:'+req.responseText);
      document.getElementById(uid+"_pendingbills").innerHTML = "<td></td><td align='center' colspan='11'>"+req.responseText+"</td>"; 
      document.getElementById(uid+"_pendingbills").style.display = "table-row";
      //document.getElementById("user+_"+uid).style = "color: blue";
    }.bind(this);
    req.onerror = function () {
      //this.responseContainer.innerText = 'There was an error';
      document.getElementById(uid+"_pendingbills").innerHTML = "<td></td><td align='center' colspan='11'>There was an error</td>"; 
    }.bind(this);

    var trans_desc = document.getElementById(uid+'_trans_desc').value;
    var trans_amount = document.getElementById(uid+'_trans_amount').value;
    var getURL = this.addAUserBillURL + "?user=" + uid+"&trans_desc=" + trans_desc+"&trans_amt="+trans_amount;
    req.open('GET', getURL, true);
    document.getElementById(uid+'_newtransaction').style.display = "none";
    req.setRequestHeader('Authorization', 'Bearer ' + token);
    req.send();
  }.bind(this));
}

Demo.prototype.onClickBillChkBox = function (transactionId) {
  var chkBox = document.getElementById("chk_"+transactionId);


  var amount = Number(document.getElementById("amt_"+transactionId).innerText);

  var totalOutstanding = Number(document.getElementById("amt_totalOutstanding").innerText)
  var transactionIds = document.getElementById("transactionIds").value;

  console.log("transaction Id: "+ transactionId+", chckbox status:"+chkBox.checked+", amount:"+ amount+", totalOutstanding:"+totalOutstanding);

  if (chkBox.checked == true) {
    totalOutstanding += amount;
    transactionIds += ","+transactionId;
  } else {
    totalOutstanding -= amount;
    transactionIds = transactionIds.replace(transactionId, "");
  }

  var discount = 0;
  if (totalOutstanding > 3699) {
    discount = 10;
  }

  var netPayableAmt = totalOutstanding - discount;

  console.log("After transaction Id: "+ transactionId+", chckbox status:"+chkBox.checked+", amount:"+ amount+", totalOutstanding:"+totalOutstanding+", transactionIds="+transactionIds);
  document.getElementById("amt_totalOutstanding").innerText = totalOutstanding;
  document.getElementById("amt_discount").innerText = -discount;
  document.getElementById("payAmt").innerText = netPayableAmt;
  document.getElementById("transactionIds").value = transactionIds;
  return true;
}

Demo.prototype.sendWhatsapReminderNew = function (uid, phone, name, day) {
  console.log('in sendWhatsapReminderNew');
  /////////////////////////
  firebase.auth().currentUser.getIdToken().then(function (token) {
    //console.log('Sending request to', this.fetchMenuItems, 'with ID token in Authorization header.');
    var req = new XMLHttpRequest();
    req.onload = function () {
      // this.responseContainer.innerText = req.responseText;
      //  this.responseContainer.innerHTML = req.responseText;
      var dateObj = new Date();
      var month = dateObj.getUTCMonth() + 1;
      var dateStr = day + "/" + month + "/" + dateObj.getUTCFullYear();
      var url = "https://wa.me/" + phone + "?text="
        + "Attention: " + name + ",%0a\n"
        + "Your 'Varsha Hostel' monthly payment due date is on or before " + dateStr + ", please pay as soon as possible. %0a\n%0a\n"
        + "Following bills are pending:%0a\n"
        + req.responseText
        + "%0a\n%0a\nIf you have paid already, please send payment screen shot to this number.";

      //console.log('url:'+url);
      window.open(url, '_blank').focus();

    }.bind(this);
    req.onerror = function () {
      this.responseContainer.innerText = 'There was an error';
    }.bind(this);

    var getURL = this.billDues + "?user=" + uid;
    req.open('GET', getURL, true);
    req.setRequestHeader('Authorization', 'Bearer ' + token);
    req.send();
  }.bind(this));


}

Demo.prototype.printThisPage = function () {
  firebase.auth().currentUser.getIdToken().then(function (token) {
    //console.log('Sending request to', this.fetchMenuItems, 'with ID token in Authorization header.');
    var req = new XMLHttpRequest();
    req.onload = function () {
      // this.responseContainer.innerText = req.responseText;
      //  this.responseContainer.innerHTML = req.responseText;
      this.fullWidthContainer.innerHTML = req.responseText;
    }.bind(this);
    req.onerror = function () {
      this.responseContainer.innerText = 'There was an error';
    }.bind(this);
    console.log("url:" + window.location.href);
    window.location.href = window.location.href + "&print=true";
    //req.open('GET', window.location.href+"&print=true", true);
    //req.setRequestHeader('Authorization', 'Bearer ' + token);
    //req.send();
  }.bind(this));
};

//TODO: NOt used now?????
Demo.prototype.collectPayTmPayLinkPayment = function () {
  firebase.auth().currentUser.getIdToken().then(function (token) {
    //console.log('Sending request to', this.fetchMenuItems, 'with ID token in Authorization header.');
    var req = new XMLHttpRequest();
    req.onload = function () {
      // this.responseContainer.innerText = req.responseText;
      //  this.responseContainer.innerHTML = req.responseText;
//      this.fullWidthContainer.innerHTML = req.responseText;
document.getElementById("payLinkDiv").innerHTML = req.responseText; 


    }.bind(this);
    req.onerror = function () {
      this.responseContainer.innerText = 'There was an error';
    }.bind(this);

    var customerId = document.getElementById("customerId").value;
    var amount = Number(document.getElementById("payAmt").innerText);
    var transactionIds = document.getElementById("transactionIds").value;
    console.log('customerId= '+customerId+", amount= "+amount+", transactionIds= "+transactionIds);

    var payLinkURL = window.location.protocol + "//" + window.location.host + "/" + SITE + "/collectpaylink";
    req.open('GET', payLinkURL + "?customer=" + customerId + "&amount=" + amount+"&transactionIds="+transactionIds, true);
    req.setRequestHeader('Authorization', 'Bearer ' + token);
    req.send();
  }.bind(this));
};

//This is used NOW...
Demo.prototype.initiatePaybill = function () {
  //var collectForm = '<span>Label: <input type="text"><small>(ft)</small></span>\r\n';
  //document.getElementById('paybilldiv').innerHTML = collectForm;     
  var customerId = document.getElementById("customerId").value;
  var amount = Number(document.getElementById("payAmt").innerText);
  var transactionIds = document.getElementById("transactionIds").value;
  console.log('customerId= '+customerId+", amount= "+amount+", transactionIds= "+transactionIds);
  if (amount > 0) {
    window.location.href = this.payBill + "?customer=" + customerId + "&amount=" + amount+"&transactionIds="+transactionIds;
  } else {
//TODO print an error message
// Please select atleast one bill to pay
console.log("amount is not >0");
  }
};

//TODO: Can be removed??
Demo.prototype.printData = function () {
  firebase.auth().currentUser.getIdToken().then(function (token) {
    //console.log('Sending request to', this.fetchMenuItems, 'with ID token in Authorization header.');
    var req = new XMLHttpRequest();
    req.onload = function () {
      // this.responseContainer.innerText = req.responseText;
      //  this.responseContainer.innerHTML = req.responseText;
      this.fullWidthContainer.innerHTML = req.responseText;
    }.bind(this);
    req.onerror = function () {
      this.responseContainer.innerText = 'There was an error';
    }.bind(this);
    req.open('GET', this.payBill, true);
    req.setRequestHeader('Authorization', 'Bearer ' + token);
    req.send();
  }.bind(this));
};

Demo.prototype.getMonthlySheet = function (billTag) {
  firebase.auth().currentUser.getIdToken().then(function (token) {
    //console.log('Sending request to', this.fetchMenuItems, 'with ID token in Authorization header.');
    var req = new XMLHttpRequest();
    req.onload = function () {
      // this.responseContainer.innerText = req.responseText;
      //  this.responseContainer.innerHTML = req.responseText;
      this.fullWidthContainer.innerHTML = req.responseText;
    }.bind(this);
    req.onerror = function () {
      this.responseContainer.innerText = 'There was an error';
    }.bind(this);
    var monthlySheetURL = window.location.protocol + "//" + window.location.host + "/" + SITE + "/monthlysheet?tag=" + billTag;
    //console.log('getmonthly seett SITE:' + SITE + '...billtag:' + billTag + '...url::' + monthlySheetURL);
    req.open('GET', monthlySheetURL, true);
    req.setRequestHeader('Authorization', 'Bearer ' + token);
    req.send();
  }.bind(this));
};

Demo.prototype.deleteEBBills = function (billTag) {
  console.log("In generateEBInfo")
  let billGenMessage = firebase.database().ref(SITE + '/jobs/monthlybill/' + billTag);

  //Save Form Data To Firebase
  //db.doc().set({
  billGenMessage.set({
    "genEbBills": "delete"
  }).then(() => {
    console.log("EB bills deletion for billTag:+"+billTag+" submitted");
  }).catch((error) => {
    console.log(error)
  })

  console.log('...EB Bill gen submitted...');
};

Demo.prototype.generateEBInfo = function (billTag) {
  console.log("In generateEBInfo")
  let billGenMessage = firebase.database().ref(SITE + '/jobs/monthlybill/' + billTag+'/genEbBills');

  //Save Form Data To Firebase
  //db.doc().set({
  billGenMessage.set("generate").then(() => {
    console.log("EB bills generation for billTag:+"+billTag+" submitted");
  }).catch((error) => {
    console.log(error)
  })

  console.log('...EB Bill gen submitted...');
};

//--------------
Demo.prototype.deleteRentBills = function (billTag) {
  console.log("In deleteRentBills")
  let billGenMessage = firebase.database().ref(SITE + '/jobs/monthlybill/' + billTag+'/genEbBills');

  //Save Form Data To Firebase
  //db.doc().set({
  billGenMessage.set("delete").then(() => {
    console.log("Rent bills deletion for billTag:+"+billTag+" submitted");
  }).catch((error) => {
    console.log(error)
  })

  console.log('...EB Bill gen submitted...');
};

Demo.prototype.generateRentBills = function (billTag) {
  console.log("In generateRentBills")
  let billGenMessage = firebase.database().ref(SITE + '/jobs/monthlybill/' + billTag+"/genRentBills");

  //Save Form Data To Firebase
  //db.doc().set({
  billGenMessage.set("generate").then(() => {
    console.log("Rent bills generation for billTag:+"+billTag+" submitted");
  }).catch((error) => {
    console.log(error)
  })

  console.log('...EB Bill gen submitted...');
};
//---------------
Demo.prototype.generateMonthlySheet = function (billTag) {
  console.log("In generateMonthlySheet")
  let billGenMessage = firebase.database().ref(SITE + '/jobs/monthlybill/' + billTag);

  //Save Form Data To Firebase
  //db.doc().set({
  billGenMessage.set({
    "genbills": "generate"
  }).then(() => {
    console.log("generate submitted");
  }).catch((error) => {
    console.log(error)
  })

  console.log('...Bill gen submitted...');
};

Demo.prototype.submitForm = function () {
  console.log('Submitting shit to server');
};

// Does an authenticated request to a Firebase Functions endpoint using an Authorization header.
Demo.prototype.startFunctionsRequest = function () {
  firebase.auth().currentUser.getIdToken().then(function (token) {
    //console.log('Sending request to', this.fetchMenuItems, 'with ID token in Authorization header.');
    var req = new XMLHttpRequest();
    req.onload = function () {
      // this.responseContainer.innerText = req.responseText;
      //  this.responseContainer.innerHTML = req.responseText;
      this.menuDiv.innerHTML = req.responseText;
    }.bind(this);
    req.onerror = function () {
      this.responseContainer.innerText = 'There was an error';
    }.bind(this);
    req.open('GET', this.fetchMenuItems, true);
    req.setRequestHeader('Authorization', 'Bearer ' + token);
    req.send();
  }.bind(this));
};

// Load the demo.
window.demo = new Demo();


function generateMonthlySheet(billTag) {
  console.log("In generateMonthlySheet")
  let billGenMessage = firebase.database().ref(SITE + '/jobs/monthlybill/' + billTag);

  //Save Form Data To Firebase
  //db.doc().set({
  billGenMessage.set({
    "genbills": "generate"
  }).then(() => {
    console.log("generate submitted");
  }).catch((error) => {
    console.log(error)
  })

  console.log('...Bill gen submitted...');
}

var currentTab = 0; // Current tab is set to be the first tab (0)
//showTab(currentTab); // Display the current tab
//console.log('hmmmmmmmmmmmm currenttab=' + currentTab);
function showTab(n) {
  // This function will display the specified tab of the form ...
  console.log(' in..... showTab');
  var x = document.getElementsByClassName("tab");
  x[n].style.display = "block";
  // ... and fix the Previous/Next buttons:
  if (n == 0) {
    document.getElementById("prevBtn").style.display = "none";
  } else {
    document.getElementById("prevBtn").style.display = "inline";
  }
  if (n == (x.length - 1)) {
    document.getElementById("nextBtn").innerHTML = "Submit";
  } else {
    document.getElementById("nextBtn").innerHTML = "Next";
  }
  // ... and run a function that displays the correct step indicator:
  fixStepIndicator(n)
}

function nextPrev(n, event) {

  console.log(' in..... nextPrev');
  // This function will figure out which tab to display
  var x = document.getElementsByClassName("tab");
  // Exit the function if any field in the current tab is invalid:
  console.log('currentTab=' + currentTab + ', validEmer=' + validEmergencyNumber());

  if (currentTab === 'undefined') {
    console.log('currentTab is undefined................');
    currentTab = 0;
    showTable(currentTab);
  }

  if (n == 1 && !validateForm()) return false;
  // Hide the current tab:
  x[currentTab].style.display = "none";
  // Increase or decrease the current tab by 1:
  currentTab = currentTab + n;




  // if you have reached the end of the form... :
  if (currentTab >= x.length) {
    //...the form gets submitted:
    //document.getElementById("regForm").submit();
    submitUserForm(event);
    return false;
  }
  // Otherwise, display the correct tab:
  showTab(currentTab);
}

function submitUserForm(event) {
  console.log("In submitUserForm")
  let formMessage = firebase.database().ref(SITE + '/Customers/' + authUser.uid);
  //Prevent Default Form Submission Behavior
  event.preventDefault()
  let newFormMsg = formMessage.push();

  //Get Form Values

  userName = document.getElementById('uName').value
  //dob = document.getElementById('dob').value
  //emailId = document.getElementById('emailId').value
  emergencyPhone = document.getElementById('emergencyPhone').value
  userPhone = authUser.phoneNumber
  userRoom = document.getElementById('roomNo').value


  console.log('SITE=' + SITE + ', username=' + userName + ', phone=' + userPhone + ', emergencyPhone=' + emergencyPhone + '. uid=' + authUser.uid);
  /*if (!ValidPhoneNumber(emergencyPhone)) {
    console.log('eRR1 SITE=' + SITE + ', username=' + userName + ', phone=' + userPhone + ', emergencyPhone=' + emergencyPhone + '. uid=' + authUser.uid);
    document.getElementById('emergencyPhoneErr').innerHTML = "QQQWWW<FONT COLOR=\"#ff0000\">*Please enter valid 10 digit phone number without country code like 9444340123</FONT>";
    //emergencyPhone.setCustomValidity('Please enter 10 digit mobile number');
    console.log('eRR2 SITE=' + SITE + ', username=' + userName + ', phone=' + userPhone + ', emergencyPhone=' + emergencyPhone + '. uid=' + authUser.uid);
    return;
  } else
    document.getElementById('emergencyPhoneErr').innerHTML = "";*/


  //Save Form Data To Firebase
  //db.doc().set({
  formMessage.set({
    name: userName,
    //  dob: dob,
    //emailId: emailId,
    phone: userPhone,
    emergencyPhone: emergencyPhone,
    roomNo: userRoom.toUpperCase(),
  }).then(() => {
    console.log("Data saved fine...IK");

    showSummary(userPhone, userName, emergencyPhone, userRoom);

  }).catch((error) => {
    console.log(error)
  })

  console.log('...Your information submitted...');
}

function showSummary(userPhone, userName, emergencyPhone) {
  document.getElementById('demo-signed-in-card').innerHTML = "<pre><h4>   Thank you!</h4>" +
    "<h5>   Phone: " + userPhone +
    " <br>   Name: " + userName +
    " <br>   Emergency Phone: " + emergencyPhone +
    " <br>   Room No: " + roomNo +
    "<h5></pre>";
}

function validEmergencyNumber() {
  valid = true;
  emergencyPhone = document.getElementById('emergencyPhone').value
  if (!ValidPhoneNumber(emergencyPhone)) {
    valid = false;
  }
  return valid;
}

function ValidPhoneNumber(inputtxt) {
  var phoneno = /^\d{10}$/;
  if (inputtxt == "" || !phoneno.test(inputtxt)) {
    return false;
  }
  else {
    return true;
  }
}


function validRoomNumber() {
  valid = true;
  roomNo = document.getElementById('roomNo').value
  console.log(' room no=' + roomNo);
  if (!ValidRoomNo(roomNo)) {
    valid = false;
  }
  return valid;
}

function ValidRoomNo(inputtxt) {
  var roomNo = /^[ABCDabcd][123]$/;
  if (inputtxt == "" || !roomNo.test(inputtxt)) {
    return false;
  }
  else {
    return true;
  }
}

function validateForm() {
  console.log(' validateForm currentTab=' + currentTab + ', validEmer=' + validEmergencyNumber());
  console.log(' validateForm currentTab=' + currentTab + ', validRoom=' + ValidRoomNo());
  // This function deals with validation of the form fields
  var x, y, i, valid = true;
  x = document.getElementsByClassName("tab");
  y = x[currentTab].getElementsByTagName("input");
  // A loop that checks every input field in the current tab:
  for (i = 0; i < y.length; i++) {
    // If a field is empty...
    if ((y[i].value == "") || ((currentTab + 1) == 2 && !validEmergencyNumber()) || ((currentTab + 1) == 3 && !validRoomNumber())) {
      // add an "invalid" class to the field:
      y[i].className += " invalid";
      // and set the current valid status to false:
      valid = false;
    }
  }
  // If the valid status is true, mark the step as finished and valid:
  if (valid) {
    document.getElementsByClassName("step")[currentTab].className += " finish";
  }

  //console.log(" returning .... valid =" + valid)
  return valid; // return the valid status
}

function fixStepIndicator(n) {
  // This function removes the "active" class of all steps...
  var i, x = document.getElementsByClassName("step");
  for (i = 0; i < x.length; i++) {
    x[i].className = x[i].className.replace(" active", "");
  }
  //... and adds the "active" class to the current step:
  x[n].className += " active";
}


//console.log("Site is " + SITE);
