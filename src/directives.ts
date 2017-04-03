module.directive( "bsTranslate", [function() {
    return {
	restrict: "A",
	template: function(element)
	{
	    if(typeof(translationStrings[element[0].innerText]) !== 'undefined')
	    {
		return element[0].innerHTML.replace(element[0].innerText, translationStrings[element[0].innerText]);
	    }
	    else
	    {
		console.warn('Translation for "' +element[0].innerText+ '" not found.');
		return element[0].innerHTML;
	    }
	    
	}
    };
}]);

module.directive( "bsValue", ['SPData', function(SPData) {
    var _spData = SPData;
    return {
	restrict: "E",
	
	scope: {
	    // This is to isolate the scope
	},

	link: function($scope, element, attributes, SPData) {
	    // Wait for SharePoint context to finish loading
	    $scope.$on('init.ready', function() {
						
		_spData.getValue(attributes.list, attributes.view, attributes.aggregation).then(function (result) {
		    switch(attributes.format)
		    {
		    case "currency":
			$scope.value = bsFormatSPCurrency(result, false);
			break;
		    default:
			$scope.value = result;
			break;
		    }
		});
	    });
	},

	templateUrl: 'templates/value.html'
	
    };
}]);

module.directive( "bsFunnelValue", [function($scope) {
    return {
	restrict: "E",
	scope: false,
	template: function (element, attributes) {
            return '<a class="bs-funnel-value" href="'+attributes.url+'">{{data["'+attributes.group+'"]["'+attributes.innergroup+'"]}}</a>';
	}
    };
}]);

module.directive( "bsChart", ['SPData', '$rootScope', '$http', function(SPData, $rootScope, $http) {
    var _spData = SPData;
    return {
	restrict: "E",
	scope: {
	    // This is to isolate the scope
	},
	link: function($scope, element, attributes, SPData) {
	    // Wait for SharePoint context to finish loading
	    $scope.$on('init.ready', function() {
		var chart = {
		    listTitle: attributes.list,
		    viewTitle: attributes.view,
		    wrapper: null,
		    chartOptions: null
		};

		var templateOptions: any = window[attributes.options];
		templateOptions.title = attributes.title;

		chart.wrapper = new google.visualization.ChartWrapper({
		    chartType: attributes.type,
		    options: templateOptions,
		    containerId: element.children()[0]
		});
		
		_spData.getData(chart);
		
		var readyEvent = google.visualization.events.addListener(chart.wrapper, 'ready', onReady);
		_spData.registerChart(chart);

		/*
		 * NOTE
		 * The 'ready' event only gets fired when a chart is drawn without errors.
		 * In the event one of the charts throws an error, Live Update won't start,
		 * because there are more charts registered than there are ready
		 */
		function onReady() {
		    google.visualization.events.addListener(chart.wrapper.getChart(), 'onmouseover', onChartMouseOver);
		    google.visualization.events.addListener(chart.wrapper.getChart(), 'onmouseout', onChartMouseOut);
		    google.visualization.events.addListener(chart.wrapper.getChart(), 'select', onChartClicked);

		    _spData.setChartReady();

		    google.visualization.events.removeListener(readyEvent);
		}

		function onChartClicked() {
		    window.location.href = attributes.url;
		}

		/*
		  NOTE: 
		  We stop updating data to prevent chart tooltips to disappear
		  on chart draw
		 */			
		function onChartMouseOver() {
		    _spData.stopLiveUpdate();
		}

		function onChartMouseOut() {
		    _spData.startLiveUpdate();
		}
	    });
	},
	templateUrl: 'templates/chart.html'
    };
}]);
