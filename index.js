const { RTMClient } = require('@slack/rtm-api');
const token = 'xoxb-***************';
const rtm = new RTMClient(token);
var fs = require('fs');
var filename = 'output.txt';


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

let users = [];
//orderData содержит этап заказа, название пиццы, размер и адрес;
let orderData = [];



rtm.on('message', async (event) => {
  try {
    console.log(users.indexOf(event.user));

    if(users.indexOf(event.user) == -1)
    {
      users.push(event.user);
      orderData.push([0,"",0,""]);
      const reply = await rtm.sendMessage(`Здравствуйте. Какую пиццу вы хотите?`, event.channel);
    }
    else
    {
        console.log(orderData);
        var index = users.indexOf(event.user);

        if(orderData[index][0] === 3)
        {
          if(event.text.toLowerCase() == 'да' )
          {
            var str = JSON.stringify(orderData[index], null, 4);
            fs.appendFile(filename, str, function(err){
                if(err) {
                    console.log(err)
                } else {
                    console.log('File written!');
                }
            });

            const reply = await rtm.sendMessage(`Заказ принят на обработку!`, event.channel);
            orderData.splice(index, 1);
            users.splice(index, 1);

          }
          else
          {
            const reply = await rtm.sendMessage(`Сбросить данные и начать заказ с начала?`, event.channel);
          }


        }
        else if(orderData[index][0] === 2)
        {
          orderData[index][3]=event.text;
          orderData[index][0] = 3;
          const reply = await rtm.sendMessage(`Вы заказали <${orderData[index][1]}>, размером <${orderData[index][2]}>, по адресу <${orderData[index][3]}>? Да/Нет`, event.channel);
        }
        else if(orderData[index][0] === 1)
        {
          orderData[index][2]=event.text;
          orderData[index][0] = 2;
          const reply = await rtm.sendMessage(`Куда доставить?`, event.channel);
        }
        else if(orderData[index][0] === 0)
        {
            orderData[index][1]=event.text;
            orderData[index][0] = 1;
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
