from pywebcopy import save_webpage
import lxml
from lxml.html.clean import Cleaner
import glob
import os
import json
import requests
from bs4 import BeautifulSoup

cleaner = Cleaner()
cleaner.javascript = True
cleaner.style = False
 
def downloadSite(i):
    filename = i['link'].split('/')[-1].replace('#0','')
    response = requests.get(i['link'], headers={'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.7) Gecko/2009021910 Firefox/3.0.7'})
    with open(f"./data/sites/{filename}.html", "w", encoding="utf-8") as f:
        f.write(response.text)
        i['source_download'] = f'./data/sites/{filename}.html'
        return i 


def deleteUnneeded():
    deletethese = []
    for filename in glob.iglob('./data/**',
                               recursive=True):
        if (".html" in filename):
            try:
                HTMLFile = open(filename, "r")
                index = HTMLFile.read()
                S = BeautifulSoup(index, features='lxml')
                # Providing the source
                Attr = S.html

                # Using the Children attribute to get the children of a tag
                # Only contain tag names and not the spaces
                Attr_Tag = [
                    e.name for e in Attr.children if e.name is not None]
                if len(Attr_Tag) <= 1:
                    deletethese.append(filename)
            except:
                deletethese.append(filename)
    try:
        for file in deletethese:
            os.remove(file)
    except Exception as e:
        print(e)

# new_data = []
# with open('data/output/output_data.json', 'r') as file:
#     data = json.load(file)
#     for article in data['features']:
#         folder_name = article['filename']
#         for filename in glob.iglob(f'./data/{folder_name}/**',
#                                    recursive=True):
#             for (root, dirs, file) in os.walk(filename):
#                 for f in file:
#                     if '.html' in f:
#                         if f == folder_name+'.html':
#                             article['filename'] = f'{root}/{f}'
#                             new_data.append(article)
# with open('data/output/output_data.json', 'w') as file:
#     output = {"features":new_data}
#     json.dump(output, file, indent=4, ensure_ascii=True)
