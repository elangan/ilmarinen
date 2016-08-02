var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');

var printUsage = function() {
  console.log('Usage: node import-sde.js <path-to-sde>');
  process.exit(1);
};

var sde_path = process.argv[2];

if (!sde_path ||
    !fs.statSync(sde_path).isDirectory() ||
    !fs.statSync(path.join(sde_path, 'fsd')).isDirectory()) {
  printUsage();
}

var files = fs.readdirSync(path.join(sde_path, 'fsd'));
if (!'blueprints.yaml'  in files ||
    !'categoryIDs.yaml' in files ||
    !'groupIDs.yaml'    in files ||
    !'typeIDs.yaml'     in files) {
  printUsage();
}

fs.createReadStream(path.join(sde_path, 'fsd', 'blueprints.yaml')).pipe(fs.createWriteStream('blueprints.yaml'));

var strip = function(sde_yaml) {
  for (var val in sde_yaml) {
    if (!sde_yaml.hasOwnProperty(val)) continue;
    if (!sde_yaml[val].hasOwnProperty('name')) continue;
    var name = sde_yaml[val].name.en;
    delete sde_yaml[val].name;
    delete sde_yaml[val].description;
    sde_yaml[val].name = name || '';
  }
  return sde_yaml;
};

var categoryids = yaml.safeLoad(fs.readFileSync(path.join(sde_path, 'fsd', 'categoryIDs.yaml'), 'utf8'));
fs.writeFileSync('categoryIDs.yaml', yaml.safeDump(strip(categoryids)));

var groupids = yaml.safeLoad(fs.readFileSync(path.join(sde_path, 'fsd', 'groupIDs.yaml'), 'utf8'));
fs.writeFileSync('groupIDs.yaml', yaml.safeDump(strip(groupids)));

var typeids = yaml.safeLoad(fs.readFileSync(path.join(sde_path, 'fsd', 'typeIDs.yaml'), 'utf8'));
fs.writeFileSync('typeIDs.yaml', yaml.safeDump(strip(typeids)));
