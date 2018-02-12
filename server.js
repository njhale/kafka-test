// server.js
'use strict';

let app = require('express')();
let debug = require('debug')('kafka-test');
let argv = require('optimist').argv;

// first configure the logger provider
let kafkaLogging = require('kafka-node/logging');
kafkaLogging.setLoggerProvider(debug);

let kafka = require('kafka-node');
let Consumer = kafka.Consumer;
let Offset = kafka.Offset;
let Client = kafka.Client;
var Producer = kafka.Producer;
let KeyedMessage = kafka.KeyedMessage;


let kafkaHost = process.env.KAFKA_HOST
  || 'my-cluster-kafka.kafka.svc.cluster.local:9092';
let topic = process.env.POD_NAMESPACE != null ?
  `${process.env.POD_NAMESPACE}.dropbox.drop` : 'localhost.dropbox.drop';
let groupId = 'group.dropbox';
let consumerId = `${process.env.POD_NAMESPACE}.${process.env.POD_NAME}`;

let port = 8080;

debug(`kafkaHost: ${kafkaHost}`);

let client = new Client(kafkaHost);
let topics = [{ topic: topic, partition: 1 }, { topic: topic, partition: 0 }];
let options = {
  groupId: groupId,
  id: consumerId,
  autoCommit: false,
  fetchMaxWaitMs: 1000,  // 1 second
  fetchMaxBytes: 1024 * 1024  // 1 MB
}

debug('setting consumer and offset...');

let consumer = new Consumer(client, topics, options);
let offset = new Offset(client);

debug('consumer and offset set');

// Wire kafka consumer event handlers

consumer.on('message', (message) => {
  debug(`A message has been retrieved from kafka: ${message}`);
});

consumer.on('error', (err) => {
  debug(`An error has occurred with the kafka consumer: ${err}`);
});

let producer = new Producer(client, { requireAcks: 1 });
let p = argv.p || 0;
let a = argv.a || 0;

// Wire kafka producer event handlers

debug('Wiring producer event handlers...');

producer.on('ready', () => {
  debug('Producer ready, sending 1000 messages...');

  // Send 1000 messages
  for (let i = 0; i < 1000; i++) {
    let message = `Hello World! ${i}`;
    let keyedMessage = new KeyedMessage('keyed', `A keyed Hello World! ${i}`);
    debug(`Sending message ${message}`);

    producer.send([
      {
        topic: topic,
        partition: p,
        messages: [message, keyedMessage],
        attributes: a
      }], (err, result) => {
        if (err) {
          debug(`An error has occurred while attempting to send a message: ${err}`);
        } else {
          debug(`Message successfully sent: ${result}`);
        }

      });

  }

});

producer.on('error', function (err) {
  debug(`The producer has encountered an error: ${err}`);
});

// consumer.on('offsetOutOfRange', (topic) => {
//   topic.maxNum = 2;
//
//   offset.fetch([topic], (err, offsets) => {
//     if (err) {
//       debug(`An error has occurred while getting offsets: ${err}`);
//       return;
//     }
//
//     // Wrap offset and fetch data from the beginning
//     let min = Math.min.apply(null, offsets[topic][topic.partition]);
//     consumer.setOffset(topic.topic, topic.partition, min);
//   });
//
// });

debug('Producer event handlers wired');

// Wire express request handlers

app.get('/', (req, res) => {
  debug('Request received at /');
  res.status(200).end();
});

debug(`port: ${port}`);

app.listen((port) => {
  debug(`listening on ${port}`);
})
