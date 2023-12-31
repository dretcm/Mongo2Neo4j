from pymongo import MongoClient
from flask import Flask, request,jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
app.secret_key = "super secret"  # uso de alert
CORS(app)

with open("accounts.json","r", encoding="utf-8") as file:
  data = json.load(file)
  url = data["mongodb"]["url"]
  data_neo4j = data["neo4j"]


client = MongoClient(url)


@app.route("/auth_neo4j", methods=["GET"])
def auth_neo4j():
    return jsonify(data_neo4j)


@app.route("/mongo_query", methods=["POST"])
def find_query():
    query = request.form.get("query")
    #print(query)
    if (data := query_mongodb(query)):
      #print(json.dumps(data))
      return jsonify({"success":True,"data": data})
    return jsonify({'success': False})


def data_to_string(data):
    for i in range(len(data)):
      for j in data[i]:
        if type(data[i][j]) == list:
          data_to_string(data[i][j])
        else:
          data[i][j] = str(data[i][j])
    return data


def query_mongodb(query='sample_analytics.accounts.find({}).limit(5)'):
  try:
    key_query = ".find(" if ".find(" in query else ".aggregate("
    query_split = query.split(key_query)

    database, collection = query_split[0].split(".")
    database = client[database]
    collection = database[collection]

    #query = query_split[1].split(").limit")[0]
    query = "collection" + key_query + query_split[1]
    #limit = int(query_split[1].split(".limit(")[1][:-1])
    #print(query)

    #results = list(collection.find(json.loads(query)).limit(limit))
    results = eval("list("+query+")")

    #print(results)
    return data_to_string(results)

  except Exception as e:
    print("\nError:\n", e, "\n")
    return False



# 1) go directory
# 2) set FLASK_APP=API_backend.py
# 3) flask run
if __name__ == "__main__":
  app.run(host='127.0.0.1', port=5000)