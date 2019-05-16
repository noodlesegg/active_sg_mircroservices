const aws = require('aws-sdk');
const ses = new aws.SES({region: 'us-east-1'});
const s3 = new aws.S3();
const nodemailer = require('nodemailer');

/**
 *  {
 *		filename: 'sample.pdf',
 *		email: 'sample@iappsaisa.com',
 *		subject: 'ActiveSG eReceipt',
 *	}
 */
exports.send = (event, context, callback) => {

	let filename = event.filename;
	let email = event.email;
	let subject = getSubject(event);
	if (isNull(filename) || isNull(email)) {
		console.log('s3 key or filename and email is required');
		return;
	}
	getPdf(filename).then((fileData) => {
        let mailOptions = {
	        from: 'no-reply@iappsasia.com',
	        subject: subject,
	        to: email,
	        attachments: [{
	            filename: filename,
	            content: fileData.Body
	        }]
        };
        console.log('Creating SES transporter');
        let transporter = nodemailer.createTransport({
            SES: ses
        });
        console.log('Sending email');
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
            	console.log(`error in sending email ${JSON.stringify(error)}`);
            	return;
            }
            console.log(`email sent. ${JSON.stringify(info.envelope)} 
            	messageId = ${info.messageId} response = ${info.response}`
            )
        });
	}).catch(function (error) {
		console.log(`error in getting file from s3 ${JSON.stringify(error)}`);
    });
}

function getSubject(event) {
	return event.subject == null ? 'ActiveSG eReceipt' : event.subject;
}

function isNull(param) {
	return param == null;
}

function getPdf(filename) {
	console.log(`getting ${filename} in ${process.env.pdfBucket}`);
	return new Promise(function (resolve, reject) {
		let params = {
			Bucket: process.env.pdfBucket,
            Key: filename
		}
        s3.getObject(params, (err, data) => {
            if (err) {
                return reject(err);
            }
            return resolve(data);
        });
    });
}