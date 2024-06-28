// Import the Redis client and RabbitMQ connection function
const {client} = require('./redisClient');
const {connectToRabbitMQ} = require('./rabbitMqClient');

// Define constants for the queue name, counter key, and lock key
const queue = 'update_queue';
const counterKey = 'counter';
const lockKey = 'counter_lock';

// Connect to RabbitMQ and create a channel
connectToRabbitMQ((channel) => {
  // Ensure the queue exists and is durable
  channel.assertQueue(queue, { durable: true });

  // Function to increment the counter
  const incrementCounter = () => {
    // Push an increment request to the Redis queue
    client.rpush(queue, 'increment', (err) => {
      if (err) {
        console.error('Redis queue error:', err);
      }
    });
  };

  // Function to process the queue
  const processQueue = () => {
    // Pop an increment request from the Redis queue
    client.lpop(queue, (err, updateRequest) => {
      if (err || !updateRequest) return;

      // Try to acquire a lock to ensure only one process updates the counter at a time
      client.setnx(lockKey, 'locked', (err, lockAcquired) => {
        if (err || !lockAcquired) return;

        // Increment the counter
        client.incr(counterKey, (err, newCounterValue) => {
          // Release the lock after updating the counter
          client.del(lockKey);
          if (err) return;

          // Log the new counter value
          console.log(`New Counter Value: ${newCounterValue}`);

          // Send a message to the RabbitMQ queue with the new counter value
          channel.sendToQueue(queue, Buffer.from(`Counter updated: ${newCounterValue}`));
        });
      });
    });
  };

  // Set an interval to process the queue every 100ms
  setInterval(processQueue, 100);

  // Set an interval to increment the counter every 1000ms (1 second)
  setInterval(incrementCounter, 1000);

  // Consume messages from the RabbitMQ queue and log them
  channel.consume(queue, (msg) => {
    if (msg !== null) {
      console.log(msg.content.toString());
      channel.ack(msg);
    }
  });
});
