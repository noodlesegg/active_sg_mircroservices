const pdf = require('html-pdf');
const AWS = require('aws-sdk');
const S3 = new AWS.S3();
// default PDF filename
let pdfFileName = + new Date() + '.pdf';
let subject = null;
let email = null;
let html = null;

/* 
 *   {
 *      html: '<h1>Html here</h1>',
 *      email: 'sample@sample.com',
 *      filename: 's3 key',
 *      subject: 'ActiveSG eReceipt'
 *   }
 */
exports.generate = (event, context, callback) => {

    if (event.html == null) {
        console.log("@generate handler. No Html supplied");
        return;
    }
    subject = event.subject;
    html = event.html;
    email = event.email;
    setFileName(event);
    convertToPdf();
};

function setFileName(event) {
    if (event.filename != null) {
        pdfFileName = event.filename;
    }
}

function convertToPdf() {

    console.log(`converting html to pdf`);
    let options = {
        height: '768px',
        width: '1024px'
    }
    console.log(`creating ${pdfFileName}`);
    pdf.create(html, options).toBuffer((error, buffer) => {
        if (error){
            console.log(`Error in converting to pdf ${JSON.stringify(error)}`);
            return;
        }
        console.log(`pdf file created ${pdfFileName}`);
        let params = {
            StorageClass: 'STANDARD_IA',
            Bucket: process.env.pdfBucket,
            Key: pdfFileName,
            Body: buffer
        };
        console.log(`uploading ${pdfFileName} to ${process.env.pdfBucket}`);
        S3.putObject(params, s3PutObjectResponse);
    });
}

function s3PutObjectResponse(error, data) {
    if (error) {
        console.log(`@s3PutObjectResponse Error ${JSON.stringify(error)}`);
        return;
    }
    console.log(`@s3PutObjectResponse pdf file already uploded into ${process.env.pdfBucket}`);
    sendEmail();
}

function sendEmail() {
    if (email == null) {
        console.log('No email provided, disregarding notification');
        return;
    }
    console.log(`sending email notification to ${email}`);
    let params = {
        FunctionName: process.env.sendMailFunction,
        Payload: JSON.stringify({
            filename: pdfFileName,
            email: email,
            subject: subject
        })
    };
    let lambda = new AWS.Lambda({region: process.env.region});
    
    lambda.invoke(params, (error, response) => {
        if (error) {
            console.log(`@sendEmail lambda invoke error ${JSON.stringify(error)}`);
            return;
        }
        console.log(`${process.env.sendMailFunction} successfully invoked`);
    });
}