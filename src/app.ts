
// Declare Angular, and create the Dashboard module
declare var angular: any;
var module = angular.module('bsDashboard', []);

var Settings: any = {
    webURL: "https://bluesidenl.sharepoint.com",
    web: "",
    updateInterval: 1000,
}

// All lists needing to be updated
var registeredLists:string[] = [];

// Initialisation controller. Resides in <html>
module.controller('initController', ["$scope", function($scope): void {
    console.log("initController");
    // Initialize Google Charts
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(function() {
        $scope.$broadcast('gc.ready');
    });
    
}]);

// Controls the Live Update button
module.controller('liveUpdateController', ['$scope', '$interval', 'SPData', function($scope, $interval, SPData): void {

    //NOTE: We need to initialize last, so the $scope knows about it's functions
    var liveUpdateTimer: any;

    $scope.startUpdating = function (): void
    {
        liveUpdateTimer = $interval($scope.update, Settings.updateInterval);
    };
    
    // Switch state on click and set the new state in cookie
    $scope.onLiveUpdateClick = function(): void
    {
        
        setCookie("liveUpdate", $scope.cbLiveUpdate, 30);

        if($scope.cbLiveUpdate)
        {
            $scope.startUpdating();
        }
        else
        {
            $scope.stopUpdating();
        }
    };

    $scope.update = function (): void
    {
        for(let entry of registeredLists)
        {
            SPData.getList(entry);
        }
    };

    $scope.stopUpdating = function (): void
    {
        $interval.cancel(liveUpdateTimer);
        liveUpdateTimer = undefined;
    };
    
    // Get initial state from cookie and start updating if necessary
    $scope.cbLiveUpdate = (getCookie("liveUpdate") === 'true');
    if($scope.cbLiveUpdate) $scope.startUpdating();
    
}]);

// TODO: Optimize further: Only request registered fields
module.service('SPData', function($http, $rootScope) {

    // register list for loading
    this.registerList = function (listName: string) {
        // Check if the list is already registered
        for(let entry of registeredLists)
        {
            if(entry === listName) return;
        }

        // If the list is not found, add it and do the data request
        registeredLists.push(listName);
        this.getList(listName);
    };

    // Load the raw list data
    this.getList = function (listName) {

        // if not in list, add to list, do request
        
        let getListString = Settings.webURL + "/_api" + Settings.web + "/lists/getbytitle('"+listName+"')/items";

        // define self as this to refer to 'this' in the inner scope
        var self = this;
        this.httpRequest(getListString, function(listData){

            let getFieldString = Settings.webURL + "/_api" + Settings.web + "/lists/getbytitle('"+listName+"')/fields";

            self.httpRequest(getFieldString, function(fieldData) {
                $rootScope.$broadcast(listName+'.ready', listData.d.results, fieldData.d.results);
            });
        })
    };

    // $http wrapper
    this.httpRequest = function(GETString: string, callbackFunction) {

        let requestObject = {
            type: "GET",
            headers: {"Accept": "application/json; odata=verbose"},
            url: GETString,
        };
        
        $http(requestObject)
            .success(function(data) {
                // With the data succesfully returned, call our callback
                callbackFunction(data);
            })
            .error(function(response) {
                //TODO: Error can have different formats (odata and 'normal' errors?)
                if(response["odata.error"])
                {
                    console.warn("REST API Call failed: "+response["odata.error"].message.value);
                }
                else
                {
                    console.warn("REST API Call failed: "+response.error.message.value);
                }
            });        
    };

    this.getUserById = function(userId: number)
    {
        // string to get a user
        let getUserString = Settings.webURL + "/_api/web/getuserbyid("+userId+")";
        
        this.httpRequest(getUserString, function(data) {
            $rootScope.$broadcast('user.ready', data);
        });

        //TODO: implement
    }

});

function getFieldByTitle(title: string, fieldData: any): any
{
    for(let field of fieldData)
    {
        if(field.Title === title) return field;
    }
    return null;
}

// Get the type from the Field attributes and convert it to a Google Data TypeAsString
function getFieldType(title: string, fieldData: any): string
{
    let spType = getFieldByTitle(title, fieldData).TypeAsString;
    return getGoogleType(spType);
}

// return all items from a certain field after selecting and filtering
function getFieldEntries(fieldName: string, inputData: any[], selects: any[], filters: any[]): any[]
{
    let resultAfterSelect: any[] = [];
    let resultAfterFilter: any[] = [];
    let result: any[] = [];

    resultAfterSelect = processEntries(inputData, selects);
    resultAfterFilter = processEntries(resultAfterSelect, filters);
    

    if(fieldName !== '')
    {
        for(let i:number = 0; i < resultAfterFilter.length; ++i)
        {
            result.push(resultAfterFilter[i][fieldName]);
        }
    }
    else
    {
        result = resultAfterFilter;
    }
    
    return result;
}

// return a filtered subset from the inputted list
function processEntries(input: any[], selects: any[]): any[]
{
    let result: any[] = [];

    if(selects.length !== 0)
    {
        for(let i:number = 0; i < input.length; ++i)
        {
            for(let select of selects)
            {
                if(isFilterMatch(input[i], select))
                {
                    result.push(input[i]);
                }
            }
        }
    }
    else
    {
        result = input;
    }

    return result;
}

function isFilterMatch(entry: any, filter: any): boolean
{
    return entry[filter.field] == filter.value;
}

function processAttributesIntoArray(inputString: string): any[]
{
    var arr: any[] = [];
    
    // Filters are separated by a comma
    let strings: string[] = inputString.split(";");
    for(let attr of strings)
    {
        // An empty attr can happen if the users uses a trailing ';'
        if(attr != "")
        {
            let item:any = {};
            
            // Trim off leading and trailing spaces and split on '='
            let itemArr: string[] = attr.trim().split("=");
            item.field = itemArr[0].trim();
            item.value = itemArr[1].trim();
            arr.push(item);
        }
    }
    
    return arr;
}

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
    default:
        {
            //TODO: report who is reporting the error
            console.warn('bs-value: Aggregation of type '+functionString+' not found.');
        } break;
    }

    return aggregationFunction;
}

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
        return "User";// TODO: implement
/*
    case 'Threading':
    case 'Computed':
    case 'Invalid':
    case 'Lookup':
    case 'Calculated': // could be any type
    case 'MultiChoice': // could be any type
    case 'GridChoice': // could be any type 
    case 'File': // STUDY: check what a file type specifies, could be countable
    case 'Attachments': // STUDY what's an attachment?
    case 'Recurrence': // STUDY: maybe some type of DateTime?

    case 'AllDayEvent': // STUDY: what is this?
    case 'OutcomeChoice': // STUDY: what is this?
*/
    }
}
