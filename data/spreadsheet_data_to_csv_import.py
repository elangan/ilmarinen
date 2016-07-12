import csv
import re

def to_float(val):
    return float(re.sub('[^0-9.]', '', val''))

def to_int(val):
    return int(re.sub('[^0-9]', '', val''))

BLUEPRINT_GROUPS = [
    'Hybrid Reactions',
    'Hybrid Component Blueprints',
    'Tactical Destroyer Blueprints',
    'Strategic Cruiser Blueprints',
    'Subsystem Blueprints'
]

groups = {}
inventory_id = 1
inventory = {}
blueprints = {}
job_id = 1
jobs = {}
allocations = {}
with open('spreadsheet_data.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        groups.setdefault(row['Item'], row['Group'])
        
        item = inventory.setdefault(row['Item'], {})
        date = item.setdefault(row['Date Acquired'], {})
        price = date.setdefault(to_float(row['Unit Price']), {'qty': 0, 'id': inventory_id})
        if price['qty'] == 0:
            inventory_id += 1
        inventory[row['Item']][row['Date Acquired']][to_float(row['Unit Price'])] += to_int(row['Qty'])
        
        if row['Group'] in BLUEPRINT_GROUPS:
            blueprints[inventory_id] = {'runs': row['Runs'], 'me': row['ME']}
        
        # TODO fix up input data so there are actually jobs for stuff and there's one job per stuff
        # TODO clarified collate job data here
        if row['Job ID'] not in jobs.keys():
            jobs[row['Job ID']] = {'id': job_id}
            job_id += 1

with open('item_names.csv', 'w') as f:
    writer = csv.writer(f)
    for item in groups.keys():
        writer.writerow([item, groups[item]])  # TODO import typeIDs from YAML

with open('inventory.csv', 'w') as f:
    writer = csv.writer(f)
    for item_name in inventory.keys():
        for date in inventory[item].keys():
            for price in inventory[item][date].keys():
                item = inventory[item_name][date][price]
                writer.writerow([item['id'], item_name, item['qty'], price, date])

with open('blueprints.csv', 'w') as f:
    writer = csv.writer(f)
    for id in blueprints.keys():
        writer.writerow(id, blueprints[id]['runs'], blueprints[id]['me'])

with open('jobs.csv', 'w') as f:
    writer = csv.writer(f)
    job_id = 1
    for job in jobs.keys():
        pass  # TODO collate my data and implement me