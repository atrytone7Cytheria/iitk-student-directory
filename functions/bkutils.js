function userJoinedLastMonthOrBefore(inmateInfo, monthlyBillTag) {
  
    //var inmateDOJArr = inmateInfo.doj.split("-");
    //var inmateDOJMonth = inmateDOJArr[1];
    var inmateDOJMonth = new Date(Date.parse(inmateInfo.doj)).getMonth()+1;
    var inmateDOJYear = new Date(Date.parse(inmateInfo.doj)).getFullYear();
  
    var billTagArr = monthlyBillTag.split("-");
    var billTagMonth = billTagArr[1];
    var billTagYear = billTagArr[0];
    
  
    console.log("In userJoinedLastMonthOrBefore: user="+inmateInfo.name+", inmateDOJ="+inmateInfo.doj+", inmate month/Year="+inmateDOJMonth+"/"+inmateDOJYear+", monthlyBillTag="+monthlyBillTag+", billtagMonth/year="+billTagMonth+"/"+billTagYear);
    if ((inmateDOJMonth < billTagMonth) || (inmateDOJYear < billTagYear))
      return true;
    
    return false;
  }
  

  function dateIsHowManyDaysBefore(dateString) {
  
    const [day, month, year] = dateString.split('-');
    var prevDate = new Date(year, month-1, day);
    var todayDate = new Date();
    // One day Time in ms (milliseconds)
    var one_day = 1000 * 60 * 60 * 24
  
    var numberOfdays = Math.round(todayDate.getTime() - prevDate.getTime()) / (one_day);
    
    return (numberOfdays.toFixed(0));
  }

  exports.userJoinedLastMonthOrBefore = userJoinedLastMonthOrBefore;
  exports.dateIsHowManyDaysBefore = dateIsHowManyDaysBefore;

