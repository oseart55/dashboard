import json
import os
import glob
import html2text
import locationtagger
import nltk
from keybert import KeyBERT

combined = []
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')
nltk.download('maxent_ne_chunker')
nltk.download('words')


def editDesc(i):
    if (i['description'] == "" and i['summary'] == ""):
        i['description'] = "Not Provided"
    else:
        if (i['summary'] != ""):
            i['description'] = html2text.html2text(
                i['summary']['#text'])
    del i['summary']
    return i


def editAuthor(i):
    if (i['author'] == ""):
        i['author'] = []
    else:
        if (i['author'].keys()):
            i['author'] = (i['author']['name'])
    return i


def editKeywords(i):
    if (i['category'] != ""):
        data_list = []
        modified = False
        if ("https://slate.com" in i['link']):
            i['keywords'] = i['category']
            modified = True
        if (isinstance(i['category'], list) and "https://slate.com" not in i['link']):
            for cat in i['category']:
                for term in cat:
                    if term == "@_term" or term == "#text":
                        data_list.append(cat[term])
        if (isinstance(i['category'], dict)):
            i['category'] = [i['category']]
            for cat in i['category']:
                for term in cat:
                    if term == "@_term":
                        data_list.append(cat[term])
                    if term == "#text":
                        data_list.append(str(cat[term]))
        if not modified:
            i['keywords'] = data_list
    else:
        kw_model = KeyBERT(model='paraphrase-albert-small-v2')
        keywords = kw_model.extract_keywords(i['description'])
        keyword_list = []
        for keyword in keywords:
            keyword_list.append(keyword[0].capitalize())
        i['keywords'] = keyword_list
        # i['keywords'] = []
    del i['category']
    return i


def getLocation(i):
    entities = locationtagger.find_locations(text=i['description'])
    i['address_strings'] = entities.address_strings
    i['cities'] = entities.cities
    i['cities_mentioned'] = entities.city_mentions
    i['countries'] = entities.countries
    i['country_cities'] = entities.country_cities
    i['country_mentions'] = entities.country_mentions
    i['country_regions'] = entities.country_regions
    i['named_entities'] = entities.named_entities
    i['other_countries'] = entities.other_countries
    i['other_regions'] = entities.other_regions
    i['regions'] = entities.regions
    return i


for filename in glob.glob(os.path.join('data/', '*.json')):
    with open(filename, encoding='utf-8', mode='r') as currentFile:
        data = json.loads(currentFile.read())
        runs = 0
        for i in data['entries']:
            i = editDesc(i)
            i = editAuthor(i)
            i = editKeywords(i)
            i = getLocation(i)
            combined.append(i)
            runs = runs + 1

with open('./site_data/site_data.json', 'w', encoding='utf-8') as file:
    json.dump(combined, file, indent=4, ensure_ascii=True)
