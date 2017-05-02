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

function getCount(data): number
{
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
