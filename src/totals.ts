/*
function group(inputData, method, columnIndex)
{
    //NOTE: IE default parameter fix
    if(typeof(columnIndex) == 'undefined') columnIndex = null;
    
    var result;
    var category = [];
    var categories = [];
    // Look for the first category and set it as current
    var i = 1;
    var currentCategory = inputData[i][columnIndex];
    if(columnIndex !== null)
    {
	// Loop over all rows in the current category
	while(typeof(inputData[i]) != 'undefined')
	{
            if(inputData[i][columnIndex] === currentCategory)
	    {
		var row = [];
		var j = 0;
		
		// Loop over all columns, but skip the column containing the category
		while(j < inputData[0].length)
		{
		    if(j !== columnIndex || inputData[0].length === 1)
		    {
			row.push(inputData[i][j]);
		    }
		    j++;
		}
		category.push(row);
	    }
	    else
	    {
		//TODO: "2" is added for the temporary version of SUM
		//TODO: Rewrite this to the new method asap!
		category = window[method + "2"](category);				
		category.splice(columnIndex,0,currentCategory);
		categories.push(category);

		// Look for next category
		currentCategory = inputData[i][columnIndex];
		category = [];	

	    }
	    i++;
	}

	//NOTE: Quick fix for not skipping the last category
	//TODO: "2" is added for the temporary version of SUM
	//TODO: Rewrite this to the new method asap!
	category = window[method + "2"](category);				
	category.splice(columnIndex,0,currentCategory);
	categories.push(category);
	
	categories.splice(0,0,inputData[0]);
	result = categories;
    }
    else
    {
	inputData.splice(0,1);
	console.log();
	result = window[method](inputData)[0];
	result = [["Key"], ["Value", result]];
    }

    return result;
}
*/
function group2(inputData, columnIndex): {}
{
    var group = [];
    var result = {};
    var currentItem = inputData[0][columnIndex];

    for(var i = 0; i < inputData.length; i++)
    {
	if(inputData[i][columnIndex] !== currentItem)
	{
	    result[currentItem] = group;
	    group = [];
	    currentItem = inputData[i][columnIndex];
	}
	group.push(inputData[i]);
    }
    //NOTE: quick fix to include the last group
    if(group.length > 0) result[currentItem] = group;
    
    return result;
}

function SUM(data: number[])
{
    if(data.length > 0)
    {
	function parseIntForSum(str) {
	    var possibleInteger = parseInt(str);
	    return isNaN(possibleInteger) ? 0 : possibleInteger;
	}

	function sum(f, s) {
	    return parseIntForSum(f) + parseIntForSum(s);
	}

	return data.reduce(sum);
    }
    return null;
}

function COUNT(data: number[])
{
    return data.length;
}

function COUNT2(data)
{
    var sum = [];
    for(var i = 0; i < data[0].length; i++)
    {
	sum.push(0);
	for(var j = 0; j < data.length; j++)
	{
	    sum[i]++;
	}
    }
    
    return sum;
}

function AVG(data: number[])
{
    var sum: number = SUM(data);
    var count: number = COUNT(data);
    // Prevent divide by zero
    if(sum === 0 || count === 0)
    {
	return 0;
    }
    
    return sum / count;
}

function MIN(data: number[])
{
    return data.reduce(function(a, b, i, data) {
	return Math.min(a,b);
    });
}

function MIN2(data)
{
    
    var min = [];
    for(var i = 0; i < data[0].length; i++)
    {
	min.push(Number.MAX_VALUE);
	for(var j = 0; j < data.length; j++)
	{
	    if (data[j][i] < min)
	    {
		min[0] = data[j][i];
	    }
	}
    }
    return min;
}

function MAX(data: number[])
{
    return Math.max.apply(null, data);
}

function VAR(data)
{
    console.warn("VAR function is not yet implemented!");
    return null;
}

function STDDEV(data)
{
    console.warn("STDDEV function is not yet implemented!");
    return null;
}
