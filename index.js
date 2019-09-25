const { RTMClient } = require('@slack/rtm-api');
const token = 'xoxb-';
const rtm = new RTMClient(token);
var fs = require('fs');
var filename = 'output.txt';

function writeOrder(order) {
  var str = JSON.stringify(order, null, 4);
  fs.appendFile(filename, str, function(err){
      if(err) {
          console.log(err)
      } else {
          console.log('File written!');
      }
  });
}

// Listen for users who join a channel that the bot user is a member of
// See: https://api.slack.com/events/member_joined_channel
rtm.on('member_joined_channel', async (event) => {
  try {
    // Send a welcome message to the same channel where the new member just joined, and mention the user.
    const reply = await rtm.sendMessage(`Привет <@${event.user}>, хочешь пиццы? `, event.channel)
    console.log('Новый клиент', reply.ts);
  } catch (error) {
    console.log('An error occurred', error);
  }
});

//orderData содержит массивы данных, собирающие информацию в процессе заказа
//первый массив: идентификаторы всех пользователей, совершающих заказ в текущий момент времени
//второй массив: статусы заказов, подразумевающие, на каком этапе проходит заказ
//третий массив: вся информация о заказе: название пиццы, размер и адрес;
let orderData = [[],[],[]];

rtm.on('message', async (event) => {
  try {
    if(orderData[0].indexOf(event.user) == -1)
    {
      orderData[0].push(event.user);
      orderData[1].push(0);
      orderData[2].push(["",0,""]);
      const reply = await rtm.sendMessage(`Здравствуйте. Какую пиццу вы хотите?`, event.channel);
    }
    else
    {
        var index = orderData[0].indexOf(event.user);

        if(orderData[1][index] === 3)
        {
          if(event.text.toLowerCase() == 'да' )
          {
            writeOrder(orderData[2][index]);
            const reply = await rtm.sendMessage(`Заказ принят на обработку!`, event.channel);
            orderData[0].splice(index, 1);
            orderData[1].splice(index, 1);
            orderData[2].splice(index, 1);
          }
          else
          {
            const reply = await rtm.sendMessage(`Сбросить данные и начать заказ с начала?`, event.channel);
          }

        }
        else if(orderData[1][index] === 2)
        {
          orderData[2][index][2] = event.text;
          orderData[1][index] = 3;
          //console.log(orderData);
          const reply = await rtm.sendMessage(`Вы заказали <${orderData[2][index][0]}>, размером <${orderData[2][index][1]}>, по адресу <${orderData[2][index][2]}>? Да/Нет`, event.channel);
        }
        else if(orderData[1][index] === 1)
        {
          orderData[2][index][1] = event.text;
          orderData[1][index] = 2;
          const reply = await rtm.sendMessage(`Куда доставить?`, event.channel);
        }
        else if(orderData[1][index] === 0)
        {
            orderData[2][index][0] = event.text;
            orderData[1][index] = 1;
            const reply = await rtm.sendMessage(`Какого размера?`, event.channel);
        }
    }
  } catch (error) {
    console.log('An error occurred', error);
  }
});



(async () => {
  await rtm.start();
})();
