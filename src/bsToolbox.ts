/**
 * Takes a number and outputs a currency formatted string.
 * Currently the outputformat is like this:
 * €1.000.000,00
 *
 * TODO: Add formatting options for currency symbol and period or comma usage
 *
 * @param {number} input - the number to be formatted
 * @param {boolean} prefixCurrencySymbol - prefix the value with a currency symbol
 * @return {string}
 */

//TODO: Fix
function bsFormatSPCurrency(input, prefixCurrencySymbol)
{
    // Check if input is actually a valid number
    if (!isNaN(input))
    {
        // Check for negativity
        var neg = false;

        if (input < 0)
	{
            neg = true;
            input = Math.abs(input);
        }
	
        // Parse as float and fix to two decimals
	input = parseFloat(input).toFixed(2);	
        // Replace the default period with a comma
        var result: string = input.toString().replace('.', ',');
        // Place a period after every third digit
        result = result.replace(/(\d)(?=(\d{3})+\,)/g, '$1.');

        if (prefixCurrencySymbol)
	{
            result = (neg ? "-€" : '€') + result;
        }

        return result;
    }
    else {
        return null;
    }
}

function setCookie(cname, cvalue, exdays)
{
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname: string): string
{
    var name:string  = cname + "=";
    var ca:string[] = document.cookie.split(';');
    for (var i:number = 0; i < ca.length; i++) {
        var c:string = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
