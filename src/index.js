const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const crypto = require('crypto');

const {
  constantManager,
  MapManager,
  eventManager,
} = require('./datas/Manager');
const { Player } = require('./models/Player');
const { Map } = require('./models/Map');

const monsterDB = JSON.parse(
  fs.readFileSync(__dirname + '/datas/monsters.json')
);
const itemDB = JSON.parse(fs.readFileSync(__dirname + '/datas/items.json'));

const app = express();
app.use(express.urlencoded({ extended: true }));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.engine('ejs', require('ejs').__express);

mongoose.connect(
  'mongodb+srv://kwonl:dbPassword@cluster0.n2dh5.mongodb.net/final-game?retryWrites=true&w=majority',
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }
);

const authentication = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) return res.sendStatus(401);
  const [bearer, key] = authorization.split(' ');
  if (bearer !== 'Bearer') return res.sendStatus(401);
  const player = await Player.findOne({ key });
  if (!player) return res.sendStatus(401);

  req.player = player;
  next();
};

app.get('/', (req, res) => {
  res.render('index', { gameName: constantManager.gameName });
});

app.get('/game', (req, res) => {
  res.render('game');
});

async function generateMap(player) {
  const mapObj = new Map();
  mapObj.player = player;
  mapObj.fields = [];
  for (let i = 0; i < constantManager.mapSize; i++) {
    for (let j = 0; j < constantManager.mapSize; j++) {
      let descriptions = [];
      let events = [];
      for (let k = 0; k < constantManager.randomEventLength; k++) {
        let selectedEvent = Object.keys(eventManager.data)[
          Math.floor(Math.random() * Object.keys(eventManager.data).length)
        ];
        descriptions.push(eventManager.data[selectedEvent].description);
        if (selectedEvent.startsWith('battle')) {
          events.push({
            type: 'battle',
            monster: selectedEvent.slice(-1),
            percent: Math.floor(Math.random() * 101),
          });
        } else if (selectedEvent.startsWith('item')) {
          events.push({
            type: 'item',
            item: selectedEvent.slice(-1),
          });
        } else {
          events.push({
            type: 'rest',
          });
        }
      }
      mapObj.fields.push({
        x: i,
        y: j,
        descriptions,
        canGo: [
          j - 1 >= 0 ? 1 : 0,
          i + 1 < constantManager.mapSize ? 1 : 0,
          j + 1 < constantManager.mapSize ? 1 : 0,
          i - 1 >= 0 ? 1 : 0,
        ],
        events,
      });
    }
  }
  await mapObj.save();
}

app.post('/signup', async (req, res) => {
  const { name } = req.body;

  if (await Player.exists({ name })) {
    const player = await Player.findOne({ name: name });
    return res.send({ key: player.key });
  }

  const player = new Player({
    name,
    maxHP: 10,
    HP: 10,
    str: 5,
    def: 5,
    x: 0,
    y: 0,
    exp: 0,
    level: 1,
    items: [0, 0, 0, 0, 0],
  });
  const key = crypto.randomBytes(24).toString('hex');
  player.key = key;
  await player.save();
  await generateMap(player);

  return res.send({ key });
});

app.post('/action', authentication, async (req, res) => {
  const { action } = req.body;
  const player = req.player;
  const mapObj = await Map.findOne({ player });
  if (!mapObj)
    return res.status(403).send({ error: { map: 'map for player not found' } });
  const mapManager = new MapManager(mapObj);
  let field;
  let result;
  let actions = [];
  if (action === 'query') {
    field = mapManager.getField(req.player.x, req.player.y);
  } else if (action === 'move') {
    const direction = parseInt(req.body.direction, 0); // 0 북. 1 동 . 2 남. 3 서.
    let x = req.player.x;
    let y = req.player.y;
    if (direction === 0) {
      y -= 1;
    } else if (direction === 1) {
      x += 1;
    } else if (direction === 2) {
      y += 1;
    } else if (direction === 3) {
      x -= 1;
    } else {
      res.sendStatus(400);
    }
    field = mapManager.getField(x, y);
    if (!field) res.sendStatus(400);
    player.x = x;
    player.y = y;

    actions = [];
    if (field.events.length > 0) {
      const randomIndex = Math.floor(Math.random() * field.events.length);
      const event = field.events[randomIndex];
      if (event.type === 'battle'&&Math.random()*101<event.percent) {
        const monsterType = event.monster;
        result = {
          description: field.descriptions[randomIndex] + '\n',
        };
        let enemyStats = monsterDB[monsterType];
        let enemyHP = enemyStats.HP;
        while (enemyHP > 0) {
          player.incrementHP(
            -parseInt((enemyStats.str * 10) / (10 + player.def))
          );
          result.description += enemyStats.name + '에게 데미지를 입었습니다.\n';
          if (player.HP <= 0) {
            result.description += '당신은 죽었습니다. 시작점으로 이동합니다.';
            player.x = 0;
            player.y = 0;
            player.HP = 10;
            field.canGo = [0, 1, 1, 0];
            field.x = 0;
            field.y = 0;
            for (let i = 0; i < player.items.length; i++) {
              player.items[i] -= Math.floor(player.items[i] * Math.random());
            }
            // Recalculate player's ability
            player.items.forEach((item) => {
              if (Object.keys(item).includes('str')) {
                player.str += item.str;
              }
              if (Object.keys(item).includes('def')) {
                player.def += item.def;
              }
            });
            player.markModified('items');
            player.save();

            return res.send({
              player,
              field,
              event: result,
              actions,
            });
          }
          enemyHP -= (player.str * 10) / (10 + enemyStats.def);
          result.description += enemyStats.name + '를 공격하였습니다.\n';
        }
        result.description += enemyStats.name + '는 쓰러졌습니다.\n';

        //경험치 획득
        player.exp += 5 * (monsterType + 1);

        //레벨업과 스탯조정
        if (player.exp >= player.level * 10) {
          player.level += 1;
          player.str = player.level + 5;
          player.def = player.level + 5;
          player.maxHP = 10 + (player.level - 1) * 2;
          player.HP += 2;
          player.exp -= player.level*10;
        }
      } else if (event.type === 'item'&&Math.random()<0.5) {
        const itemType = event.item;
        let itemStats = itemDB[itemType];
        result = { description: itemStats.name + '을(를) 획득하였다!' };
        player.items[event.item] += 1;
        player.markModified('items');
        if (Object.keys(itemStats).includes('str')) {
          player.str += itemStats.str;
        }
        if (Object.keys(itemStats).includes('def')) {
          player.def += itemStats.def;
        }
        player.HP = Math.min(player.maxHP, player.HP + 1);
      } else if (event.type === 'rest') {
        result = { description: field.descriptions[randomIndex] };
        player.HP = Math.min(player.maxHP, player.HP + 100);
      }
    }
    await player.save();
    field.canGo.forEach((direction) => {
      actions.push({ url: '/action', text: 'text', params: { direction } });
    });
  }

  field.canGo.forEach((direction, i) => {
    if (direction === 1)
      actions.push({
        url: '/action',
        text: i,
        params: { direction: i, action: 'move' },
      });
  });
  return res.send({ player, field, event: result, actions });
});

app.listen(3000);
