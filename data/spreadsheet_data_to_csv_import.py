import csv
import re

# Imports all purchased materials into the inventory and blueprint tables.
# Also populates the group table for all items.

def to_float(val):
    return float(re.sub('[^0-9.]', '', val))

def to_int(val):
    return int(re.sub('[^0-9]', '', val))

# Exclude built items from import
EXCLUDE_GROUPS = [
    'Tactical Destroyer Blueprints',
    'Strategic Cruiser Blueprints',
    'Subsystem Blueprints',
    'Hybrid Tech Component',
    'Modules and Ammo'
]

groups = {}
inventory_id = 1
inventory = {}
blueprints = {}
with open('spreadsheet_data.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        groups.setdefault(row['Item'], row['Group'])

        item_name = inventory.setdefault(row['Item'], {})
        date = item_name.setdefault(row['Date Acquired'], {})
        price = date.setdefault(to_float(row['Unit Price']), {'qty': 0, 'id': inventory_id})
        if price['qty'] == 0:
            inventory_id += 1
        item = inventory[row['Item']][row['Date Acquired']][to_float(row['Unit Price'])]
        item['qty'] += to_int(row['Qty'])
        
        if row['Group'] in EXCLUDE_GROUPS:
            blueprints[inventory_id] = {'runs': row['Runs'], 'me': row['ME']}
        
with open('item_names.csv', 'w') as f:
    writer = csv.writer(f)
    for item in groups.keys():
        writer.writerow([item, groups[item]])  # TODO import typeIDs from YAML

with open('inventory.csv', 'w') as f:
    writer = csv.writer(f)
    for item_name in inventory.keys():
        if groups[item_name] in EXCLUDE_GROUPS:
            continue
        for date in inventory[item_name].keys():
            for price in inventory[item_name][date].keys():
                item = inventory[item_name][date][price]
                # Any Hybrid Polymer batch that divides evenly by 10 was built.
                if groups[item_name] == 'Hybrid Polymers' and item['qty'] % 10 == 0:
                    continue
                writer.writerow([item['id'], item_name, item['qty'], price, date])

with open('blueprints.csv', 'w') as f:
    writer = csv.writer(f)
    for id in blueprints.keys():
        writer.writerow([id, blueprints[id]['runs'], blueprints[id]['me']])
