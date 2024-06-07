//connect charts to their appropriate selectors
var mapChart = dc_leaflet.markerChart("#dc-map-chart");
var rowChart = dc.rowChart("#dc-row-chart");
var timeChart = dc.lineChart("#dc-time-chart");
var dataCount = dc.dataCount(".dc-data-count");
var datatable = $('#dc-table-chart');
//initial map view
var defaultCenter = [42.69, 25.42];
var defaultZoom = 1;
var dateFormat = d3.time.format("%Y-%m-%dT%H:%M:%S");

function convert(epoch) {
    var d = new Date(0)
    d.setUTCSeconds(epoch / 1000)
    return d
}

var sources = [];
function parseUrl(str) {
    var source = new URL(str).hostname.replace('www.', '').replace('.com', '')
    //if(!sources.includes(source)){sources.push(source)}
    var globalMedia = ['washingtonpost', 'politico', 'timesofindia.indiatimes', 'bbc',
        'slate', 'yahoo', 'theguardian', 'cnn', 'fool',
        'lendingtree', 'wsj', 'ndtv', 'news.google', 'nytimes']
    var thinkTanks = ['defence-blog']
    var socialMedia = ['reddit']

    if (globalMedia.includes(source)) { return "Global Media" };
    if (thinkTanks.includes(source)) { return "Think Tank" };
    if (socialMedia.includes(source)) { return "Social Media" };
    return source
}

function parseCountries(d) {
    countryString = "";
    for (country of d.countries)
        if (countryString.length == 0) {
            countryString = country
        };
    if (!countryString.includes(country)) { countryString = countryString + ' | ' + country }

    return countryString
}

function parseTitleDesc(d) {
    if (d.description.includes("submitted by    /u/") && d.description.includes("   [link]   [comments]")) {
        d.description = d.title
    }
    return d.description
}

function filterByDate(diff) {
    currentTime = new Date();
    var newDateObj = new Date(currentTime.getTime() - diff * 60000);
    return newDateObj
}


BDS.features.forEach(function (d, i) {
    d.date_e = new Date(d.published)
    d.article_text = d.article_text ? d.article_text : "No article information available";
    d.country = d.countries.length > 0 ? d.countries.toString() : "No Data"
    d.description = d.description ? parseTitleDesc(d) : "No Data"
    d.image_link = d.image_link ? d.image_link : "#";
    d.keywords = d.keywords ? d.keywords : "No Data"
    d.locations = d.regions ? d.regions : "No Data"
    d.media_type = d.link ? parseUrl(d.link) : "No Media Type Data";
    d.source_link = d.link ? d.link : "No Data"
    d.primary_category = d.keywords[0] ? d.keywords[0] : "No Keyword";
    d.second_category = d.keywords[1] ? d.keywords[1] : "No Keyword";
    d.third_category = d.keywords[2] ? d.keywords[2] : "No Keyword";
    d.trans_title = d.title ? d.title : "Unknown";
    d.images = d.images;
    d.filename = d.filename ? d.filename : "#"
    if (d.geometry.length > 0) {
        for (obj of d.geometry) { d.geo = obj.y + "," + obj.x; break; }
    }
});

//toplevel crossfilter & Filters out the entities that have no country data
var xf = crossfilter(BDS.features.filter(d => d.countries.length !== 0));

//counter
var all = xf.groupAll();
dataCount.dimension(xf)
    .group(all);

//map
var facilities = xf.dimension(function (d) { return d.geo; });
mapChart.dimension(facilities)
    .group(facilities.group())
    .width(630)
    .height(300)
    .margins({ top: 10, right: 10, bottom: 20, left: 40 })
    .center(defaultCenter)
    .zoom(defaultZoom)
    .renderPopup(false)
    .brushOn(true)
    .cluster(true)
    .filterByArea(true);

//row chart	
//var countries = xf.dimension(function(d) { if(d.country){return d.country}; });
rowChart.height(300)
    .width(330)
    .margins({ top: 10, right: 10, bottom: 20, left: 40 })
    .dimension(xf.dimension(function (d) { return d.countries.toString() }).group())
    .group(xf.dimension(function (d) { return d.countries.toString() }).group())
    .ordering(function (p) {
        return -p.value;
    })
    .elasticX(true);

//time series bar chart
var issuanceDates = xf.dimension(function (d) { return d.date_e; });
timeChart.width(960)
    .height(200)
    .margins({ top: 10, right: 10, bottom: 20, left: 40 })
    .dimension(issuanceDates)
    .group(issuanceDates.group(d3.time.day))
    .transitionDuration(500)
    .x(d3.time.scale().domain([new Date(2014, 6, 1), new Date(2014, 12, 31)]))
    .round(d3.time.day.round)
    .xUnits(d3.time.days)
    .elasticY(true)
    .elasticX(true)
    .xAxis().ticks(5);

//table
//dimension for table search
var tableDimension = xf.dimension(function (d) {
    return d.countries.toString() + ' ' +
        d.primary_category.toLowerCase() + ' ' +
        d.second_category.toLowerCase() + ' ' +
        d.third_category.toLowerCase() + ' ' +
        d.trans_title.toLowerCase();
});

//Media Type
var mediaDimension = xf.dimension(function (d) { return d.media_type.toLowerCase() });

//Media Type
var topicDimension = xf.dimension(function (d) {
    return d.primary_category.toLowerCase() + ' ' +
        d.second_category.toLowerCase() + ' ' +
        d.third_category.toLowerCase()
});

//Country Type
var countryDimension = xf.dimension(function (d) { return d.country.toString().toLowerCase() });


//set options and columns
_warning = "Please Confirm redirect to a Non-Government Site"

var dataTableOptions = {
    "bSort": true,
    columnDefs: [
        {
            targets: 0, // publish date
            data: function (d) { return d.date_e; },
            type: 'date',
            defaultContent: 'Not found'
        },
        {
            targets: 1, // country column
            data: function (d) { return d.country.toString(); },
            defaultContent: '',
            visible: true
        },
        {
            targets: 2, // media type
            data: function (d) { return d.media_type; },
            defaultContent: ''
        },
        {
            targets: 3, // category
            data: function (d) { return d.primary_category + ' | ' + d.second_category + ' | ' + d.third_category; },
            defaultContent: ''
        },
        {
            targets: 4, // source
            data: function (d) { return "<a href='" + d.source_link + "' target='_blank' onclick='return confirm(`${_warning}`)'>Source</a>"; },
            defaultContent: ''
        },
        {
            targets: 5, //summary
            data: function (d) { return d.trans_title; },
            defaultContent: ''
        }
    ]
};

//initialize datatable
datatable.dataTable(dataTableOptions);

//row details
function format(d) {
    // main = $('<div></div>')
    // imgs = $('<div></div>').attr('class', 'imgcontainer').attr('style','text-align:center')
    // for (img of d.images){
    //     source = 'data/imgs/'+img
    //     imgs.append($('<img style="height:25%;width:25%" src="'+source+'" onclick=window.open('+'"'+source+'"'+')></>'))
    // }
    // text = $('<p></p>').text(d.bodyText)
    // main.append(imgs).append(text)  
    return $('<a></a>').attr('href',d.filename).text("View Site Here")
}

datatable.DataTable().on('click', 'tr[role="row"]', function () {
    var tr = $(this);
    var row = datatable.DataTable().row(tr);

    if (row.child.isShown()) {
        // This row is already open - close it
        row.child.hide();
        tr.removeClass('shown');
    }
    else {
        // Open this row
        row.child(format(row.data())).show();
        tr.addClass('shown');
    }
});

//custom refresh function, see http://stackoverflow.com/questions/21113513/dcjs-reorder-datatable-by-column/21116676#21116676
function RefreshTable() {
    dc.events.trigger(function () {
        alldata = tableDimension.top(Infinity);
        datatable.fnClearTable();
        if (alldata.length > 0) {
            datatable.fnAddData(alldata);
        }
        datatable.fnDraw();
    });
}

//call RefreshTable when dc-charts are filtered
for (var i = 0; i < dc.chartRegistry.list().length; i++) {
    var chartI = dc.chartRegistry.list()[i];
    chartI.on("filtered", RefreshTable);
}

//filter all charts when using the datatables search box
$(":input").on('keyup', function () {
    if ($(this).attr("class") != "filenameInput") {
        text_filter(tableDimension, this.value);//cities is the dimension for the data table
    }
    function text_filter(dim, q) {
        if (q != '') {
            dim.filter(function (d) {
                return d.indexOf(q.toLowerCase()) !== -1;
            });
        } else {
            dim.filterAll();
        }
        RefreshTable();
        dc.redrawAll();
    }
});

// $('#sourceType').on('change', function () {
//     media_filter(mediaDimension, this.value)
//     function media_filter(dim, q) {
//         if (q != '') {
//             dim.filter(function (d) {
//                 //debugger;
//                 return d.indexOf(q.toLowerCase()) !== -1;
//             });
//         } else {
//             dim.filterAll();
//         }
//         RefreshTable();
//         dc.redrawAll();
//     }
// });

// $('#topicType').on('change', function () {
//     topic_filter(topicDimension, this.value)
//     function topic_filter(dim, q) {
//         if (q != '') {
//             dim.filter(function (d) {
//                 //debugger;
//                 return d.indexOf(q.toLowerCase()) !== -1;
//             });
//         } else {
//             dim.filterAll();
//         }
//         RefreshTable();
//         dc.redrawAll();
//     }
// });

$('#countryType').on('change', function () {
    country_filter(countryDimension, this.value)
    function country_filter(dim, q) {
        if (q != '') {
            dim.filter(function (d) {
                //debugger;
                return d.indexOf(q.toLowerCase()) !== -1;
            });
        } else {
            dim.filterAll();
        }
        RefreshTable();
        dc.redrawAll();
    }
});

//reset map view on clicking the reset button
$("#mapReset").on('click', function () {
    mapChart.map().setView(defaultCenter, defaultZoom);
});
//initial table refresh
RefreshTable();
//initialize other charts
dc.renderAll();
try {
    $('#pubdate').click()
} catch { }

function openDownloadModal() {
    $('#download-dialog').dialog({
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            "Download": function () {
                filename = $('#filenameInput').val()
                if (!filename) { alert("Please enter a filename"); }
                else {
                    downloadData($('table')[0], filename)
                    $(this).dialog("close");
                }
            },
            Cancel: function () {
                $(this).dialog("close");
            }
        }
    });
}