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

module.exports = sde;