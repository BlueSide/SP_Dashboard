var column_chart_FTE = {
    colors: ['#24bb9c', '#3499dd', '#465c74', '#9d5ab9', '#bfc4c8'],
    chartArea: {'width': '60%', 'height': '70%'},
    legend: 'none',
    animation: {
	startup: true,
	duration: 1000,
	easing: 'out'
    },
    vAxis: { 
              viewWindowMode:'explicit',
              viewWindow:{
                min:0
              }
            }
};

var column_chart_TRL = {
    chartArea: {'width': '60%', 'height': '70%'},
    colors: ['#24bb9c', '#3499dd', '#465c74', '#9d5ab9', '#bfc4c8'],
    legend: 'none',
    animation: {
	startup: true,
	duration: 1000,
	easing: 'out'
    },
    vAxis: {
          ticks: [{v:0, f:""}, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        }
};

var column_chart_TRL_Yearly = {
    colors: ['#24bb9c', '#3499dd', '#465c74', '#9d5ab9', '#bfc4c8'],
    chartArea: {'width': '60%', 'height': '70%'},
    vAxis: {
          ticks: [{v:0, f:""}, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        }
};

var geo_chart = {
    region: '150', // Europe
    colorAxis: {colors: ['#71DBC6', '#24BB9D', '#008269']},
    backgroundColor: '#d2d2d2',
    datalessRegionColor: '#eee',
    defaultColor: '#f5f5f5',
};

var histogram = {
    backgroundColor: {
	fill:'transparent'
    },
    legend: { position: 'none' },
    histogram: {
	bucketSize: 1
    },
    vAxis: {
    }
};

var pie_chart = {
    backgroundColor: {
	fill:'transparent'
    },
    pieHole: 0.3,
    chartArea: {'width': '100%', 'height': '90%'},
	colors: ['#24bb9c', '#3499dd', '#465c74', '#9d5ab9', '#bfc4c8']
};

var stepped_area_chart = {
    colors: ['#24bb9c', '#3499dd', '#465c74', '#9d5ab9', '#bfc4c8'],
    areaOpacity: '0.8',
    isStacked: 'true',
    chartArea: {'width': '60%', 'height': '80%'},
    legend: { position: 'right' },
    vAxis: {
	title: 'Amount sought in €'
    }
};

var stepped_area_chart_small = {
    colors: ['#24bb9c', '#3499dd', '#465c74', '#9d5ab9', '#bfc4c8'],
    areaOpacity: '0.8',
    isStacked: 'percent',
    chartArea: {
	'width': '60%', 'height': '80%'
    },
    legend: {
	position: 'right'
    }
};


