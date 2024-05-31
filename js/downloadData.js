dataJSON = [];
function downloadData(table, filename){
	rows = table.rows.length
	i = 1;

	while (i <= rows) {
		if(!table.rows[i]){break;}
		_pubdate = table.rows[i].cells[0].innerHTML;
		_country = table.rows[i].cells[1].innerHTML;
		_media_type = table.rows[i].cells[2].innerHTML;
		_categories = table.rows[i].cells[3].innerHTML;
		_source = table.rows[i].cells[4].firstChild.attributes.href.nodeValue;
		_summary = table.rows[i].cells[5].innerHTML;
		data = {"pubdate": _pubdate, "country": _country, "media_type": _media_type, "categories":_categories, "source": _source, "summary": _summary}
		dataJSON.push(data)
		i++;
		
	}
	const JSONToFile = (obj, filename) => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
if(filename.includes('.json')){filename = filename.replace('.json','')};
JSONToFile(dataJSON , filename);
// downloads the object as 'testJsonFile.json'
}
