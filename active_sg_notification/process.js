const AWS = require('aws-sdk');
const notificationTypes = ['email', 'sms', 'push_notification'];
const sqs = new AWS.SQS();

exports.queue = (event, context, callback) => {
	event.Records.forEach(messageQueue);
}

function messageQueue(message) {
	let body = getBody(message);
	let notificationType = body.notification_type;
	let queueId = body.notification_queue_id;
	if (isMoreThanFiveMinutes(message)) {
		console.log(`message is more than five minutes old. queueId: ${queueId} ${JSON.stringify(message)}`);
		deleteMessageInQueue(message);
		return;
	}
	console.log(`processing queueId: ${queueId} notification type ${notificationType}`);
	if (isInvalidNotificationType(notificationType)) {
		console.log(`invalid notification type ${notificationType}`);
		return;
	}

	let notification = require(`${notificationType}.js`);
	notification = new notification(body);
	notification.notify().then((successMessage) => {
		console.log(successMessage);
		moveMessageToSuccessfulQueue(message);
	}).catch((errorMessage) => {
		console.log(errorMessage)
	});
}

function isMoreThanFiveMinutes(message) {
	let fiveMinutes = (5*60*1000);
	let sentTimestamp = message.attributes.SentTimestamp;
	return (new Date() - new Date(parseInt(sentTimestamp))) > fiveMinutes;
}

function isInvalidNotificationType(notificationType) {
	return notificationTypes.indexOf(notificationType) === -1;
}

function moveMessageToSuccessfulQueue(message) {
	
	let body = getBody(message);
	let queueId = body.notification_queue_id;
	let params = {
		QueueUrl: process.env.successfulQueueUrl,
		MessageBody: JSON.stringify(body)
	};

	console.log(`moving notification queue id:${queueId} ${JSON.stringify(params)}`);
	sqs.sendMessage(params, function(error, data) {
		if (error) {
	    	console.log(`@moveMessageToSuccessfulQueue notification queue id: ${queueId}.
	    		error ${JSON.stringify(error)}`
	    	);
	    	return;
	  	}
	  	console.log(`notification queue id: ${queueId} successfully moved to ${process.env.successfulQueueUrl}`);
	  	deleteMessageInQueue(message);
	});
}

function getBody(message) {
	return JSON.parse(message.body);
}

function deleteMessageInQueue(message) {
	
	let params = {
		QueueUrl: process.env.toProcessQueueUrl,
		ReceiptHandle: message.receiptHandle
	};

	console.log(`deleting message in ${process.env.toProcessQueueUrl} ${JSON.stringify(params)}`);
	sqs.deleteMessage(params, function(error, data) {
		if (error) {
			console.log(`@deleteMessageInQueue error ${JSON.stringify(error)}`);
			return;
		}
		console.log(`message successfully deleted.`);
	});
}
