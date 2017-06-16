module.directive("bsValue", ["SPData", function(SPData) {
    var _spData = SPData;
    return {
	restrict: "E",
        scope: {
            test: '='
        },
	link: function($scope, element, attributes) {

            // NOTE: for optional filtering controlled outside of this directive
            var rootFilter:any = {};
            
            var listPromise = SPData.registerList(attributes.list);

            $scope.$on(attributes.list + '.ready', function (msg, args) {
                args.then(function (result) {
                    processData(result);
                });
            });

            listPromise.then(function (result) {
                processData(result);
            });

            function processData(newData)
            {
                let listData = newData.listData.data.d.results;
                let fieldData = newData.fieldData.data.d.results;
                
                var filters: any;            
                if(attributes.filter)
                {
                    // Check if first two characters are 'f:'
                    if(attributes.filter.substr(0, 2) === 'f:')
                    {
                        let filterVarName = attributes.filter.substr(2, attributes.filter.length - 1);
                        filters = window[filterVarName];
                    }
                    else
                    {
                        filters = filterStringToObject(attributes.filter, attributes.operator);
                    }
                }

                var oldValue = $scope.value;
                let data:any[] = getFieldEntries(attributes.field, listData, fieldData, filters);

                let resultValue: number = 0;

                let aggregationFunction = getAggregationFunction(attributes.aggregation);
                resultValue = aggregationFunction(data);

                let fieldType = getFieldType(attributes.field, fieldData);
                switch(fieldType)
                {
                case 'Currency':
                    if(attributes.aggregation !== 'count')
                    {
                        $scope.value = resultValue.toLocaleString(
                            LocaleCodes[getFieldByTitle(attributes.field, fieldData).CurrencyLocaleId],
                            {minimumFractionDigits: 2}
                        );
                    }
                    else
                    {
                        $scope.value = resultValue;
                    }
                    break;
                default:
                    $scope.value = resultValue;
                    break;
                }
                

                // Give a visual cue when the value is changed
                if(oldValue < resultValue)
                {
                    $scope.icon = "glyphicon glyphicon-chevron-up";
                    fadeOut(element[0].children[1]);
                }
                else if(oldValue > resultValue)
                {
                    $scope.icon = "glyphicon glyphicon-chevron-down";
                    fadeOut(element[0].children[1]);
                }
                else
                {
                    $scope.icon = "";
                }

            }
        },
	templateUrl: 'templates/value.html'
	
    };
}]);

function fadeOut(element: any): void
{
    $(element).fadeOut(Settings.updatedDataFadeOutTime);
}

module.directive("bsChart", ["$q", "SPData", "GCLoader", function($q, SPData, GCLoader) {
    var _spData = SPData;
    return {
        restrict: "E",
        scope: true,
        link: function($scope, element, attributes) {

            $scope.$on(attributes.list + '.ready', function (msg, args) {
                args.then(function (result) {
                    processData(result);
                });
            });
            
            let groupXAxis: boolean = element[0].hasAttribute('groupxaxis');
            let groupZAxis: boolean = element[0].hasAttribute('groupzaxis');

            let options: any = window[attributes.options];
            options.title = attributes.title;

            // Get aggregate function pointer
            let aggregateFunction = getAggregationFunction(attributes.aggregation);
            

            // TODO: Error handling
            // Ensure Google Charts has loaded and the SharePoint data is ready
            $q.all({
                gcLoaded: GCLoader.register(),
                spData: SPData.registerList(attributes.list)
            }).then(function(result) {
                
                processData(result.spData);
                
	        // STUDY: Find a way to map chart slices to URL's
                // Check if filters can be applied through URL's in SPO (it seems possible in 2013)

            });

            function processData(newData)
            {
                
                let listData = newData.listData.data.d.results;
                let fieldData = newData.fieldData.data.d.results;

                // Initialize Google Charts wrapper
                let wrapper = new google.visualization.ChartWrapper({
                    chartType: attributes.type,
                    containerId: element.children()[0],
                    options: options                    
                });
                
                // Initialize Google DataTable
                let gData = new google.visualization.DataTable();

                let data: any[] = [];

                let fieldTypeX = getGoogleType(getFieldType(attributes.xaxis, fieldData));
                let fieldTypeY = getGoogleType(getFieldType(attributes.yaxis, fieldData));
                let fieldTypeZ = getGoogleType(getFieldType(attributes.zaxis, fieldData));
                
                // Group data
                let xgroups: string[] = [];
                let zgroups: string[] = [];
                
                let fieldName = attributes.xaxis;

                // TODO: handle no grouping
                if(groupXAxis)
                {
                    xgroups = group(fieldName, listData, fieldData);
                }
                if(groupZAxis)
                {
                    zgroups = group(attributes.zaxis, listData, fieldData);
                }
                
                for(let xgroup of xgroups)
                {
                    let filter = {
                        filters: [fieldName +'='+ xgroup],
                        operator: "AND"
                    };
                    data.push(getFieldEntries(attributes.yaxis, listData, fieldData, filter));
                }

                //TODO: Check actual datatype
                gData.addColumn('string', 'Label');

                for(let zgroup of zgroups)
                {
                    gData.addColumn('number', zgroup);
                }

                if(zgroups.length < 1) gData.addColumn('number', 'Value');
                
                // Add each array entry to the Google DataTable
                for(var i = 0; i < data.length; ++i)
                {
                    let label:any = xgroups[i];
                    if(fieldTypeX === 'User')
                    {
                        label = _spData.getUserById(xgroups[i]);
                    }

                    let row:any[] = [label];
                    if(zgroups.length < 1) row.push(aggregateFunction(data[i]));
                    for(let zgroup of zgroups)
                    {
                        let filters = {
                            filters: [
                                attributes.zaxis+"="+zgroup,
                                attributes.xaxis+"="+xgroups[i]
                            ],
                            operator: "AND"
                        };
                        let entries = getFieldEntries(attributes.yaxis, listData, fieldData, filters);
                        row.push(aggregateFunction(entries));
                    }
                    gData.addRow(row);
                }

                // Update the chart with new data and redraw it
                wrapper.setDataTable(gData);
                wrapper.draw();

            }

        },
        templateUrl: 'templates/chart.html'
    };
}]);

module.directive("bsTable", ["$q", "SPData", function($q, SPData) {
    var _spData = SPData;
    return {
        restrict: "E",
        scope: true,
        link: function ($scope, element, attributes) {

            var listPromise = SPData.registerList(attributes.list);

            $scope.fields = [];
            var fieldTypes:string[] = [];

            for(let field of attributes.fields.split(';'))
            {
                $scope.fields.push(field.trim());
            }

            $scope.$on(attributes.list + '.ready', function (msg, args) {
                args.then(function (result) {
                    processData(result);
                });
            });

            listPromise.then(function (result) {
                processData(result);
            });

            function processData(newData)
            {
                let listData = newData.listData.data.d.results;
                let fieldData = newData.fieldData.data.d.results;

                let data: any[] = [];
                let tableLength: number = 0;
                for(let field of $scope.fields)
                {
                    let row = getFieldEntries(field, listData, fieldData)
                    data.push(row);
                    fieldTypes.push(getFieldType(field, fieldData));

                    // Get largest number of rows to determine max table length
                    if(row.length > tableLength) tableLength = row.length;
                }

                let tableData = [];

                // NOTE: If defined, use the rowlimit attribute in stead of data length
                if(typeof attributes.rowlimit !== 'undefined' && tableLength >= attributes.rowlimit)
                {
                    tableLength = attributes.rowlimit;
                }
                
                for(let itemIndex = 0;
                    itemIndex < tableLength;
                    ++itemIndex)
                {
                    let row = [];
                    for(let fieldIndex in data)
                    {
                        let item = data[fieldIndex][itemIndex];
                        switch(fieldTypes[fieldIndex])
                        {
                        case "MultiChoice":
                            row.push(item.results.toString());
                            break;
                        case "User":
                            row.push(_spData.getUserById(item));
                            break;
                        case "DateTime":
                            let date = new Date(item);
                            row.push(date.toLocaleDateString(LocaleCodes[1043]));
                            break;
                        case "Currency":
                            if(item !== null)
                            {
                                row.push(item.toLocaleString(LocaleCodes[getFieldByTitle($scope.fields[fieldIndex], fieldData).CurrencyLocaleId], {minimumFractionDigits: 2}));                            
                            }
                            else
                            {
                                row.push(item);
                            }
                            break;
                        default:
                            row.push(item);
                            break;
                        }
                    }
                    tableData.push(row);
                }
                $scope.items = tableData;
            }
        },
        templateUrl: 'templates/table.html'
    };    
}]);

// Shows the current time
module.directive("bsClock", ['$interval', '$filter', function($interval, $filter) {
    return {
        //TODO: Check if we can support more than just the element
	restrict: "E",
	link: function($scope, element, attributes) {

            let format = "dd/MM/yyyy HH:mm:ss";

            if(attributes.format)
            {
                format = attributes.format;
            }

            $interval(function () {
                $scope.time = $filter('date')(new Date(), format); 
            }, 1000);
        },
	template: '{{time}}'
    };
}]);
