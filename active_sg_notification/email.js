const aws = require('aws-sdk');
const ses = new aws.SES({region: 'us-east-1'});
const nodemailer = require('nodemailer');

/*
{
	notification_queue_id: ""
	notification_type: ""
	recipient_id: ""
	recipient_type: ""
	notification_send_at: ""
	notification_text: ""
	option: ""
	is_send: ""
	send_success: ""
	resend_count: ""
	account_id: ""
	send_from: ""
	notification_subject: ""
	sender_name: ""
	sender_id: ""
	badge: ""
	is_cancel: ""
	created_at: ""
	created_by: ""
	updated_at: ""
	updated_by: ""
	deleted_at: ""
	deleted_by: ""
}
*/
module.exports = function (messageQueueBody) {

	var queueId = messageQueueBody.notification_queue_id;
	var from = 'no-reply@iappsasia.com';
	var recipient = messageQueueBody.recipient_id;
	var subject = messageQueueBody.notification_subject;
	var message = messageQueueBody.notification_text;

	return {
		
		"notify": function notify () {

			return new Promise((resolve, reject) => {
				console.log(`sending email. notification queue id ${queueId}`);
				let mailOptions = {
			        from: from,
			        subject: subject,
			        to: recipient,
			        text: message
		        };
		        let transporter = nodemailer.createTransport({
		            SES: ses
		        });
		        transporter.sendMail(mailOptions, (error, info) => {
		            if (error) {
		            	reject(`email.js error notification queue id ${queueId} ${JSON.stringify(error)}`);
		            }
		            resolve(`email notification sent. notification queue id ${queueId}`);
		        });
			});
		}
	}
}