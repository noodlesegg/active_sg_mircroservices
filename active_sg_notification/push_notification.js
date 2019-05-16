const AWS = require('aws-sdk');
const sns = new AWS.SNS();

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

module.exports = function(queueMessageBody) {

	var iosDevices = queueMessageBody.iostokens;
	var androidDevices = queueMessageBody.androidtokens;
	var notificationText = queueMessageBody.notification_text;

	return {

		"notify": function notify () {

			return new Promise((resolve, reject) => {
				
				iosDevices.forEach(iosPlatformEndpoint);
				androidDevices.forEach(androidPatformEndpoint);

				function iosPlatformEndpoint (token) {
					let params = {
						PlatformApplicationArn: process.env.APNS,
						Token: token
					};
					let payload = {
						"APNS": {
							aps: {
								alert: notificationText,
								badge: 1,
								sound: "default"
							}
						}
					};
					console.log(`creating ios platform endpoint ${JSON.stringify(params)}`);
					createPlatformEndpoint(params, payload);
				}

				function androidPatformEndpoint(token) {
					let params = {
						PlatformApplicationArn: process.env.GCM,
						Token: token
					};
					let payload = {
						"GCM": {
							notification: {
								text: notificationText
							}
						}
					}
					console.log(`creating android platform endpoint ${JSON.stringify(params)}`);
					createPlatformEndpoint(params, payload);
				}

				function createPlatformEndpoint(params, payload) {
					sns.createPlatformEndpoint(params, (error, data) => {
						if (error) {
							reject(`push_notification.js createPlatformEndpoint error ${JSON.stringify(error)}`);
						}
						console.log(`createPlatformEndpoint successful. ${JSON.stringify(data)}`);
						publish(data.EndpointArn, payload);
					});
				}

				function publish(endPointArn, payload) {
					let params = {
						MessageStructure: 'json',
						Message: JSON.stringify(payload),
						TargetArn: endPointArn
					}
					console.log(`publishing... ${JSON.stringify(params)}`);
					sns.publish(params, publishCallback);
				}

				function publishCallback (error, data) {
					if (error) {
						reject(`publish error ${JSON.stringify(error)}`);
					}
					resolve('push notification successfuly published.');
				}

			});
		}
	}
}