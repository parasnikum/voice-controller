// npm install @vonage/server-sdk


const { Vonage } = require('@vonage/server-sdk')

const vonage = new Vonage({
  apiKey: "2181b5f1",
  apiSecret: "CfZfSxB3dpThKuuG" // if you want to manage your secret, please do so by visiting your API Settings page in your dashboard
})



const from = "2181b5f1"
const to = "917020086058"
const text = 'A text message sent using the Vonage SMS API'

async function sendSMS() {
    await vonage.sms.send({to, from, text})
        .then(resp => { console.log('Message sent successfully'); console.log(resp); })
        .catch(err => { console.log('There was an error sending the messages.'); console.error(err); });
}

sendSMS();