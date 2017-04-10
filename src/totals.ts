//TODO: Annotate whats happening here
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
    var result: any[] = [];
    for(var i: number = 0; i < data.length; i++)
    {
	//NOTE: Don't include blank values
	if(typeof(data[i][0]) !== 'undefined')
	{
	    if(data[i][0] !== null)
	    {
		result.push(data[i]);
	    }
	}
	else
	{
	    result.push(data[i]);
	}
    }
    return result.length;
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
