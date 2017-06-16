
// Declare Angular, and create the Dashboard module
declare var angular: any;
declare var google: any;
var module = angular.module('bsDashboard', []);

interface FilterObj {
    filters: any[];
    operator: string;
}

interface Filter {
    field: string;
    value: string;
    operator: string;
}

<<<<<<< HEAD
const FUNNEL_LIST_TITLE: string = "Projects";
const FUNNEL_VIEW_TITLE: string = "Funnel";
=======
// Initialisation controller. Resides in <html>
module.controller('initController', ['$scope', '$q', '$interval', 'SPData', function($scope, $q, $interval, SPData): void {
    console.log("initController");
    SPData.getSiteUsers();
>>>>>>> develop

    // Reference to the Live Update $interval timer
    var liveUpdate;

    $scope.onLiveUpdateClick = function (): void
    {
        if($scope.cbLiveUpdate)
        {
            $scope.startLiveUpdate();
        }
        else
        {
            $scope.stopLiveUpdate();
        }
    }

    $scope.onFilterTestClick = function(): void
    {
        console.log($scope.cbFilterTest);
    }
    
    $scope.startLiveUpdate = function (): void
    {
        setCookie("liveUpdate", $scope.cbLiveUpdate, 30);
        
        if(angular.isDefined(liveUpdate)) return;
        
        liveUpdate = $interval(function () {
            for(let listName in SPData.registeredLists)
            {
                SPData.getChanged(listName).then(function (isListChanged):void {
                    if(isListChanged)
                    {
                        var deferred = $q.defer();
                        SPData.getList(listName, deferred);
                        $scope.$broadcast(listName+'.ready', deferred.promise);
                    }
                });
            }
        }, Settings.updateInterval);
    }

    $scope.stopLiveUpdate = function (): void
    {
        if(angular.isDefined(liveUpdate))
        {
            $interval.cancel(liveUpdate);
            liveUpdate = undefined;
            setCookie("liveUpdate", $scope.cbLiveUpdate, 30);
        }
    }

<<<<<<< HEAD
module.controller('initController', ['$scope', '$rootScope', '$timeout', 'SPData', function($rootScope, $scope, $timeout, SPData) {
    // Manual counter to keep reference of externally loaded scripts
    var loadCounter: number = 2;
=======
    //NOTE: Initialisation code
    $scope.cbLiveUpdate = (getCookie("liveUpdate") === 'true')

    if(getCookie("liveUpdate") === 'true')
    {
        $scope.startLiveUpdate();
    }
    else
    {
        $scope.stopLiveUpdate();        
    }
    
}]);

module.service('GCLoader', function($q) {

    //TODO: Move to GC service
    // Array with promises to Google Charts
    var registeredChartUsers: any[] = [];
>>>>>>> develop

    // NOTE: 'map' package is loaded optionally. Decreases initial page load performance
    let chartPackages: string[] = ['corechart'];
    if(Settings.loadGoogleMaps)
    {
        chartPackages.push('map');
    }
    // Initialize Google Charts
    google.charts.load('current', {'packages': chartPackages, mapsApiKey: Settings.mapsApiKey});
    google.charts.setOnLoadCallback(function() {
        for(let deferred of registeredChartUsers)
        {
            deferred.resolve('gc loaded');
        }
    });
    
    
    this.register = function(): any
    {
        var deferred = $q.defer();
        registeredChartUsers.push(deferred);
        // TODO: Return a Wrapper object?
        return deferred.promise;
    }
});

// TODO: Optimize further: Only request registered fields
module.service('SPData', function($http, $q) {
    
    // Gets filled with all user data
    var siteUsers:any[] =  [];

<<<<<<< HEAD
    if (typeof SP !== 'undefined') {
        SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function():void {
            spContext = new SP.ClientContext('https://portal.addventure.nl/blueside/');
=======
    this.registeredLists = [];
    var self = this;
    // register list for loading
    this.registerList = function (listName: string): any
    {
        // Check if the list is already requested
        if(typeof this.registeredLists[listName] == 'undefined')
        {
            var deferred = $q.defer();
            this.registeredLists[listName] = {deferred: deferred, changes: []};
            this.getList(listName, deferred);
            return deferred.promise;
        }
        // If the list is already requested, return its promise
        return this.registeredLists[listName].deferred.promise;
    };
>>>>>>> develop

    this.getChanged = function(listName): any {

        let deferred = $q.defer();
        
        let getListString = Settings.webURL + "/_api" + Settings.web + "/lists/getbytitle('"+listName+"')/items?$select="+Settings.modifiedField;
        this.httpGETRequest(getListString).then(function (result) {
            // First check if the length of the list is different
            if(self.registeredLists[listName].changes.length !== result.data.d.results.length)
            {
                deferred.resolve(true);
            }
            else // If not, check each 'Modified' timestamp individually
            {
                for(let entryIndex in result.data.d.results)
                {
                    if(self.registeredLists[listName].changes[entryIndex] !==
                       result.data.d.results[entryIndex][Settings.modifiedField])
                    {
                        deferred.resolve(true);
                    }
                    
                }
            }
            
            // Clear the array first
            self.registeredLists[listName].changes.length = 0;
            
            // If not, check the Modified timestamps to detect changes
            for(let entryIndex in result.data.d.results)
            {
                self.registeredLists[listName].changes.push(result.data.d.results[entryIndex].Modified);
            }
        })
        return deferred.promise;
    };
    
    // Load the raw list data
    this.getList = function (listName, deferred) {
        // if not in list, add to list, do request
        
        let getListString = Settings.webURL + "/_api" + Settings.web + "/lists/getbytitle('"+listName+"')/items";
        let getFieldString = Settings.webURL + "/_api" + Settings.web + "/lists/getbytitle('"+listName+"')/fields";

        $q.all({
            listData: this.httpGETRequest(getListString),
            fieldData: this.httpGETRequest(getFieldString),
        }).then(function (result) {
            deferred.resolve(result);
        })
    };
    
    // $http wrapper
    this.httpGETRequest = function(GETString: string) {

        let requestObject = {
            type: "GET",
            headers: {"Accept": "application/json; odata=verbose"},
            url: GETString,
        };
        
        return $http(requestObject);
    };

    this.getSiteUsers = function()
    {
        //TODO: Unhardcode sitegroup '7'
        // string to get a user
        let getUserString = Settings.webURL + "/_api/web/sitegroups(7)/users";
        
        this.httpGETRequest(getUserString).then(function(result) {
            siteUsers = result.data.d.results;
        });
        
    }

    this.getUserById = function(id: number): string
    {
        // TODO: should this always be unassigned?
        if(!id) return "Unassigned";

        // Check if data is ready, otherwise give a warning
        if(siteUsers.length !== 0)
        {
            for(let user of siteUsers)
            {
                if(id === user.Id) return user.Title;
            }
        }
        else
        {
            console.warn("User data is not yet loaded!");
        }

        return null;
    }
});

function getFieldByTitle(title: string, fieldData: any): any
{
    for(let field of fieldData)
    {
        if(field.Title === title) return field;
    }

    console.warn("Could not find field '" + title + "'");
    return null;
}

// Get the type from the Field attributes and convert it to a Google Data TypeAsString
function getFieldType(title: string, fieldData: any): string
{
    // NOTE: We use "Text" as the default field type
    // An empty title can happen if the user only wants to
    // count all items matching a certain filter.
    if(!title)
    {
        return "Text";
    }
    
    let fieldType = getFieldByTitle(title, fieldData);
    if(fieldType)
    {
        return fieldType.TypeAsString;
    }
    
    return null;
}

function isEqualSPItem(item1: any, item2: any): boolean
{
    if(typeof item1 == 'undefined' || typeof item2 == 'undefined') return false;
    return item1.GUID === item2.GUID;
}

function filterItems(filterObj: FilterObj, inputData: any[], fieldData: any[]): any[]
{

<<<<<<< HEAD
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
=======
    let items: any[] = [];
    let filterResults: any[] = [];
    
    for(let filter of filterObj.filters)
    {
        let filterResult: any[] = [];
        // If the filter is an object, go one step deeper in the filter tree
        if(typeof filter == 'object')
        {
            filterResult = filterItems(filter, inputData, fieldData);
        }
        else
        {
            let filterRule = processFilter(filter);
            let filterFieldType = getFieldType(filterRule.field, fieldData);

            // NOTE: Suffix with 'Id' because SharePoint's field data and actual data use different field names\
            if(filterFieldType === 'User') filterRule.field += 'Id';
            
            for(let item of inputData)
            {
                if(isFilterMatch(item, filterRule, filterFieldType))
                {
                    filterResult.push(item);
                }
            }
        }
>>>>>>> develop

        filterResults.push(filterResult);
    }

    if(filterResults.length > 1)
    {
        if(filterObj.operator === "AND")
        {
            // Put all results in one array
            let allMatches: any[] = [];
            for(let filterResult of filterResults)
            {
                for(let filteredItem of filterResult)
                {
                    allMatches.push(filteredItem);
                }
            }

            // Sort all matches
            function compare(a,b) {
                if (a.GUID < b.GUID)
                    return -1;
                if (a.GUID > b.GUID)
                    return 1;
                return 0;
            }
            allMatches.sort(compare);

            for(let i = 0; i < allMatches.length; ++i)
            {
                // If the item matches the item that is the amount of filters we have ahead,
                // it means that all the items in between are also that item.
                // Therefor: All filters match the item and meets the 'AND' condition
                if(isEqualSPItem(allMatches[i], allMatches[i+filterResults.length-1]))
                {
                    items.push(allMatches[i]);
                }
            }
        }
        else if(filterObj.operator === "OR")
        {
            // Add all items of the first filter result
            for(let filterResult of filterResults)
            {
                for(let filteredItem of filterResult)
                {
                    if(items.indexOf(filteredItem))
                    {
                        items.push(filteredItem);
                    }
                }
            }
        }
    }
    else
    {
        items = filterResults[0];
    }    
    return items;
}
// return all items from a certain field after selecting and filtering
function getFieldEntries(fieldName: string, inputData: any[], fieldData: any[], filterObj: any = null): any[]
{
    // NOTE: To prevent uncountable, all null arrays, use the "GUID"
    // field as default fieldName.
    if(typeof fieldName === 'undefined') fieldName = "GUID";

    let fieldType = getFieldType(fieldName, fieldData);
    let items: any[] = [];

    
<<<<<<< HEAD
    // the success value always contains a single value
    this.getValue = function(listTitle: string, viewTitle: string, aggregationType: string): any {
        return $q(function(success, error): any {
            // Define context and determine list and view
            //var context = new SP.ClientContext.get_current();
            var context = new SP.ClientContext('https://portal.addventure.nl/blueside/');
            
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
=======
    if(filterObj !== null)
    {
        items = filterItems(filterObj, inputData, fieldData);
    }
    else
    {
        // If no filter is defined, let all items pass
        items = inputData;
    }
    
    let result: any = [];
    
    // Return just the field
    for(let item of items)
    {
        if(fieldType === 'User')
        {
            result.push(item[fieldName + "Id"]);
        }
        else
        {
            result.push(item[fieldName]);
        }
    }
    
    return result;
}
>>>>>>> develop

function isFilterMatch(entry: any, filter: Filter, fieldType: string): boolean
{
    let values: any[] = [];
    if(fieldType !== 'MultiChoice')
    {
        values.push(entry[filter.field]);
    }
    else
    {
        values = entry[filter.field].results;
    }

<<<<<<< HEAD
		    var aggregation: Aggregation;
                    
		    if (view.get_aggregations() === "")
		    {
			if(typeof(aggregationType) !== 'undefined')
			{
                            aggregation = {
				field: fields[0],
				type: aggregationType
			    };
			}
			else
			{
			    console.warn(viewTitle + ": An Aggregation Type is required when fetching a single value");
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
				    row[0] = item.get_item(fields[0]);
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
=======
    let isMatch: boolean = false;
    for(let value of values)
    {
        switch(filter.operator)
        {
        case '=': // is equal to
            isMatch = value == filter.value;
            break;
        case '!=': // is not equal to
            isMatch = value !== filter.value;
            break;
        case '~': // contains
            isMatch = value.indexOf(filter.value) !== -1;
            break;
        case '!~': // does not contain
            isMatch = value.indexOf(filter.value) === -1;
            break;
        case '>': // greater than
            isMatch = value > filter.value;
            break;
        case '<': // less than
            isMatch = value < filter.value;
            break;
        case '>=': // greater than or equal to
            isMatch = value >= filter.value;
            break;
        case '<=': // less than or equal to
            isMatch = value <= filter.value;
            break;
        default:
            console.warn(filter.operator, 'is not a valid filter operator');
            isMatch = false;
            break;
        }
>>>>>>> develop

        // NOTE: Only one of the values has to be true
        // to be a match, so on true we can return immediately
        if(isMatch) return true;
    }

<<<<<<< HEAD
    // Draws the passed chart according to the List data and View settings
    this.getData = function(chart): any {
	// Define context and determine list and view
	//var context = new SP.ClientContext.get_current();
        var context = new SP.ClientContext('https://portal.addventure.nl/blueside/');

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
                
		if(view.get_viewQuery() !== "") {
                    xml = parser.parseFromString("<root>" + view.get_viewQuery() + "</root>", "text/xml");
                    var groupByLength = xml.childNodes[0].childNodes[0].childNodes.length;
                    var groupBy = [];
                    for (var i:number = 0; i < groupByLength; i++) {
			groupBy.push(xml.childNodes[0].childNodes[0].childNodes[i].getAttribute("Name"));
                    }
		}

                var aggregations = [];
                if(typeof(chart.aggregation) !== 'undefined')
                {
                    var aggregation = {
                        field: "",
                        type: chart.aggregation
		    };
		    aggregations.push(aggregation);
                }
                else
                {
		    if(view.get_aggregations() !== "") {
                        xml = parser.parseFromString("<root>" + view.get_aggregations() + "</root>", "text/xml");

                        var aggregationsLength = xml.childNodes[0].childNodes.length;
                        for (var i:number = 0; i < aggregationsLength; i++) {
			    aggregation = {
                                field: xml.childNodes[0].childNodes[i].getAttribute("Name"),
                                type: xml.childNodes[0].childNodes[i].getAttribute("Type")
			    };
			    aggregations.push(aggregation);
                        }

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
	                            row[i] = 0;
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
				gData.addColumn('number', chart.category);
				
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

                                //NOTE: When only one category, use the custom label provided trough the directive
                                if(groupByLength == 1)
                                {
                                    gData.addColumn('number', chart.category);
                                }
                                else
                                {
                                    for(var yCat in yCats)
				    {
				        gData.addColumn('number', yCat);
				    }
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
=======
    return isMatch;
}

var regexpOperator = /(=|<|>|!=|<=|>=|~|!~)/;
>>>>>>> develop

function processFilter(filterString: string): Filter
{
    let filterOperator = regexpOperator.exec(filterString)[0];
    let itemArr: string[] = filterString.trim().split(filterOperator);
    let returnValue = itemArr[1].trim();

    // NOTE: To work around type checking problems in the future we
    // assign 'null' specifically to null
    // TODO: Handle strict typechecking
    if(returnValue == 'null')
        returnValue = null;

    return {
        field: itemArr[0].trim(),
        value: returnValue,
        operator: filterOperator
    };
}

function filterStringToObject(inputString: string, operator: string = "AND"): any
{
    // Filters are separated by a comma
    let strings: string[] = inputString.split(';');
    let trimmedStrings: string[] = [];
    for(let str of strings)
    {
        trimmedStrings.push(str.trim());
    }
    return {
        filters: trimmedStrings,
        operator: operator
    }
}

<<<<<<< HEAD
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
                    });

            },

            function(sender, args): void {
		console.warn("Warning: " + args.get_message() + "\n" +
			     "\'" + FUNNEL_VIEW_TITLE + "\'"
			    );
=======
// Map string from HTML Attribute to function pointer
function getAggregationFunction(functionString: string): any
{
    let aggregationFunction: any;
    switch(functionString)
    {
    case 'count':
        {
            aggregationFunction = getCount;
        } break;
    case 'sum':
        {
            aggregationFunction = getSum;
        } break;
    case 'average':
        {
            aggregationFunction = getAverage;
        } break;
    case 'min':
        {
            aggregationFunction = getMin;
        }
    case 'max':
        {
            aggregationFunction = getMax;
        }
    default:
        {
            //TODO: report who is reporting the error
            console.warn('Aggregation of type '+functionString+' not found.');
        } break;
    }

    return aggregationFunction;
}
>>>>>>> develop

/**
 * Map a SharePoint 'TypeAsString' to a Google Data Type
 * Possible Google Chart Data Types:
 * 
 * - string
 * - number
 * - boolean
 * - date
 * - datetime
 * - timeofday
 */
function getGoogleType(spType: string): string
{
    // TODO: Use FieldTypeKind, for potentially faster mapping
    switch(spType)
    {
    case 'Integer':
    case 'Counter':
    case 'Number':
    case 'MaxItems':
    case 'ThreadIndex':
        return 'number';
    case 'Text':
    case 'Note':
    case 'Choice':
    case 'Currency':
    case 'URL':
    case 'Guid':
    case 'CrossProjectLink':
    case 'Error':
    case 'ModStat':
    case 'ContentTypeId':
    case 'WorkflowStatus':
    case 'Geolocation':
    case 'WorkflowEventType':
        return 'string';
    case 'DateTime':
        return 'datetime';
    case 'Boolean':
        return 'boolean';
    case 'User':
        return "User";
    case 'MultiChoice': // STUDY: could be any type
        return "MultiChoice";

    default:
        console.warn("Could not map SharePoint type '"+spType+"' to a Google Charts datatype");
        /*      
                case 'Invalid':
                case 'Threading':
                case 'Computed':
                case 'Lookup': // waarde uit een andere lijst
                case 'Calculated': // could be any type
                case 'GridChoice': // could be any type 
                case 'File': // STUDY: check what a file type specifies, could be countable
                case 'Attachments': // STUDY what's an attachment?
                case 'Recurrence': // STUDY: maybe some type of DateTime?

                case 'AllDayEvent': // STUDY: what is this?
                case 'OutcomeChoice': // STUDY: what is this?
        */        
    }
}

function group(field: string, listData: any[], fieldData: any[]): string[]
{
    let groups: string[] = [];
    let fieldType = getFieldType(field, fieldData);

    let entries: any = getFieldEntries(field, listData, fieldData);

    // Iterate over entries to get all possible groups
    for(let entry of entries)
    {
        if(fieldType === 'MultiChoice')
        {
            for(let choice of entry.results)
            {
                // Check if groups already contains the entry
                if(!(groups.indexOf(choice) > -1))
                {
                    groups.push(choice);
                }
            }
        }
        else
        {
            // Check if groups already contains the entry
            if(!(groups.indexOf(entry) > -1))
            {
                groups.push(entry);
            }
        }
    }
    return groups;
}
