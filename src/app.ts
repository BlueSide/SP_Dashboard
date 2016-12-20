declare var angular: any;
declare var SP: any;
declare var google: any;

//STUDY: This is not the right place to let TypeScript know about this function.
// Check where I should leave this.
interface Node {
    getAttribute(attr: string): string;
}
/*
interface chart {
    wrapper;
    options;
}
*/
// Time in milliseconds between refreshing data
var RELOAD_TIMEOUT: number = 1000;

var liveUpdate: boolean = false;		// Value stored in cookie, this sets the default value for first use
var liveUpdatePause: boolean = false;

var module = angular.module('bsDashboard', []);
var spContext;

var SITE_ROOT: string = 'https://portal.addventure.nl/blueside/';

module.controller('initController', ['$scope', '$rootScope', '$timeout', 'SPData', function($rootScope, $scope, $timeout, SPData) {
    
    // Manual counter to keep reference of externally loaded scripts
    var loadCounter: number = 2;

    google.charts.load("current", { packages: ["corechart", "gauge"] });
    google.charts.setOnLoadCallback(function(): void {
        loadCounter--;
        checkInitFinished();
    });

    $scope.translationStrings = translationStrings;

    if (typeof SP !== 'undefined') {
        SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function():void {
            spContext = new SP.ClientContext.get_current();

            // STUDY: This 100ms timeout is needed for Internet Explorer, is there any other way??
            $timeout(function(): void {
                loadCounter--;
                checkInitFinished();
            }, 100);

        });

        $(window).resize(function(): void {
            SPData.drawAllCharts();
        });
    }

    function checkInitFinished(): void {
        if (loadCounter === 0) {
            $rootScope.$broadcast('init.ready');
        }
    }
}]);

module.controller('liveUpdateController', ['$scope', 'SPData', function($scope, SPData): void {
    liveUpdate = (getCookie("liveUpdate") === 'true');

    $scope.cbLiveUpdate = liveUpdate;
    $scope.onLiveUpdateClick = function(): void {
        liveUpdate = $scope.cbLiveUpdate;
        setCookie("liveUpdate", liveUpdate, 30);
    };
}]);

module.service('SPData', function($http, $q, $interval): void {
    var charts = [];
    var chartsReady:number = 0;

    //STUDY: is this realy the best way to pass this?
    var self = this;

    this.registerChart = function(chart): void {
        charts.push(chart);
    };

    this.setChartReady = function(): void {
        chartsReady++;
        if (chartsReady === charts.length) {
            $interval(function(): void {
                if (liveUpdate && !liveUpdatePause) {
                    console.log("Update");
                    self.drawAllCharts();
                }
            }, RELOAD_TIMEOUT);

            if (liveUpdate)
                this.startLiveUpdate();
        }
    };

    this.drawAllCharts = function(): void {
        for (var i:number = 0; i < charts.length; i++) {
            this.getData(charts[i]);
        }
    };

    this.startLiveUpdate = function(): void {
        liveUpdatePause = false;
    };

    this.stopLiveUpdate = function(): void {
        liveUpdatePause = true;
    };

    this.getValue = function(listTitle, viewTitle): any {
        return $q(function(success, error): any {
            // Define context and determine list and view
            var context = new SP.ClientContext.get_current();
            var list = context.get_web().get_lists().getByTitle(listTitle);
            var view = list.get_views().getByTitle(viewTitle);
            var fields = list.get_fields();
            // Get all columns selected in View editor
            var viewFields = view.get_viewFields();
            context.load(viewFields);
            context.load(view);
            context.executeQueryAsync(
                function(sender, args) {
                    var result = [];
                    var fields = [];
                    // Iterate over all columns and store them in the result object
                    var e = viewFields.getEnumerator();

                    while (e.moveNext()) {
                        fields.push(e.get_current());
                    }

                    // NOTE: We need to enclose the aggregations XML with our own
                    // root nodes to make it parsable XML
                    var xml;
                    var parser = new DOMParser();
                    var columnIndex = null;

                    if (view.get_viewQuery() !== "") {
                        xml = parser.parseFromString("<root>" + view.get_viewQuery() + "</root>", "text/xml");
                        var groupByLength = xml.childNodes[0].childNodes[0].childNodes.length;
                        var groupBy = [];
                        for (var i:number = 0; i < groupByLength; i++) {
                            groupBy.push(xml.childNodes[0].childNodes[0].childNodes[i].getAttribute("Name"));
                        }
                    }

                    if (view.get_aggregations() !== "") {
                        xml = parser.parseFromString("<root>" + view.get_aggregations() + "</root>", "text/xml");

                        var aggregationsLength = xml.childNodes[0].childNodes.length;
                        var aggregations = [];
                        for (var i:number = 0; i < aggregationsLength; i++) {
                            var aggregation = {
                                field: xml.childNodes[0].childNodes[i].getAttribute("Name"),
                                type: xml.childNodes[0].childNodes[i].getAttribute("Type")
                            };
                            aggregations.push(aggregation);
                        }

                    }

                    // This compiles a CAML Query from the settings specified in the view
                    var camlQuery = new SP.CamlQuery();

                    camlQuery.set_viewXml(view.get_listViewXml());

                    var listItems = list.getItems(camlQuery);
                    context.load(listItems);
                    context.executeQueryAsync(
                        function(sender, args) {
                            // Iterate over all items and store them for every column in the result object
                            var liEnum = listItems.getEnumerator();
                            while (liEnum.moveNext()) {
                                var item = liEnum.get_current();
                                var row = [];
                                for (var i:number = 0; i < fields.length; i++) {
                                    row[i] = item.get_item(fields[i]);
                                }
                                result.push(row);
                            }

                            if (groupByLength > 0) {
                                var columnIndex = fields.indexOf(groupBy[0]);
                                var group = group2(result, columnIndex);

                                //TODO: check for second groupBy
                                if (groupByLength > 1) {
                                    for (var property in group) {
                                        if (group.hasOwnProperty(property)) {
                                            group[property] = group2(group[property], fields.indexOf(groupBy[1]));
                                        }
                                    }
                                }
                            }

                            result = window[aggregations[0].type](result);

                            success(result);
                        });

                },

                function(sender, args) {
                    console.warn("Warning: " + args.get_message() + "\n" +
				 "\'" + viewTitle + "\'"
				);

                }
            );
        });
    };

    this.getData = function(chart): any {
        return $q(function(success, error): any {
            var result = [[]];

            if (chart.listTitle != null) {
                // Define context and determine list and view
                var context = new SP.ClientContext.get_current();
                var list = context.get_web().get_lists().getByTitle(chart.listTitle);
                var view = list.get_views().getByTitle(chart.viewTitle);
                var fields = list.get_fields();
                // Get all columns selected in View editor
                var viewFields = view.get_viewFields();

                context.load(viewFields);
                context.load(view);
                context.executeQueryAsync(
                    function(sender, args) {

                        // Iterate over all columns and store them in the result object
                        var e = viewFields.getEnumerator();

                        while (e.moveNext()) {
                            result[0].push(e.get_current());
                        }

                        // This compiles a CAML Query from the settings specified in the view
                        var camlQuery = new SP.CamlQuery();

                        camlQuery.set_viewXml(view.get_listViewXml());

                        var listItems = list.getItems(camlQuery);
                        context.load(listItems);
                        context.executeQueryAsync(
                            function(sender, args) {
                                // Iterate over all items and store them for every column in the result object
                                var liEnum = listItems.getEnumerator();
                                while (liEnum.moveNext()) {
                                    var item = liEnum.get_current();
                                    var row = [];
                                    for (var i:number = 0; i < result[0].length; i++) {
                                        row[i] = item.get_item(result[0][i]);
                                    }
                                    result.push(row);
                                }

                                var xml;
                                var parser = new DOMParser();
                                var columnIndex = null;

                                if (view.get_viewQuery() !== "") {
                                    // NOTE: We need to enclose the aggregations XML with our own
                                    // root nodes to make it parsable XML
                                    xml = parser.parseFromString("<root>" + view.get_viewQuery() + "</root>", "text/xml");
                                    var groupedColumn = xml.documentElement.getElementsByTagName("FieldRef")[0].getAttribute("Name");
                                    columnIndex = result[0].indexOf(groupedColumn);
                                }

                                //TODO: Support multiple aggregations over different columns
                                //NOTE: In theory, Group By now only works when also an aggregation is given
                                if (view.get_aggregations() !== '') {
                                    xml = parser.parseFromString("<root>" + view.get_aggregations() + "</root>", "text/xml");
                                    var aggregationMethod = xml.childNodes[0].childNodes[0].getAttribute("Type");
                                    result = group(result, aggregationMethod, columnIndex);
                                }

                                // Report success and pass result object
                                var data = result;
                                //TODO: Get rid of this piece of crap!
                                //NOTE: Please cry with me for this fix. There is currently no other way, I promise!
                                for (var j:number = 0; j < data[0].length; j++) {
                                    data[0][j] = data[0][j].replace("_x0020_", " ");
                                }

                                //NOTE: Quick fix to handle single values
                                if (typeof (data[0]) == 'undefined') {
                                    data = [[chart.chartOptions.title, data]];
                                    data.splice(0, 0, ["Key", "Value"]);
                                }

                                //NOTE: Quick fix to handle single column Views.
                                if (data[0].length === 1) {
                                    data[0].splice(0, 0, "Key");
                                }

                                data = google.visualization.arrayToDataTable(data);

                                chart.wrapper.setDataTable(data);

                                chart.wrapper.draw();
                                success(result);

                            }, function(sender, args): void {
                                console.warn("Warning: " + args.get_message());
                            });

                    },
                    function(sender, args): void {
                        console.warn("Warning: " + args.get_message() + "\n" +
				     "\'" + chart.viewTitle + "\'"
				    );

                    }
                );
            }
        });
    };
});

module.controller('funnelController', ['$scope', function($scope): void {
    $scope.$on('init.ready', function(): void {
	//TODO: Temporary variable declarations, rewrite to function with parameters
	var listTitle:string = "Dossiers";
	var viewTitle:string = "Funnel";
	
	// Define context and determine list and view
	var context = new SP.ClientContext.get_current();
	var list = context.get_web().get_lists().getByTitle(listTitle);
	var view = list.get_views().getByTitle(viewTitle);
	var fields = list.get_fields();
	// Get all columns selected in View editor
	var viewFields = view.get_viewFields();

	context.load(viewFields);
	context.load(view);
	context.executeQueryAsync(
            function(sender, args): void {
		var result = [];
		var fields = [];
		// Iterate over all columns and store them in the result object
		var e = viewFields.getEnumerator();

		while (e.moveNext()) {
                    fields.push(e.get_current());
		}

		// NOTE: We need to enclose the aggregations XML with our own
		// root nodes to make it parsable XML
		var xml;
		var parser = new DOMParser();
		var columnIndex = null;

		if (view.get_viewQuery() !== "") {
                    xml = parser.parseFromString("<root>" + view.get_viewQuery() + "</root>", "text/xml");
                    var groupByLength = xml.childNodes[0].childNodes[0].childNodes.length;
                    var groupBy = [];
                    for (var i:number = 0; i < groupByLength; i++) {
			groupBy.push(xml.childNodes[0].childNodes[0].childNodes[i].getAttribute("Name"));
                    }
		}

		if (view.get_aggregations() !== "") {
                    xml = parser.parseFromString("<root>" + view.get_aggregations() + "</root>", "text/xml");

                    var aggregationsLength = xml.childNodes[0].childNodes.length;
                    var aggregations = [];
                    for (var i:number = 0; i < aggregationsLength; i++) {
			var aggregation = {
                            field: xml.childNodes[0].childNodes[i].getAttribute("Name"),
                            type: xml.childNodes[0].childNodes[i].getAttribute("Type")
			};
			aggregations.push(aggregation);
                    }

		}

		// This compiles a CAML Query from the settings specified in the view
		var camlQuery = new SP.CamlQuery();

		camlQuery.set_viewXml(view.get_listViewXml());

		var listItems = list.getItems(camlQuery);
		context.load(listItems);
		context.executeQueryAsync(
                    function(sender, args): void {
			// Iterate over all items and store them for every column in the result object
			var liEnum = listItems.getEnumerator();
			while (liEnum.moveNext()) {
                            var item = liEnum.get_current();
                            var row = [];
                            for (var i:number = 0; i < fields.length; i++) {
				row[i] = item.get_item(fields[i]);
                            }
                            result.push(row);
			}

			if (groupByLength > 0) {
                            var columnIndex = fields.indexOf(groupBy[0]);
                            var group = group2(result, columnIndex);
                            // check for second groupBy
                            if (groupByLength > 1) {
				for (var property in group) {
                                    if (group.hasOwnProperty(property)) {
					group[property] = group2(group[property], fields.indexOf(groupBy[1]));
					for (var innerProperty in group[property]) {
					    if (group[property].hasOwnProperty(innerProperty)) {
						//console.log(innerProperty);
						group[property][innerProperty] = COUNT(group[property][innerProperty]);
					    }
					}
			            }
				}
                            }
			}
			
			$scope.data = group;			
                    });

            },

            function(sender, args): void {
		console.warn("Warning: " + args.get_message() + "\n" +
			     "\'" + viewTitle + "\'"
			    );

            }
	);
	
    });
}]);
