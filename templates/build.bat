@echo off

set dest="//portal.addventure.nl@SSL/DavWWWRoot/blueside/dev/SitePages/templates"

@echo Copying HTML files...
copy *.html %dest%
@echo.
@echo Copying JS files...
copy *.js %dest%
