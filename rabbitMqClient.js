const amqp = require('amqplib/callback_api');
const connectToRabbitMQ = (callback) => {
  amqp.connect(`amqp://localhost`, (error0, connection) => {
    if (error0) {
      throw error0;
    }
    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }
      callback(channel);
    });
  });
};

module.exports = {connectToRabbitMQ};
