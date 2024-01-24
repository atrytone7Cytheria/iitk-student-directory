//For staging
var PaytmConfig = {
    mid: "PIrDWO32566688899955",
    key: "GSzutbV9xhPWQTYz",
    website: "WEBSTAGING",
    mywebsite: "http://135.250.127.49:5000",
    hostname: 'securegw-stage.paytm.in'
}

//*************** For production ******************************

//Paytm Production on emulator
var PaytmConfigEmuProd = {
    mid: "nUEARl68492857783211",
    key: "Ve&@B6cDoCblIm2T",
    website: "DEFAULT",
    mywebsite: "http://135.250.127.49:5000",
    hostname: 'securegw.paytm.in'
}

//Paytm Production on deployment
var PaytmConfigProd = {
    mid: "nUEARl68492857783211",
    key: "Ve&@B6cDoCblIm2T",
    website: "DEFAULT",
    mywebsite: "https://www.varshahostel.com",
    hostname: 'securegw.paytm.in'
}

if (process.env.FUNCTIONS_EMULATOR)
    //exports.PaytmConfig = PaytmConfigEmuProd
    exports.PaytmConfig = PaytmConfig
else 
    exports.PaytmConfig = PaytmConfigProd