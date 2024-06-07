import glob
import re
import json
import os
import html2text
import locationtagger
import geocoder
import requests
from bs4 import BeautifulSoup
from textblob import TextBlob
import base64
import uuid
from urllib.parse import urlparse
from webcopy import downloadSite


combined = []

def getSite(i):
    i['filename'] = downloadSite(i)
    return i


def downloadImgs(i):
    response = requests.get(i["link"])
    soup = BeautifulSoup(response.text, 'html.parser')
    img_tags = soup.find_all('img')

    urls = [img['src'] for img in img_tags]

    i['images'] = []

    for url in urls:
        filename = re.search(r'/([\w_-]+[.](jpg|gif|png|jpg.webp|png.webp))$', url)
        if not filename:
            print("Regex didn't match with the url: {}".format(url))
            continue
        if "placeholder" in filename.group(1):
            continue
        file_location = url.split('/')[-1].replace('.png.webp','').replace('.jpg.webp','').replace('.gif','').replace('.png','')
        if(not os.path.exists(f'./data/imgs')):
            os.mkdir(f'./data/imgs/{file_location}')
        with open(f"./data/imgs/"+filename.group(1), 'wb') as f:
            if 'http' not in url:
                # sometimes an image source can be relative
                # if it is provide the base url which also happens
                # to be the site variable atm.
                url = '{}{}'.format(i["link"], url)
            response = requests.get(url)
            f.write(response.content)
            i['images'].append(filename.group(1))
    return i


def decode_google_news_url(source_url):
    url = urlparse(source_url)
    path = url.path.split('/')
    if (
        url.hostname == "news.google.com" and
        len(path) > 1 and
        path[-2] == "articles"
    ):
        base64_str = path[-1]
        decoded_bytes = base64.urlsafe_b64decode(base64_str + '==')
        decoded_str = decoded_bytes.decode('latin1')

        prefix = bytes([0x08, 0x13, 0x22]).decode('latin1')
        if decoded_str.startswith(prefix):
            decoded_str = decoded_str[len(prefix):]

        suffix = bytes([0xd2, 0x01, 0x00]).decode('latin1')
        if decoded_str.endswith(suffix):
            decoded_str = decoded_str[:-len(suffix)]

        bytes_array = bytearray(decoded_str, 'latin1')
        length = bytes_array[0]
        if length >= 0x80:
            decoded_str = decoded_str[2:length+1]
        else:
            decoded_str = decoded_str[1:length+1]

        return decoded_str
    else:
        return source_url


def editBodyText(i):
    if ("news.google.com" in i['link']):
        i['link'] = decode_google_news_url(i['link'])
    soup = BeautifulSoup(requests.get(
        i["link"]).content, features="html.parser")
    body_text = [a.text for a in soup.find_all('p')]
    i['bodyText'] = ' '.join(body_text)
    return i


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
        blob = TextBlob(i['description'])
        if (len(blob) == 0):
            blob = TextBlob(i['title'])
        i['keywords'] = ([thing[0]
                         for thing in blob.tags if thing[1] == u'NNP'])
    del i['category']
    return i


def getLocation(i):
    entities = locationtagger.find_locations(text=i['description'])
    i['countries'] = entities.countries
    i['other_countries'] = entities.other_countries
    i['regions'] = entities.regions
    return i


def geoCoder(i):
    g = []
    i['geometry'] = []

    if (i['countries']):
        for country in i['countries']:
            g = geocoder.osm(country, headers={
                             'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0"})
            if (len(g.geojson["features"]) > 0):
                coords = g.geojson["features"][0]["geometry"]["coordinates"]
                i['geometry'].append({"x": coords[0], "y": coords[1]})

    elif (i['other_countries']):
        for country in i['other_countries']:
            g = geocoder.osm(country, headers={'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0"}, params={"addressdetails": 1,
                                                                                                                                                        "limit": 1})
            if (len(g.geojson["features"]) > 0):
                coords = g.geojson["features"][0]["geometry"]["coordinates"]
                i['geometry'].append({"x": coords[0], "y": coords[1]})

    elif (i['regions']):
        for region in i['regions']:
            g = geocoder.osm(region, headers={
                             'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0"})
            if (len(g.geojson["features"]) > 0):
                coords = g.geojson["features"][0]["geometry"]["coordinates"]
                i['geometry'].append({"x": coords[0], "y": coords[1]})
    else:
        i['geometry'] = []

    return i


for filename in glob.glob(os.path.join('data/', 'BBC.json')):
    print(filename)
    with open(filename, encoding='utf-8', mode='r') as currentFile:
        data = json.loads(currentFile.read())
        for i in data['entries']:
            i = editDesc(i)
            i = editAuthor(i)
            i = editKeywords(i)
            i = getLocation(i)
            i = geoCoder(i)
            i = editBodyText(i)
            i = downloadImgs(i)
            i = getSite(i)
            combined.append(i)
try:
    with open('./data/output/output_data.json', 'w', encoding='utf-8') as file:
        output = {"features":combined}
        json.dump(output, file, indent=4, ensure_ascii=True)
except Exception as e:
    print(e)