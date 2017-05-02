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

                let data:any[] = getFieldEntries(attributes.field, listData, selects, filters);
                
                let resultValue: number = 0;

                let aggregationFunction = getAggregationFunction(attributes.aggregation);
                resultValue = aggregationFunction(data);
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
                let groupZAxis: boolean = element[0].hasAttribute('groupzaxis');

                let options: any = window[attributes.options];
                options.title = attributes.title;
                
                // Initialize Google Charts wrapper
                let wrapper = new google.visualization.ChartWrapper({
                    chartType: attributes.type,
                    containerId: element.children()[0],
                    options: options                    
                });

                // map chart options to an object from templates.js
                

                // Initialize Google DataTable
                let gData = new google.visualization.DataTable();

                // Get aggregate function pointer
                let aggregateFunction = getAggregationFunction(attributes.aggregation);

                let data: any[] = [];

                let fieldTypeX = getFieldType(attributes.xaxis, fieldData);
                let fieldTypeY = getFieldType(attributes.yaxis, fieldData);
                let fieldTypeZ = getFieldType(attributes.zaxis, fieldData);
  
                // Group data
                let xgroups: string[] = [];
                let zgroups: string[] = [];
                
                if(groupXAxis)
                {
                    xgroups = group(attributes.xaxis, listData);
                }

                if(groupZAxis)
                {
                    zgroups = group(attributes.zaxis, listData);
                }
                
                // TODO: handle no grouping
                for(let xgroup of xgroups)
                {
                    let select = [{field: attributes.xaxis, value: xgroup}];
                    data.push(getFieldEntries(attributes.yaxis, listData, select, []));
                }
                
                gData.addColumn('string', 'label');

                for(let zgroup of zgroups)
                {
                    gData.addColumn('number', zgroup);
                    
                }

                if(zgroups.length < 1) gData.addColumn('number', 'value');
                
                // Add each array entry to the Google DataTable
                for(var i = 0; i < data.length; ++i)
                {
                    let row:any[] = [xgroups[i]];
                    if(zgroups.length < 1) row.push(aggregateFunction(data[i]));
                    for(let zgroup of zgroups)
                    {
                        let select = [{field: attributes.zaxis, value: zgroup}];
                        let filter = [{field: attributes.xaxis, value: xgroups[i]}];
                        row.push(aggregateFunction(getFieldEntries(attributes.yaxis, listData, filter, select)));
                    }
                    gData.addRow(row);
                }

                // Update the chart with new data and redraw it
                wrapper.setDataTable(gData);
                wrapper.draw();            
            });

        },
        templateUrl: 'templates/chart.html'
    };
}]);

