const {client} = require('./redisClient');
const {connectToRabbitMQ} = require('./rabbitMqClient');

const queue = 'update_queue';
const counterKey = 'counter';

connectToRabbitMQ((channel) => {
  channel.assertQueue(queue, { durable: true });

  const incrementCounter = () => {
    client.incr(counterKey, (err, newCounterValue) => {
      if (err) {
        console.error('Redis increment error:', err);
        return;
      }
      console.log(`Process 2 - New Counter Value: ${newCounterValue}`);
      channel.sendToQueue(queue, Buffer.from(newCounterValue.toString()));
    });
  };

  setInterval(incrementCounter, 1500); // Increment every 1.5 seconds
});
