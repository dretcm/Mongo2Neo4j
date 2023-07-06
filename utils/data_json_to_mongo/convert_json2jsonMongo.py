def to_int(x):
	try:
		return int(x)
	except:
		return x

def to_float(x):
	try:
		return float(x)
	except:
		return x

decode = [
	bool,
	lambda x: eval(x) if x else dict(x),
	lambda x: to_int(x) if x else 0,
	eval,
	str,
	lambda x: to_int(x) if x else 0,
	str,
	str,
	str,
	str,
	lambda x: to_float(x) if x else 0.0,
	str,
	lambda x: eval(x) if x else list(x),
	lambda x: eval(x) if x else list(x),
	str,
	lambda x: to_int(x) if x else 0,
	lambda x: to_float(x) if x else 0.0,
	lambda x: eval(x) if x else list(x),
	str,
	str,
	str,
	bool,
	lambda x: to_float(x) if x else 0.0,
	lambda x: to_int(x) if x else 0
	]

import json
# https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset?select=credits.csv
# https://www.aconvert.com/es/document/csv-to-json/
# curl url_data > movies.json
def decode_json(name_f, new_f):
	with open(name_f,'r', encoding="utf-8") as f:
		data = json.load(f)

	for index in data:
		for i, tag in enumerate(index):
			#print(tag)
			index[tag] = decode[i](index[tag])
			
	print(data[10])
	with open(new_f,'w', encoding="utf-8") as f:
		json.dump(data, f)


if __name__ == "__main__":
	decode_json("movies.json", "new_Movies.json")
	print("good proccess")