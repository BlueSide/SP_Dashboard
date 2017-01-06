var column_chart_FTE = {
    colors: ['#007db5', '#5760a6', '#b7aed6', '#9363a7', '#004B6C'],
    chartArea: {'width': '60%', 'height': '70%'},
    legend: 'none',
    animation: {
	startup: true,
	duration: 1000,
	easing: 'out'
    }
};

var column_chart_TRL = {
    colors: ['#007db5', '#5760a6', '#b7aed6', '#9363a7', '#004B6C'],
    chartArea: {'width': '60%', 'height': '70%'}
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
	colors: ['#007db5', '#5760a6', '#b7aed6', '#9363a7', '#004B6C']
};

var stepped_area_chart = {
    colors: ['#007db5', '#5760a6', '#b7aed6', '#9363a7', '#004B6C'],
    areaOpacity: '0.8',
    isStacked: 'true',
    chartArea: {'width': '60%', 'height': '80%'},
    legend: { position: 'right' },
    vAxis: {
	title: 'Amount sought in €'
    }
};

var stepped_area_chart_small = {
    colors: ['#007db5', '#5760a6', '#b7aed6', '#9363a7', '#004B6C'],
    areaOpacity: '0.8',
    isStacked: 'percent',
    chartArea: {
	'width': '60%', 'height': '80%'
    },
    legend: {
	position: 'right'
    }
};
