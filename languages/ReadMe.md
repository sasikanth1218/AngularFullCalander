# How To:  Use l10nFactory
The l10nFactory was designed to be extremely simple to use for both programmers
and translators.  This documentation will discuss both how to set up localized
language files and how to use them.

## The Language Files
The language files must reside in the /app/languages/ directory.  Here, you will
find:

  * `available.json`:  Controls what languages are available in the application.
  * `global.json`:  Creates language-independent phrases.
  * `en-us.json`:  Language file for English as spoken in the United States of
    America.  This is the only _mandatory_ localized language file.
  * `{language-ID}.json`:  All other localized language files.

### <a id="interpolation-markers"></a>Interpolation Markers
An *Interpolation Marker* is a special notation that can be placed in a phrase
so that it can later be replaced with data from the application when it is being
displayed to the user.  These markers are numbered -- always starting with 0 --
allowing any datum to be repositioned without regard for its relative position
to other markers in the same phrase, even allowing any datum to be used multiple
times in a single phrase.  These markers take the form `{#}` where `#` is the
identifier of the datum to use at the specified position.

From the programmer's point of view, the marker identifiers are the ordinal
positions of the arguments as passed to `l10nFactory.interpolateString`,
discussed later.

#### Example
    "My name is {0}."
    "Me llamo {0}."
    "私の名前へ{0}です。"

### The `available.json` File
This file informs the application which localized language files exist on the
server and are ready for end-users.  This is a [JSON](json.org) file with an
array as its outermost container.  Each array element is an object with these
mandatory properties:

  * `id`:  The unique identifier of this language specifying a 2-character
    language code, one hyphen, and a 2-character country code, like `en-us`.
  * `name`:  The *native* name of the language, as its users prefer it to appear
    in the application.

#### Example

    [
      {"id": "en-us", "name": "English (United States)"}
      , {"id": "en-gb", "name": "English (Great Britain)"}
      , {"id": "es-mx", "name": "Español (Mexicano)"}
      , {"id": "es-sp", "name": "Español (España)"}
      , {"id": "zh-cn", "name": "中文"}
      , {"id": "zh-tw", "name": "漢語"}
      , {"id": "jp-jp", "name": "日本語"}
    ]

### The `global.json` File
This is a [JSON](json.org) file that contains language-independent phrases.
Nothing in this file is permitted to be translated into any other language.
This file will contain such immutable values as the application vendor's name,
contact information, and similar data.

Interpolation Markers may be used in this file.  All phrases defined in this
file are injected into every module of the localized language files, discussed
later.  This injection is deliberately performed such that keys in this file
overwrite same-named module keys.

#### Example

    {
      "manufacturerName": "Fair Isaac & Company"
      , "copyrightNotice": "© {0} {1}, {2}"
    }

### Localized Language Files, Like `en-us.json`
These are [JSON](json.org) files that are organized as module objects.  Each
module object represents a part of the application, usually a particular view or
page.  Each module is organized in `"key": "value"` form.  All keys in a single
module must be unique.  Except for the `all` module, keys in one module do not
affect keys in any other module.  Interpolation Markers may be used in these
files.

The key names are the identifiers that the application programmers have written
into the application's source code.  Never change the key names.  Always include
every key when translating the values into a new language file, even if you must
temporarily use placeholder values.

Some values may contain HTML.  When translating values into other languages, be
sure to re-employ the same HTML to achieve the same resulting effect for the
target language.

#### The Special, `all`, Module
There is one special module named, "all", which contains phrases that are
always automatically combined with every other module by the l10nFactory.
Unlike phrases from `global.json` however, phrases in the `all` module can be
overwritten by phrases in the other modules.  Overwriting phrases should be
avoided but is made possible in this way for exceptional circumstances.

#### Example
Taken from `en-us.json`:

    {
      "all": {
        "allRightsReserved": "All rights reserved."
      }, "customJobControllerInstance": {
        , "jobTypeName": "Job"
        , "jobTypeDescription": "A custom job type that specifies the entry point is a Pentaho Kettle job"
        , "errorJobNameMinimumSize": "Name must be at least {0} characters"
        , "advancedFrameworkTeaser": "<strong>*</strong> Advanced users can download and generate a bootstrapped version of the CDI framework <a href=\"{0}\"><strong>here</strong></a>"
      }, "jobChainController": {
        , "newJobChain": "New Job Chain"
        , "jobDataLoading": "Please wait for data to load..."
        , "selectJob": "Select a job..."
        , "chainedJobLabel": "Job {0}"
      }
    }

### Adding New Languages
To add a new language, you'll really just perform three steps:

  1.  Copy the `en-us.json` file to your new language file.  This helps ensure
      that your new translations will include all existing modules and keys.
  2.  Update `available.json` to list your new language.
  3.  Translate all phrases in your new language file and commit the result to
      the project source.

## Programming With l10nFactory
Using the l10nFactory is very easy.  The simplified work-flow for adding
localization to your code should be similar to the following.  There are more
complicated use-cases discussed later, but this is the most simple:

  1. Add your camelCased module name to the `en-us.json` language file.  This
     necessarily implies that you will perform your work while using the U.S.A.
     English language.
  2. In your code, request your module's strings using the
     `l10nFactory.getStrings` method.  In practically every case, you should
     assign the result of that method call to a variable named, `L`, as in:
     `var L = l10nFactory.getStrings("yourModuleName");`
  3. Write your code as you normally would, except that at every point where you
     are embedding a string that is meant to be seen by the end-user -- do not
     translate error messages that are *not* meant to be seen by end-users --
     do this:
     1. Add a new, unique key to your module in the `en-us.json` file, like:
        `myNewString`.
     2. Set its value to the string you need, like:
        `"myNewString": "My new string"`
     3. Show the value of the string you received from l10nFactory.  If you are
        following the norm, this should look like:
        * In your JavaScript:  `L.myNewString`
        * In your HTML view (unless it contains HTML, discussed later), assuming
          that you've given a reference to `L` to the `$scope`, like
          `$scope.L = L;`:
          `{{L.myNewString}}`

Unless you really have no functions in your code that need to display strings,
do not add your strings object directly to the `$scope`, as:
`$scope.L = l10nFactory.getStrings("yourModuleName");`  Doing so forces you to
refer to it in your other functions as `$scope.L.myStringID`, which is messy.
Instead, always assign your strings object to a local variable and then provide
a reference to `$scope`.

### Adding Interpolated Strings
The l10nFactory provides a string interpolation method called
`l10nFactory.interpolateString(template, args)`.  The `template` is your string
and `args` is any number of additional arguments that are substituted into the
template.  See [Interpolation Markers](#interpolation-markers) for more
information about markers in strings and their relationship to `args`.

It is very easy to use this method.  You can call it directly from within your
JavaScript, as in:
`var ctrlString = l10nFactory.interpolateString(L.myString, myValue0, myValue1, myValueN);`
If you are going to call the method from within your HTML view, be sure to
provide a function delegate to `$scope`, like:
`$scope.interpolateString = l10nFactory.interpolateString;`.  Unless your string
contains HTML -- discussed later -- you can express your interpolation directly
in your view as in:
`{{interpolateString(L.myString, myValue0, myValue1, myValueN)}}`

### Dealing With HTML In Your Strings
Some strings need emphasis or other markup when they are rendered in your view.
AngularJS specifically prohibits this practice unless you use AngularJS' own
cleansing functions, marking it safe for display.  This may seem tedious, but it
is easy to do.  This applies to both interpolated and non-interpolated strings.
If any HTML exists in your string, it must be trusted by AngularJS before it may
appear in your view.

First, inject the $sce provider into your code along with the l10nFactory.  This
typically looks like:

    var myController = function ($scope, $sce, l10nFactory) {...}

Second, instruct AngularJS to trust your string:

    $scope.myHTMLString = $sce.trustAsHtml(L.myStringID);

Finally, you must -- there is no other accepted way to do this -- use the
`data-ng-bind-html` attribute (or `ng-bind-html`, but using the longer `data-`
form is cleaner because it properly validates) on a containing HTML tag to
render your string as HTML:

    <span data-ng-bind-html="myHTMLString"></span>

The tag you use can be any HTML tag that normally renders content.  AngularJS
specifically will not allow you to use the short-hand form, making this
impossible (it will always render no content):

    {{myHTMLString}}

## Changing the Language in Code
The l10nFactory supports hot-swapping the language at run-time.  Any view that
is already bound will automatically update whenever the language is changed.  To
do so, you need only change the l10nFactory language identifier and then update
(not replace) your language object.  For example:

    // The default language is "en-us" if no value is specified before the first
    // request for your strings object, L.
    var L = l10nFactory.getStrings("myModuleID");
    // Render your view using L.myStringKeys

    // Later, change the language to Japanese and update your strings object
    l10nFactory.setLanguageID("jp-jp");
    L = l10nFactory.getStrings("myModuleID");
    // Your view has automatically switched to Japanese, including interpolated
    // strings.

## More Information
The l10nFactory is heavily documented.  Please refer to its source code for more
information and to discover other capabilities that aren't discussed here.  For
an example of how to let the end-user change the display language on-the-fly,
please refer to these files:

   * /apps/controllers/loginController.js
   * /apps/partials/login.html
