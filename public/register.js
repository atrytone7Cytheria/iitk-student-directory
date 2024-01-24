//'use strict';

var authUser;

// Initializes the Demo.
function Demo() {

  var ui = new firebaseui.auth.AuthUI(firebase.auth());

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
    this.responseContainerCookie = document.getElementById('demo-response-cookie');
    //this.helloUserUrl = window.location.href + 'hello';
    this.helloUserUrl = window.location.protocol + "//" + window.location.host + "/myinfo";
    this.signedOutCard = document.getElementById('demo-signed-out-card');
    this.signedInCard = document.getElementById('demo-signed-in-card');


    // Bind events.
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    //    this.submitButton.addEventListener('click', this.submitForm.bind(this));
    firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
  }.bind(this));
}

function getUserInfo(uid) {
  const ref = firebase.database().ref(SITE + '/Customers/' + uid);
  return ref.once('value').then(snap => snap.val());
}

// Triggered on Firebase auth state change.
Demo.prototype.onAuthStateChanged = function (user) {
  console.log(' In onAuthStateChanged ....');
  if (user) {
    authUser = user;
    this.signedOutCard.style.display = 'none';
    this.signedInCard.style.display = 'block';
    this.startFunctionsRequest();
    //----
    getUserInfo(authUser.uid).then(userInfo => {
      console.log("User info is =" + JSON.stringify(userInfo));

      if (userInfo != null) {
        userName = userInfo.name;
        console.log("User name=" + userName);
        if (userInfo !== undefined && userInfo.status == 'FULFILLED') {
          showSummary(userInfo.emergencyPhone, userInfo.name, userInfo.emergencyPhone, userInfo.roomNo);
          console.log("user is FULFILLED")
        } else {
          document.getElementById('uName').value = userName;
          //document.getElementById('dob').value = userInfo.dob;
          //document.getElementById('emailId').value = userInfo.emailId;
          document.getElementById('emergencyPhone').value = userInfo.emergencyPhone;
          document.getElementById('roomNo').value = userInfo.roomNo;
        }
      }
    });

    //----


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
};

Demo.prototype.submitForm = function () {
  console.log('Submitting shit to server');
};

// Does an authenticated request to a Firebase Functions endpoint using an Authorization header.
Demo.prototype.startFunctionsRequest = function () {
  firebase.auth().currentUser.getIdToken().then(function (token) {
    console.log('Sending request to', this.helloUserUrl, 'with ID token in Authorization header.');
    var req = new XMLHttpRequest();
    req.onload = function () {
      //this.responseContainer.innerText = req.responseText;
      //this.responseContainer.innerHTML = req.responseText;
    }.bind(this);
    req.onerror = function () {
      this.responseContainer.innerText = 'There was an error';
    }.bind(this);
    req.open('GET', this.helloUserUrl, true);
    req.setRequestHeader('Authorization', 'Bearer ' + token);
    req.send();
  }.bind(this));
};

// Load the demo.
window.demo = new Demo();



var currentTab = 0; // Current tab is set to be the first tab (0)
showTab(currentTab); // Display the current tab

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

  // This function will figure out which tab to display
  var x = document.getElementsByClassName("tab");
  // Exit the function if any field in the current tab is invalid:
  console.log('currentTab=' + currentTab + ', validEmer=' + validEmergencyNumber());

  if (currentTab === 'undefined') {
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
  console.log(' room no='+roomNo);
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

  console.log(" returning .... xxvalid =" + valid)
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


console.log("Site is " + SITE);


