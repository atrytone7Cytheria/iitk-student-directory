const vhadmin = require('./vhadmin');
var admin = require("firebase-admin");
const functions = require('firebase-functions');

function getRooms() {
    const ref = admin.database().ref(SITE + '/Rooms');
    return ref.once('value').then(snap => snap.val());
}

exports.handler = function(request, response)  {

    // restrict user to admin only
    if (vhadmin.userHasAdminAccess(request.user) === false) {
      response.render('unauthorized');
      return;
    }
  
    SITE = request.params.siteName;
    console.log('Rooms........ site is.....................'+request.params.siteName);
    getRooms().then(rooms => {
      console.log("Site is:"+SITE);
      console.log("Site is in match:"+request.params.siteName);
      console.log("rooms JSON Is ........" + JSON.stringify(rooms));
      response.render('rooms', { SITE, rooms });
    });
  };

  exports.UpdateRoomOccupancyInfo = functions
  .database/*.instance('pgmgmt-619ec-default-rtdb')*/
  .ref('/{siteName}/Accounts/{accountId}/roomNo')
  .onWrite((change, context) => {
    console.log("\nUpdateRoomOccupancyInfo is it getting triggered");

    accountId = context.params.accountId;
    console.log("Site:"+context.params.siteName+", Function: UpdateRoomOccupancyInfo Account id:" + accountId);

    var beforeRoom = change.before.val();
    //if transaction is null it is a new account or a new transaction
    if (change.before.val() === null) {
        console.log(" Before Room is null, new user..");
    } else {
        console.log("Function: UpdateRoomOccupancyInfo Account id:" + accountId+", Update before Room:"+beforeRoom);
        admin.database().ref('/'+context.params.siteName + '/Rooms/' + beforeRoom + '/numberOfPeopleOccupied').once('value').then(function (snap) {
            var beforeOccupancyCount = snap.val();
            if (snap.val() === null) {
                console.log("  beforeRoom value in db is null???: beforeRoom:"+beforeRoom);
            } else {
                if (beforeOccupancyCount < 1) 
                    console.log("ERRRRRRRRRRRRRRRRR: Before occupancy count is 0 or less CANT BE .........");
                beforeOccupancyCount--;
                console.log("Function: UpdateRoomOccupancyInfo Account id:" + accountId+", Update before Room:"+beforeRoom+", before occupancy:"+beforeOccupancyCount);
                admin.database().ref('/'+context.params.siteName + '/Rooms/' + beforeRoom).update({
                    "numberOfPeopleOccupied": beforeOccupancyCount
                });
            }
        });
    }

    var afterRoom = change.after.val();
    //if transaction is null it is a new account or a new transaction
    if (change.after.val() === null) {
        console.log(" After Room is null, Deleted user..");
    } else {
        console.log("Function: UpdateRoomOccupancyInfo Account id:" + accountId+", Update after Room:"+afterRoom);
        admin.database().ref('/'+context.params.siteName + '/Rooms/' + afterRoom + '/numberOfPeopleOccupied').once('value').then(function (snap) {
            if (snap.val() === null) {
                console.log("  afterRoom value in db is null???: afterRoom:"+afterRoom);
            } else {
                var afterOccupancyCount = snap.val();
                afterOccupancyCount++;
                console.log("Function: UpdateRoomOccupancyInfo Account id:" + accountId+", Update after Room:"+afterRoom+", after occupancy:"+afterOccupancyCount);
                admin.database().ref('/'+context.params.siteName + '/Rooms/' + afterRoom).update({
                    "numberOfPeopleOccupied": afterOccupancyCount
                });
            }
        });
    }
  });


  exports.UpdateAllRoomOccupancyInfo = functions
  .database/*.instance('pgmgmt-619ec-default-rtdb')*/
  .ref('/{siteName}/triggers/UpdateAllRoomOccupancyInfo')
  .onWrite((change, context) => {
    console.log("\UpdateAllRoomOccupancyInfo is it getting triggered");

    SITE = context.params.siteName;
    admin.database().ref(SITE + '/Rooms/').once('value').then(function (roomsSnap) {
        var roomsObj = roomsSnap.val();
        if (roomsObj == null) {
          console.log("\n **** ERROR: Fetching rooms****");
          return;
        }
        console.log("\n Retrieved Rooms... Now process all");

        roomsSnap.forEach(function (roomSnapshot) {
          var roomId = roomSnapshot.key;
          console.log("\n Processing room:" + roomId);
          admin.database().ref('/'+context.params.siteName + '/Rooms/' + roomId).update({
              "numberOfPeopleOccupied": 0
          });
        });
      });

    admin.database().ref(SITE + '/AccIndexes/active/').once('value').then(function (activeInmateSnap) {
        var allActiveInmatesObj = activeInmateSnap.val();
        if (allActiveInmatesObj == null) {
          console.log("\n **** ERROR: Fetching all inmates under /AccIndexes/active/ failed, cannot start the bill generation job");
          return;
        }
          activeInmateSnap.forEach(function (roomUsersSnapshot) {
            var roomId = roomUsersSnapshot.key;
            var roomUsersData = roomUsersSnapshot.val();
            console.log("\n Processing room:" + roomId);
            console.log("\n Processing room:" + roomId + ", room users data==>" + JSON.stringify(roomUsersData));
            const numPersons =  roomUsersSnapshot.numChildren();
            admin.database().ref('/'+context.params.siteName + '/Rooms/' + roomId).update({
                "numberOfPeopleOccupied": numPersons
            });
          });
    });
  });