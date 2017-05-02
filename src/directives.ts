module.directive("bsValue", ["SPData", function(SPData) {
    var _spData = SPData;
    return {
	restrict: "E",
        scope: {
        },
	link: function($scope, element, attributes) {

            // Register the list we need
            _spData.registerList(attributes.list);

            // NOTE: Selects work through an 'OR' condition
            var selects: any[] = [];
            if(attributes.select)
            {
                selects = processAttributesIntoArray(attributes.select);
            }

            // NOTE: Filters work through an 'AND' condition
            var filters: any[] = [];            
            if(attributes.filter)
            {
                filters = processAttributesIntoArray(attributes.filter);
            }
            
            // Wait for the list to be downloaded and ready
            $scope.$on(attributes.list+'.ready', function (msg, listData, fieldData) {

                let arr:any[] = getFieldEntries(attributes.field, listData, selects, filters);
                
                let resultValue: number = 0;

                let aggregationFunction = getAggregationFunction(attributes.aggregation);
                resultValue = aggregationFunction(arr);
                $scope.value = resultValue;

            });
        },
	templateUrl: 'templates/value.html'
	
    };
}]);

module.directive("bsChart", ["SPData", function(SPData) {
    var _spData = SPData;
    return {
        restrict: "E",
        link: function($scope, element, attributes) {

            // Wait until Google Charts is ready loading
            $scope.$on('gc.ready', function (msg) {
                // Register the list for loading
                _spData.registerList(attributes.list);
            });

            // Wait until the list is loaded and parsed
            $scope.$on(attributes.list+'.ready', function (msg, listData, fieldData) {
                let groupXAxis: boolean = element[0].hasAttribute('groupxaxis');
                console.info("Group X-axis: "+groupXAxis);
                // Initialize Google Charts wrapper
                let wrapper = new google.visualization.ChartWrapper({
                    chartType: attributes.type,
                    containerId: element.children()[0]
                });

                // TODO: Get options from a template file
                let options: any = {
                    title: "testTitle",
                };

                // Initialize Google DataTable
                let gData = new google.visualization.DataTable();
                
                let aggregateFunction = getAggregationFunction(attributes.aggregation);
                let arr: any[] = [];

                let fieldTypeX = getFieldType(attributes.xaxis, fieldData);
                let fieldTypeY = getFieldType(attributes.yaxis, fieldData);

                if(fieldTypeX == "User")
                {
                    // Get Username by id
                    fieldTypeX = 'string';
                    _spData.getUserById(20);
                    $scope.$on('user.ready', function (msg, userData) {
                        console.log(userData);
                    });
                }
                
                gData.addColumn(fieldTypeX, attributes.xaxis);
                gData.addColumn(fieldTypeY, attributes.yaxis);

                // Group data
                let groups: string[] = [];
                if(groupXAxis)
                {
                    // TODO: Group by x-axis
                    let entries: any = getFieldEntries(attributes.xaxis, listData, [], []);
                    // Iterate over entries to get all possible groups
                    for(let entry of entries)
                    {
                        // Check if groups already contains the entry
                        if(!(groups.indexOf(entry) > -1))
                        {
                            groups.push(entry);
                        }
                    }
                }

                // TODO: handle no grouping
                for(let group of groups)
                {
                    let select = [{field: attributes.xaxis, value: group}];
                    arr.push(getFieldEntries(attributes.yaxis, listData, select, []));
                }
                
                // Add each array entry to the Google DataTable
                for(var i = 0; i < arr.length; ++i)
                {
                    gData.addRow([groups[i], aggregateFunction(arr[i])]);
                }

                // Update the chart with new data and redraw it
                wrapper.setDataTable(gData);
                wrapper.draw();            
            });

        },
        templateUrl: 'templates/chart.html'
    };
}]);

