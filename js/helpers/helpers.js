FMF = window.FMF || {};

FMF.helpers = (function() {
    'use strict';

    var publicAPI = {

        // Function returns string based on current day/time (i.e. Tuesday, October 6, 2015 (2:49 pm))
        dateInfo: function() {
            var date = new Date();
            var hour = date.getHours();
            var minutes = date.getMinutes();
            var year = date.getFullYear();
            var weekdayIndex = date.getDay();
            var monthIndex = date.getMonth();
            var ampm = '';
            var daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            var monthsInYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
                               'August', 'September', 'October', 'November', 'December'];
            var weekdayLabel = '';
            var monthLabel = '';
            var dateString = '';
            var timeString = '';

            // Get text for weekday & month to create dateString
            weekdayLabel = daysOfWeek[weekdayIndex];
            monthLabel = monthsInYear[monthIndex];
            dateString = weekdayLabel + ', ' + monthLabel + ' ' + date.getDate() + ', ' + year;

            // (From stackoverflow - get time as hh:mm am/pm)
            ampm = ((hour >= 12) ? 'pm' : 'am');
            hour = hour % 12;
            hour = hour? hour : 12;
            minutes = minutes < 10 ? '0'+minutes : minutes;
            timeString = hour + ':' + minutes + ' ' + ampm;

            return dateString + ' (' + timeString + ')'; 
        },

        // Return greeting based on time of day, i.e. 'Good morning!'
        greeting: function() {
            var date = new Date();
            var hour = date.getHours();
            var greeting = '';            

            if (hour >= 18 && hour <=23) {
                greeting = 'Good evening!';
            } else if (hour >= 0 && hour <=11) {
                greeting = 'Good morning!';
            } else if (hour >= 12 && hour <=17) {
                greeting = 'Good afternoon!';
            } else {
                greeting = 'Hello!';
            }

            return greeting;
        },
        
        // Force first char of string to ucase
        leadCap: function(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },
        
        // Restrict data-entry to numbers (adapted from stackoverflow)
        validateNumber: function(key) {

            // Return true if user types number or left arrow or backspace key
            if ((key === 8 || key === 37) ||
                (key >= 48 && key <= 57) ||
                (key >= 96 && key <= 105)) {
                return true;

            } else {
                return false;
            }
        }
        
    };
    return publicAPI;
})();
