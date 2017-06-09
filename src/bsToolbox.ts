// TODO: Add Return type
function formatFloat(input: number)
{
    return toFixed(input, 2);
}

// TODO: Add types
function toFixed(value, precision) {
    var power = Math.pow(10, precision || 0);
    return String(Math.round(value * power) / power);
}

function setCookie(cname: string, cvalue:string , exdays: number): void
{
    let date:Date = new Date();
    date.setTime(date.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires:string = "expires=" + date.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname: string): string
{
    let name:string  = cname + "=";
    let ca:string[] = document.cookie.split(';');
    for (var i:number = 0; i < ca.length; ++i) {
        let c:string = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
