import amqplib from 'amqplib';

async function sendTest() {
  const conn = await amqplib.connect('amqp://guest:guest@localhost:5672');
  const channel = await conn.createChannel();
  const queue = 'mi_cola';

  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from('Mensaje de prueba'));
  console.log('Mensaje enviado a RabbitMQ');
  await channel.close();
  await conn.close();
}

sendTest();
