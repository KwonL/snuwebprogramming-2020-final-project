const fs = require('fs');

class Manager {
  constructor() {}
}

class ConstantManager extends Manager {
  constructor(datas) {
    super();
    this.gameName = datas.gameName;
    this.mapSize = 10;
    this.randomEventLength = 3;
  }
}

class MapManager extends Manager {
  constructor(datas) {
    super();
    this.id = datas.id;
    this.fields = {};

    datas.fields.forEach((field) => {
      this.fields[`${field.x}_${field.y}`] = {
        x: field.x,
        y: field.y,
        descriptions: field.descriptions,
        canGo: field.canGo,
        events: field.events,
      };
    });
  }

  getField(x, y) {
    return this.fields[`${x}_${y}`];
  }
}

class EventManager extends Manager {
  constructor(datas) {
    super();
    this.data = datas;
  }
}

const constantManager = new ConstantManager(
  JSON.parse(fs.readFileSync(__dirname + '/constants.json'))
);

const eventManager = new EventManager(
  JSON.parse(fs.readFileSync(__dirname + '/events.json'))
);

module.exports = {
  constantManager,
  eventManager,
  MapManager,
};
