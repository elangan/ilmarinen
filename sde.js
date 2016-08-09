var fs = require('fs');
var yaml = require('js-yaml');

var sde = {};

sde.TYPES = yaml.safeLoad(fs.readFileSync('./sde/typeIDs.yaml', 'utf8'));
sde.GROUPS = yaml.safeLoad(fs.readFileSync('./sde/groupIDs.yaml', 'utf8'));
sde.BLUEPRINTS = yaml.safeLoad(fs.readFileSync('./sde/blueprints.yaml', 'utf8'));

sde.NAMES_TO_TYPE_IDS = {};
for (typeid in sde.TYPES) {
  if (sde.TYPES.hasOwnProperty(typeid)) {
    sde.NAMES_TO_TYPE_IDS[sde.TYPES[typeid].name] = typeid;
  }
}

sde.getItemTypeAndGroup = function(item_name) {
  var typeid = sde.NAMES_TO_TYPE_IDS[item_name];
  var group = sde.GROUPS[sde.TYPES[typeid].groupID].name;
  return { 'typeid': typeid, 'group': group };
};

sde.getBlueprintData = function(blueprint_name) {
  var typeid = sde.NAMES_TO_TYPE_IDS[blueprint_name];
  var blueprint_data = sde.BLUEPRINTS[typeid];
  blueprint_data.blueprint_group = sde.GROUPS[sde.TYPES[typeid].groupID].name;
  var addTypeNames = function(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (key === 'typeID') {
          obj.name = sde.TYPES[obj[key]].name;
        } else if (typeof obj[key] === 'object') {
          addTypeNames(obj[key]);
        }
      }
    }
  };
  addTypeNames(blueprint_data);
  return blueprint_data;
};

module.exports = sde;