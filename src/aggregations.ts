function getSum(data: number[]): number
{
    if(data.length > 0)
    {
	function parseIntForSum(str) {
	    var possibleInteger = parseInt(str);
	    return isNaN(possibleInteger) ? 0 : possibleInteger;
	}

	function calc_sum(f, s) {
	    return parseIntForSum(f) + parseIntForSum(s);
	}

	return data.reduce(calc_sum);
    }
    return null;
}

function getCount(data: any[]): number
{
    // Get the old length
    let length:number = data.length;
    for(let i:number = 0; i < length; ++i)
    {
        // Push to the end of the array if the item is not null or undefined
        data[i] && data.push(data[i]);
    }
    // Cut away the old array from the beginning
    data.splice(0, length);

    // Return the new length
    return data.length;
}

function getAverage(data: number[]): number
{
    var sum: number = getSum(data);
    var count: number = getCount(data);
    // Prevent divide by zero
    if(sum === 0 || count === 0)
    {
	return 0;
    }
    
    return sum / count;
}

function getMin(data: number[]): number
{
    return data.reduce(function(a, b, i, data) {
	return Math.min(a,b);
    });
}

function getMax(data: number[]): number
{
    return Math.max.apply(null, data);
}
