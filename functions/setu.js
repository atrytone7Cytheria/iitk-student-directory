/*import { SetuUPIDeepLink } from "@setu/upi-deep-links";

const upidl = SetuUPIDeepLink({
    schemeID: "5bf4376b-6008-43c8-8ce0-a5ea196e3091",
    secret: "9975fd99-d5ed-416a-9963-5d113dc80582",
    productInstanceID: "861023031961584801",
    mode: "SANDBOX",
    authType: "JWT",
});

const paymentLinkBody = {
    amountValue: 20000, // amount in paisa
    billerBillID: "918147077472", // Unique merchant platform identifier for bill
    amountExactness: "EXACT",
    // Optional fields
    settlement: {
        parts: [
            {
                account: {
                    id: "987654321",
                    ifsc: "KKBK0000001",
                },
                remarks: "EXACT sample split",
                split: {
                    unit: "INR",
                    value: 10000,
                },
            },
        ],
        primaryAccount: {
            id: "123456789",
            ifsc: "KKBK0000001",
        },
    },
};

const data = await upiDL.createPaymentLink(paymentLinkBody);

//Check status of UPI payment link
const data1 = await upiDL.checkPaymentStatus("891365293916423373");

//Expire a UPI payment link
const data2 = await upiDL.expireBill("891365293916423373");

//Initiate refunds
const data3 = await upiDL.initiateRefund({
    refunds: [
        {
            identifier: platformBillID,
            identifierType: "BILL_ID",
            refundType: "FULL",
            deductions: [
                {
                    account: {
                        id: "123456789",
                        ifsc: "KKBK0000001",
                    },
                    split: {
                        unit: "INR",
                        value: 10000,
                    },
                },
                {
                    account: {
                        id: "987654321",
                        ifsc: "KKBK0000001",
                    },
                    split: {
                        unit: "INR",
                        value: 10000,
                    },
                },
            ],
        },
    ],
});

//Get refund batch status
const data4 = await upiDL.getRefundBatchStatus(initiateRefundResponse.batchID);

//Get individual refund status
const data = await upiDL.getRefundStatus(getRefundBatchStatusResponse.refunds[0].id);*/

const functions = require('firebase-functions');
const cookieParser = require('cookie-parser')();
const cors = require('cors')({ origin: true });
const http = require("https");


//exports.fetchAuthToken = functions.https.onCall(async (data, context) => {
exports.fetchAuthToken = function (data, context) {
    console.log("in fetchAuthToken..............");

    const options = {
      "method": "POST",
      "hostname": "uat.setu.co",
      "port": null,
      "path": "/api/v2/auth/token",
      "headers": {
        "content-type": "application/json"
      }
    };
    
    const req = http.request(options, function (res) {
      const chunks = [];
    
      res.on("data", function (chunk) {
        chunks.push(chunk);
      });
    
      res.on("end", function () {
        const body = Buffer.concat(chunks);
        console.log("END...AuthTOken:"+body.toString());
      });
    });
    
    req.write(JSON.stringify({clientID: '0b9f443153a6419090153754c7b607c4', secret: 'ed99bb2e81b94d4584d1cb5039f074cd'}));
    req.end();
};

//exports.generateSetuPayLink = functions.https.onCall(async (data, context) => {
exports.generateSetuPayLink = function (data, context)  {

    const options = {
        "method": "POST",
        "hostname": "uat.setu.co",
        "port": null,
        "path": "/api/v2/payment-links",
        "headers": {
            "X-Setu-Product-Instance-ID": "0b9f443153a6419090153754c7b607c4",
            //"Authorization": "ed99bb2e-81b9-4d45-84d1-cb5039f074cd",
            "Authorization": "ed99bb2e81b94d4584d1cb5039f074cd",
            "content-type": "application/json"
        }
    };

    console.log('in generateSetuPayLink, options='+JSON.stringify(options));

    const req = http.request(options, function (res) {
        const chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            const body = Buffer.concat(chunks);
            console.log("************Setu END"+body.toString());
        });
    });

    req.write(JSON.stringify({
        amount: { currencyCode: 'INR', value: 1 },
        amountExactness: 'EXACT',
        billerBillID: '918147077471',
        expiryDate: '2024-05-15T12:23:50Z',
        name: 'Setu Payment Links Test',
        settlement: {
            parts: [
                {
                    account: { id: '777705432109', ifsc: 'ICIC0002345' },
                    remarks: 'EXACT sample split',
                    split: { unit: 'INR', value: 1 }
                }
            ],
            primaryAccount: { id: '777705432109', ifsc: 'ICIC0002345' }
        }
    }));
    req.end();
};