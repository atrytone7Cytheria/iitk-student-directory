
exports.userHasAdminAccess = function userHasAdminAccess(user) {
    //console.log('.....................emulator?? '+process.env.FUNCTIONS_EMULATOR);
    if (process.env.FUNCTIONS_EMULATOR)
      return true;
    
    if ((user.user_id == 'OcKrYAhROgU7vcWsgbqsgna0uiN2') || (user.user_id == 'OcKrYAhROgU7vcWsgbqsgna0uiN2') || (user.user_id =='wnUNZDCxzgXmzlmCb0dHpUPkiUO2'))
      return true;

    return true;
}



