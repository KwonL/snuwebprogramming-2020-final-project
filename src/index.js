const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const crypto = require('crypto');

const {
  constantManager,
  mapManager,
  eventManager,
} = require('./datas/Manager');
const { Player } = require('./models/Player');

const monsterDB = JSON.parse(
  fs.readFileSync(__dirname + '/datas/monsters.json')
);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.engine('ejs', require('ejs').__express);

mongoose.connect(
  'mongodb+srv://kwonl:dbPassword@cluster0.n2dh5.mongodb.net/final-game?retryWrites=true&w=majority',
  { useNewUrlParser: true, useUnifiedTopology: true }
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

app.post('/signup', async (req, res) => {
  const { name } = req.body;

  if (await Player.exists({ name })) {
    return res.status(400).send({ error: 'Player already exists' });
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
  });

  const key = crypto.randomBytes(24).toString('hex');
  player.key = key;

  await player.save();

  return res.send({ key });
});

app.post('/action', authentication, async (req, res) => {
  const { action } = req.body;
  const player = req.player;
  let event = null;
  let field;
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
      event = field.events[0];
      // TODO : 확률별로 이벤트 발생하도록 변경

      if (event.type === 'battle') {
        // TODO: 이벤트 별로 events.json 에서 불러와 이벤트 처리

        const monsterType = event.monster;
        //랜덤으로 몬스터 조

        if (Math.random() * 100 < event.percent) {
          //몬스터와 전투
          event = {
            description:
              eventManager.data['battle' + monsterType].description + '\n',
          };
          let enemyStats = monsterDB[monsterType];
          let enemyHP = enemyStats.HP;
          while (enemyHP > 0) {
            player.incrementHP(
              -parseInt((enemyStats.str * 10) / (10 + player.def))
            );
            event.description +=
              enemyStats.name + '에게 데미지를 입었습니다.\n';
            enemyHP -= (player.str * 10) / (10 + enemyStats.def);
            event.description += enemyStats.name + '를 공격하였습니다.\n';
          }
          event.description += enemyStats.name + '는 쓰러졌습니다.\n';

          //경험치 획득
          player.exp += 5 * (monsterType + 1);

          //레벨업과 스탯조정
          if (player.exp >= player.level * 10) {
            player.level += 1;
            player.str = player.level + 5;
            player.def = player.level + 5;
            player.maxHP = player.level * 2 + 5;
            player.HP += 2;
            player.exp = 0;
          }
          console.log(player);
        } else event = null;
      } else if (event.type === 'item') {
        event = { description: eventManager.data['item'].description };
        player.incrementHP(1);
        player.HP = Math.min(player.maxHP, player.HP + 1);
      } else if (event.type === 'rest') {
        event = { description: eventManager.data['rest'].description };
        player.incrementHP(100);
        player.HP = Math.min(player.maxHP, player.HP + 1);
      }
      if (player.HP === 0) {
        //사망 이벤트
      }
    }

    field.canGo.forEach((direction) => {
      actions.push({ url: '/action', text: 'text', params: { direction } });
    });

    await player.save();
  }

  field.canGo.forEach((direction, i) => {
    if (direction === 1)
      actions.push({
        url: '/action',
        text: i,
        params: { direction: i, action: 'move' },
      });
  });
  return res.send({ player, field, event, actions });
});

app.listen(3000);
