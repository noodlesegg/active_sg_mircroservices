const messagebird = require('messagebird')(process.env.messageBirdAccessKey);

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
	var sender = messageQueueBody.sender_name;
	var recipient = messageQueueBody.recipient_id;
	var message = messageQueueBody.notification_text;

	return {

		"notify": function notify() {
			
			return new Promise((resolve, reject) => {
				console.log(`sending sms notification. notification queueId ${queueId}`);
				let params = {
					originator: sender,
				  	recipients: [recipient],
				  	body: message
				};
				messagebird.messages.create(params, (error, response) => {
					if (error) {
				  		reject(`sms.js error notification queue id ${queueId} ${JSON.stringify(error)}`);
				  	}
				  	resolve(`sms notification sent. notification queue id: ${queueId}`);
				});
			});
		}
	}
}