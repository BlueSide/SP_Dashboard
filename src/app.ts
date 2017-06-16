
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

// Initialisation controller. Resides in <html>
module.controller('initController', ['$scope', '$q', '$interval', 'SPData', function($scope, $q, $interval, SPData): void {
    console.log("initController");
    SPData.getSiteUsers();

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

        // NOTE: Only one of the values has to be true
        // to be a match, so on true we can return immediately
        if(isMatch) return true;
    }

    return isMatch;
}

var regexpOperator = /(=|<|>|!=|<=|>=|~|!~)/;

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
