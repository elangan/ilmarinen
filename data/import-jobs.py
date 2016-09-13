import csv
import re
import requests

with open('jobs.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
	    blueprint = row['Blueprint']
	    inventory = requests.get('http://localhost:8080/api/inventory').json()

	    # HALP parse inventory response?
	    oldest_id = None
	    for item in inventory:
	    	if item['item_name'] == blueprint:
	    		if oldest_id is None or oldest_id[0] > item['date_acquired']:
	    			oldest_id = (item['date_acquired'], item['id'])

	    job = {
	    	'blueprint_id': oldest_id[1],
	    	'runs': row['Runs'],
	    	'start_date': row['Start Date'],
	    	'output_type': row['Output Type']
	    }
	    print 'Posting job ' + str(job)
	    resp = requests.post('http://localhost:8080/api/jobs', json=job)
	    print str(resp.status_code) + ": " + resp.content
