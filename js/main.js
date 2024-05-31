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


BDS.features.forEach(function (d, i) {
    d.date_e = convert(d.attributes.pubdate)
    //d.date_e = dateFormat.parse(d.date_entered);
    //d.date_i = dateFormat.parse(d.date_issued);
    d.article_text = d.attributes.article_text ? d.attributes.article_text : "No article information available";
    d.country = d.attributes.country ? d.attributes.country : "No Country Data";
    d.description = d.attributes.description ? d.attributes.description : "No Description Data";;
    d.image_link = d.attributes.image_link ? d.attributes.image_link : "#";
    d.keywords = d.attributes.keywords ? d.attributes.keywords : "No Keyword Data";
    d.loc_array = d.attributes.loc_arry ? d.attributes.loc_arry : "No Location Array Data";
    d.locations = d.attributes.locations ? d.attributes.locations : "No Locations Data";
    d.y = d.geometry.y;
    d.x = d.geometry.x;
    d.media_type = d.attributes.media_type ? d.attributes.media_type : "No Media Type Data";
    d.source_link = d.attributes.source_link ? d.attributes.source_link : "No Source Link Data";
    d.primary_category = d.attributes.primary_category ? d.attributes.primary_category : "Unknown";
    d.second_category = d.attributes.second_category ? d.attributes.second_category : "Unknown";
    d.third_category = d.attributes.third_category ? d.attributes.third_category : "Unknown";
    d.trans_title = d.attributes.trans_title ? d.attributes.trans_title : "Unknown";
    //handle missing values for table variables
    //d.contact = d.contact ? d.contact : "MISSING";
    //d.city = d.city ? d.city : "MISSING";
    //d.permit_type_description = d.permit_type_description ? d.permit_type_description : "MISSING";
    //d.address = d.address ? d.address : "MISSING";	
    //d.purpose = d.purpose ? d.purpose: "MISSING";
    // parse lat lng-data
    if (d.y != null && d.x != null) {
        d.geo = d.y + "," + d.geometry.x;
    }
});

//toplevel crossfilter & Filters out the entities that have no country data
var xf = crossfilter(BDS.features.filter(d => d.country !== 'No Country Data'));

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
    .dimension(xf.dimension(function (d) { if (d.country) { return d.country }; }).group())
    .group(xf.dimension(function (d) { if (d.country) { return d.country }; }).group())
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
    return d.country.toLowerCase() + ' ' +
        d.primary_category.toLowerCase() + ' ' +
        d.second_category.toLowerCase() + ' ' +
        d.third_category.toLowerCase() + ' ' +
        d.trans_title.toLowerCase() + ' ' +
        d.country.toLowerCase();
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
var countryDimension = xf.dimension(function (d) { return d.country.toLowerCase() });


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
            data: function (d) { return d.country; },
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
    // console.log(getExif);

    if (d.image_link != '#') {
        details = '<p style="text-align:center">Article Image</p><img style="display: block; margin-left: auto; margin-right: auto; width: 100%;" src=' + d.image_link + '></img></br><b>Article Text: </b>' + d.article_text
        // EXIF.getData(d.image_link, function () {
        //     var allMetaData = EXIF.getAllTags(this);
        //     console.log(allMetaData)
        //     // var allMetaDataSpan = document.getElementById("allMetaDataSpan");
        //     // allMetaDataSpan.innerHTML = JSON.stringify(allMetaData, null, "\t");
        // });
        // fetch(d.image_link,
        //     { mode: 'no-cors' }
        // ).then(res => res.blob()).then(blob => {
        //     let url = URL.createObjectURL(blob);
        //     const a = document.createElement('a');
        //     a.href = url;
        //     a.download = 'Image.png';
        //     a.click();
        //     URL.revokeObjectURL(url);
        // });
    }
    else {
        details = '<b>Article Text: </b>' + d.article_text
    }
    return details;
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

$('#sourceType').on('change', function () {
    media_filter(mediaDimension, this.value)
    function media_filter(dim, q) {
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

$('#topicType').on('change', function () {
    topic_filter(topicDimension, this.value)
    function topic_filter(dim, q) {
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
// $('#modeToggle').on('click', function () {
//     $('#modeToggle').attr('class') == 'light' ? $('#modeToggle').attr('class', 'dark') : $('#modeToggle').attr('class', 'light')
//     if ($('#modeToggle').attr('class') == 'dark') {
//         $("body").addClass("dark");
//     }
//     else{
//         $("body").removeClass("dark");
//     }
// })