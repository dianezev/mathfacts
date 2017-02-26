##About Math Facts ([fastermathfacts.org](http://www.fastermathfacts.org))##
By Diane Zevenbergen, dianezev@comcast.net

####Goals####
> * Help students learn to recall basic math facts quickly
> * Provide timed results so that students, teachers and parents can monitor progress
> * Provide instant feedback to students
> * Free up teachers' time with automated scoring

####To Contribute to this Project####
>To make a correction or improvement to this project, just fork the repository to your account, make the change you'd like and submit a pull request. I'm new to Javascript and welcome suggestions on improving organization, readability and efficiency as well as content improvement.

####Still To Be Done####
> * Add code to make responsive for various devices & screen sizes, especially tablets.
> * Address browser differences (currently works best in Chrome).
> * Add server-side functionality to track student progress over time.

####Under the Hood####
_The following Javascript files assign methods to the namespace **'FMF'**:_

> ####**_model.js_**####
> This file defines **FMF.model** and includes methods that serve the following purposes:
>   * Generate problem sets based on user selections
>   * Define results object used to report results for a user session
>   
> ####**_timer.js_**####
> This file extends **FMF.model** with methods related to the timer which is used for 1-minute timed tests:
>   * Cancel timer
>   * Start timer
>   * End timed test
>   
> ####**_view.js_**####
> This file defines **FMF.view** and includes methods that serve the following purpose:
>  * Update display when users choose a different operator from main menu (_+_, _-_, ...)
>  * Update display when users choose a different level from the sub-menu ( _+1_, _+2_, _+3_, ...)
>  * Update display when users complete a problem
>  * Update display when users choose an option from the footer menu (_Practice_, _Timer_, _Scores_, _About_)
>
> ####**_controller.js_**####
> This file defines **FMF.controller** and includes methods that handle all events listed in **_events.js_**.
>
> ####**_helpers.js_**####
> This file defines **FMF.helpers** and contains the following helper functions: 
>  * leadCap() returns string with leading uppercase character
>  * validateNumber() returns true when a number key is pressed, false otherwise
>  * dateInfo() returns a custom date string
>
> ####**_template.js_**####
> This file defines **FMF.templates** and contains functions that use Underscore's _.template method for dynamic portions of the HTML.
>
> ####**_events.js_**####
> This file contains the event handlers.
