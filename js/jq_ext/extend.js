/*****************************************
 * Uses regex exp to remove a group of classes
 *
 * from stackoverflow 
 * http://stackoverflow.com/questions/2644299/jquery-removeclass-wildcard 
 *****************************************/

(function ( $ ) {
    $.fn.removeClassRegex = function(regex) {
        return $(this).removeClass(function(index, classes) {
            return classes.split(/\s+/).filter(function(c) {
                return regex.test(c);
            }).join(' ');
        });
    };
}( jQuery ));


