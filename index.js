const { RTMClient } = require('@slack/rtm-api');
const token = 'xoxb-';
const rtm = new RTMClient(token);
var fs = require('fs');
var filename = 'output.txt';

//orderData содержит массивы данных, собирающие информацию в процессе заказа
//первый массив: идентификаторы всех пользователей, совершающих заказ в текущий момент времени
//второй массив: статусы заказов, подразумевающие, на каком этапе проходит заказ
//третий массив: вся информация о заказе: название пиццы, размер и адрес;
let orderData = [[],[],[]];

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

rtm.on('message', async (event) => {
  try {
    var index = orderData[0].indexOf(event.user);

    //Если пользователь новый
    if(index == -1)
    {
      orderData[0].push(event.user);
      orderData[1].push(0);
      orderData[2].push(["",0,""]);
      const reply = await rtm.sendMessage(`Здравствуйте. Какую пиццу вы хотите?`, event.channel);
    }
    else
    {
      //Диалог с пользователем
      switch (orderData[1][index]) {
        case 0:
        orderData[2][index][0] = event.text;
        orderData[1][index] = 1;
        await rtm.sendMessage(`Какого размера?`, event.channel);
        break;
        case 1:
        orderData[2][index][1] = event.text;
        orderData[1][index] = 2;
        reply = await rtm.sendMessage(`Куда доставить?`, event.channel);
        break;
        case 2:
        orderData[2][index][2] = event.text;
        orderData[1][index] = 3;
        await rtm.sendMessage(`Вы заказали <${orderData[2][index][0]}>, размером <${orderData[2][index][1]}>, по адресу <${orderData[2][index][2]}>? Да/Нет`, event.channel);
        break;
        case 3:
        if(event.text.toLowerCase() == 'да' )
        {
          writeOrder(orderData[2][index]);
          await rtm.sendMessage(`Заказ принят на обработку!`, event.channel);
          orderData[0].splice(index, 1);
          orderData[1].splice(index, 1);
          orderData[2].splice(index, 1);
        }
        else
        {
          await rtm.sendMessage(`Сбросить данные и начать заказ с начала?`, event.channel);
          orderData[1][index] = 4;
        }
        break;
        case 4:
        if(event.text.toLowerCase() == 'да' )
        {
          orderData[1][index] = 0;
          await rtm.sendMessage(`Какую пиццу вы хотите?`, event.channel);
        }
        else
        {
          orderData[1][index] = 3;
          await rtm.sendMessage(`Вы заказали <${orderData[2][index][0]}>, размером <${orderData[2][index][1]}>, по адресу <${orderData[2][index][2]}>? Да/Нет`, event.channel);
        }
        break;
      }
    }
    console.log(orderData);
  } catch (error) {
    console.log('An error occurred', error);
  }
});

(async () => {
  await rtm.start();
})();
