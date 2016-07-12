CREATE TABLE items (
    name TEXT PRIMARY KEY
  , type TEXT NOT NULL
);

CREATE TABLE inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT
  , item_name TEXT NOT NULL
  , quantity INTEGER CHECK(quantity > 0)
  , unit_price INTEGER CHECK(unit_price > 0)  -- in tenths of an isk
  , date_acquired TEXT DEFAULT CURRENT_TIMESTAMP
  , FOREIGN KEY(item_name) REFERENCES items(name)
);

CREATE TABLE blueprint_copies (
    inventory_id INTEGER PRIMARY KEY AUTOINCREMENT
  , runs INTEGER CHECK(runs > 0)
  , material_efficiency INTEGER CHECK(material_efficiency >= 0 AND material_efficiency <= 10)
  , FOREIGN KEY(inventory_id) REFERENCES inventory(id)
);

CREATE TABLE inventory_import (
    id INTEGER PRIMARY KEY AUTOINCREMENT
  , inventory_id INTEGER NOT NULL
  , import_source TEXT NOT NULL
  , FOREIGN KEY(inventory_id) REFERENCES inventory(id)
);

CREATE TABLE jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT
  , blueprint_id INTEGER NOT NULL
  , start_time TEXT NOT NULL
  , end_time TEXT NOT NULL
  , job_fee INTEGER NOT NULL -- tenths of isk
  , output_lot INTEGER
  , FOREIGN KEY(blueprint_id) REFERENCES blueprint_copies(inventory_id)
  , FOREIGN KEY(output_lot) REFERENCES inventory(id)
);

CREATE TABLE job_allocation (
    inventory_id INTEGER NOT NULL
  , job_id INTEGER NOT NULL
  , quantity INTEGER CHECK(quantity > 0)
  , PRIMARY KEY(inventory_id, job_id)
  , FOREIGN KEY(inventory_id) REFERENCES inventory(id)
  , FOREIGN KEY(job_id) REFERENCES jobs(id)
);

CREATE TABLE inventory_audit(
    inventory_id INTEGER NOT NULL
  , journal_ref_id INTEGER NOT NULL
  , transaction_id INTEGER
  , PRIMARY KEY(inventory_id, journal_ref_id)
  , FOREIGN KEY(inventory_id) REFERENCES inventory(id)
  , FOREIGN KEY(journal_ref_id) REFERENCES journal(ref_id)
  , FOREIGN KEY(transaction_id) REFERENCES transactions(id)
);

CREATE TABLE journal(
  --  Sample Data:
  --    <rowset name="entries" key="refID" columns="date,refID,refTypeID,ownerName1,ownerID1,ownerName2,ownerID2,argName1,argID1,amount,balance,reason,owner1TypeID,owner2TypeID">
  --       <row date="2016-04-01 22:51:07" refID="12459460688" refTypeID="56" ownerName1="Valkyries of Night" ownerID1="544497016" ownerName2="Secure Commerce Commission" ownerID2="1000132" argName1="291853923" argID1="0" amount="-5586666.00" balance="643933280.14" reason="" owner1TypeID="2" owner2TypeID="2" />
  --       <row date="2016-03-31 23:37:17" refID="12455362156" refTypeID="37" ownerName1="Valkyries of Night" ownerID1="544497016" ownerName2="Ronnie Cordova" ownerID2="95476074" argName1="Raksan Ibid" argID1="836864942" amount="-21015.00" balance="649565829.81" reason="DESC: http://evepraisal.com/e/9978776&#xA;" owner1TypeID="2" owner2TypeID="1375" />
    ref_id INTEGER PRIMARY KEY
  , ref_type_id INTEGER NOT NULL
  , date TEXT NOT NULL
  , amount INTEGER NOT NULL -- in tenths of an isk
  , reason TEXT
  , owner_name_1 TEXT
  , owner_id_1 INTEGER
  , owner_name_2 TEXT
  , owner_id_2 INTEGER
  , arg_id_1 INTEGER
  , arg_name_1 TEXT
);

CREATE TABLE transactions(
  --  Sample Data:
  --     <rowset name="transactions" key="transactionID" columns="transactionDateTime,transactionID,quantity,typeName,typeID,price,clientID,clientName,characterID,characterName,stationID,stationName,transactionType,transactionFor,journalTransactionID,clientTypeID">
  --    <row transactionDateTime="2016-03-31 23:47:32" transactionID="4273375024" quantity="133" typeName="R.A.M.- Starship Tech" typeID="11478" price="344.99" clientID="92636728" clientName="Percheron Andedare" characterID="146360895" characterName="Jerringly" stationID="60008494" stationName="Amarr VIII (Oris) - Emperor Family Academy" transactionType="buy" transactionFor="corporation" journalTransactionID="12455393350" clientTypeID="1377" />
    id INTEGER PRIMARY KEY
  , date TEXT NOT NULL
  , item_name TEXT NOT NULL
  , quantity INTEGER NOT NULL
  , price INTEGER NOT NULL -- in tenths of an isk
  , character_name TEXT NOT NULL
  , client_name TEXT NOT NULL
  , station_name TEXT NOT NULL
  , journal_ref_id INTEGER NOT NULL
  , FOREIGN KEY(item_name) REFERENCES items(name)
  , FOREIGN KEY(journal_ref_id) REFERENCES journal(ref_id)
);

