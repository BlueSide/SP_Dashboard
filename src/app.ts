declare var angular: any;
declare var SP: any;
declare var google: any;

//STUDY: This is not the right place to let TypeScript know about this function.
// Check where I should leave this.
interface Node {
    getAttribute(attr: string): string;
}

interface SPField {
    title: string;
    dataType: string;
}

interface Aggregation {
    field: string;
    type: string;
}
/*
interface chart {
    wrapper;
    options;
}
*/
// Time in milliseconds between refreshing data
const RELOAD_TIMEOUT: number = 1000;

const FUNNEL_LIST_TITLE: string = "Projects";
const FUNNEL_VIEW_TITLE: string = "Funnel";

//TODO: Fetch the blank string option from either template of HTML attribute
const SP_BLANK_STRING: string = "Unassigned";

var liveUpdate: boolean = false;		// Value stored in cookie, this sets the default value for first use
var liveUpdatePause: boolean = false;

var module = angular.module('bsDashboard', []);
var spContext;

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
            spContext = new SP.ClientContext('https://portal.addventure.nl/blueside/');

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
        setCookie("liveUpdate", $scope.cbLiveUpdate, 30);
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
        // TODO: Why why was this check here?
        //if (chartsReady === charts.length) {
            $interval(function(): void {
                if (liveUpdate && !liveUpdatePause) {
                    self.drawAllCharts();
                }
            }, RELOAD_TIMEOUT);

            if (liveUpdate)
                this.startLiveUpdate();
        //}
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
    
    // the success value always contains a single value
    this.getValue = function(listTitle: string, viewTitle: string, aggregationType: string): any {
        return $q(function(success, error): any {
	    
            // Define context and determine list and view
            var context = new SP.ClientContext.get_current();
            var list = context.get_web().get_lists().getByTitle(listTitle);
            var view = list.get_views().getByTitle(viewTitle);
            //var fields = list.get_fields();
            // Get all columns selected in View editor
            var viewFields = view.get_viewFields();
            context.load(viewFields);
            context.load(view);
            context.executeQueryAsync(
                function(sender, args) {
                    var result = [];
                    var fields: string[] = [];
                    // Iterate over all columns and store them in the result object
                    var e = viewFields.getEnumerator();

                    while (e.moveNext()) {
                        fields.push(e.get_current());
                    }

                    // NOTE: We need to enclose the aggregations XML with our own
                    // root nodes to make it parsable XML
                    var xml;
                    var parser = new DOMParser();
                    var columnIndex: number = null;

                    if (view.get_viewQuery() !== "") {
                        xml = parser.parseFromString("<root>" + view.get_viewQuery() + "</root>", "text/xml");
                        var groupByLength = xml.childNodes[0].childNodes[0].childNodes.length;
                        var groupBy: string[] = [];
                        for (var i:number = 0; i < groupByLength; i++) {
			    if(xml.childNodes[0].childNodes[0].childNodes[i].getAttribute("Name"))
			    {
				groupBy.push(xml.childNodes[0].childNodes[0].childNodes[i].getAttribute("Name"));
                            }
			}
                    }

		    var aggregation: Aggregation;

		    if (view.get_aggregations() === "")
		    {
			if(typeof(aggregationType) === 'undefined')
			{
			    console.warn(viewTitle + ": An Aggregation Type is required when fetching a single value");
			}
			else
			{
			    aggregation = {
				field: fields[0],
				type: aggregationType
			    };
			}
		    }
		    else
		    {
			xml = parser.parseFromString("<root>" + view.get_aggregations() + "</root>", "text/xml");

			aggregation = {
                            field: xml.childNodes[0].childNodes[0].getAttribute("Name"),
                            type: xml.childNodes[0].childNodes[0].getAttribute("Type")
			};
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
			    while (liEnum.moveNext())
			    {
                                var item = liEnum.get_current();
                                var row: any[] = [];
                                for (var i:number = 0; i < fields.length; i++) {
				    row[i] = item.get_item(fields[i]);
                                }
				result.push(row);
			    }

			    if (groupByLength > 0)
			    {
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

			    result = window[aggregation.type](result);
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

    // Draws the passed chart according to the List data and View settings
    this.getData = function(chart): any {
	// Define context and determine list and view
	var context = new SP.ClientContext.get_current();
	var list = context.get_web().get_lists().getByTitle(chart.listTitle);
	var view = list.get_views().getByTitle(chart.viewTitle);
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
				if(row[i] === null)
				{
				    row[i] = SP_BLANK_STRING;
				}
                            }
                            result.push(row);
			}

			//Draw the chart
			var gData = new google.visualization.DataTable();
			
			if(groupByLength > 0)
			{
			    gData.addColumn('string', 'xAxis');
			    var xCats = group2(result, 0);
			    if(chart.wrapper.getType() === 'PieChart')
			    {
				gData.addColumn('number', 'yAxis');
				
				for(var cat in xCats)
				{
				    var aggData = group2(xCats[cat], 0);
				    var arrData: number[] = [];
				    for(var i: number = 0; i < aggData[cat].length; i++)
				    {
					arrData.push(aggData[cat][i][1]);
				    }
				    gData.addRow([cat, window[aggregations[0].type](arrData)]);
				}	
				
			    }
			    else
			    {
				
				// get the first category
				for(var cat in xCats) break;
				var yCats = group2(xCats[cat], groupByLength - 1);
				
				for(var yCat in yCats)
				{
				    gData.addColumn('number', yCat);
				}

				for(var cat in xCats)
				{
				    var row: any[] = [cat];
				    
				    var group = group2(xCats[cat], 0);
				    if(groupByLength > 1)
				    {
					var innerGroup = group2(group[cat], 1);
					for(var innerCat in innerGroup)
					{
					    var data: any[] = innerGroup[innerCat];
					    row.push(window[aggregations[0].type](getArrayFromSPData(data, groupByLength)));
					}
				    }
				    else
				    {
					row.push(window[aggregations[0].type](getArrayFromSPData(group[cat], groupByLength)));
				    }
				    gData.addRow(row);
				}
			    }
			}
			chart.wrapper.setDataTable(gData);
			chart.wrapper.draw();
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

module.controller('funnelController', ['$scope', function($scope): void {
    
    $scope.$on('init.ready', function(): void {
	// Define context and determine list and view
	var context = new SP.ClientContext('https://portal.addventure.nl/blueside/');
	//var context = new SP.ClientContext.get_current();
        
	var list = context.get_web().get_lists().getByTitle(FUNNEL_LIST_TITLE);
	var view = list.get_views().getByTitle(FUNNEL_VIEW_TITLE);
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
						group[property][innerProperty] = COUNT(group[property][innerProperty]);
					    }
					}
			            }
				}
                            }
			}
			$scope.data = group;
                        console.log($scope.data);
                    });

            },

            function(sender, args): void {
		console.warn("Warning: " + args.get_message() + "\n" +
			     "\'" + FUNNEL_VIEW_TITLE + "\'"
			    );

            }
	);
	
    });
}]);

//takes the element in `groupByLength` of each array in `data`
function getArrayFromSPData(data:any[], groupByLength: number): any[]
{
    var arrData: number[] = [];
    for(var i = 0; i < data.length; i++)
    {
	arrData.push(data[i][groupByLength]);
    }
    return arrData;
}
