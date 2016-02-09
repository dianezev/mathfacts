FMF = window.FMF || {};

FMF.controller = (function() {
    'use strict';   
    
    var hoverInput = false;
    var lastOption = '';
    var model = FMF.model;
    var view = FMF.view;

    var publicAPI = {

        handleAnswer: function(numPick) {
            var problemIndex = model.problemIndex;
            var problemSet = model.problemSet;
            var topVal = problemSet[problemIndex][0];
            var bottomVal = problemSet[problemIndex][1];
            var correctAns = problemSet[problemIndex][2];
            var isTimed = model.isTimed;
            var liveAnswer = '#answer' + view.liveIndex;
            var answer;

            // If argument passed, assign value to current problem
            if (typeof(numPick) !== 'undefined') {
                $('.live').val(numPick);
            }
            answer = parseFloat($(liveAnswer).val());

            // If no answer, don't proceed with check
            if (isNaN(answer)) {
                $(liveAnswer).focus();
                return;
            } else {
                model.checkAns(topVal, bottomVal, answer,
                        correctAns, isTimed);
                view.nextProblem(answer, correctAns, isTimed);
            }
        },
        handleBodyClick: function() {
            /*
             * Force focus to live problem only if
             * these conditions are met:
             *  1) #chalkboard does not have class 'hide'
             *  2) #topicMathFacts does not have class 'hide'
             *  3) #cover does not have class 'bringToFront'
             *  4) #cover does not have class 'coverAll'
             */
            if ((!($('#chalkboard').hasClass('hide')))&&
                    (!($('#topicMathFacts').hasClass('hide')))&&
                    (!($('#cover').hasClass('bringToFront')))&&
                    (!($('#cover').hasClass('coverAll')))) {
                $('#answer' + view.liveIndex).focus();

            // Otherwise, if start screen is visible, set focus to user name
            } else if ($('#userName').is(':visible')) {
                $('#userName').focus();
            }
        },
        handleBtnHover: function(numPick) {
            $('.live').val(numPick);
            $('.live').select();
            hoverInput = true;
        },
        handleChangeLevel: function(levelIndex)  {
            model.getProblemArray(levelIndex);
            view.displayNextSet(false);
            view.setHighlight(false);
        },
        handleClearHover: function() {
            $('.live').val('');
            hoverInput = false;
        },
        handleConfirm: function(isOKtoCancel) {
            var isTimed = model.isTimed;

            $('#topicConfirm').addClass('hide');

            /*
             * Note that if timer finished before user confirmed
             * whether they wanted to cancel test, the results will
             * be displayed (behind the confirm dialog).
             * Force it closed if user chose 'Yes, stop test'.
             */
            if (isOKtoCancel) {

                // If timer has run out, hide results
                if (!isTimed) {
                    $('#topicTestResults').addClass('hide');
                }

                // Remove the overlay
                $('#cover').removeClass('coverAll');

                // Cancel timer & proceed to user's selection
                model.cancelTimer();
                view.displayNextSet(true);
                view.setHighlight(false);
                view.setTracker(true);
                view.switchContent(lastOption);
            } else {

                /*
                 * If timer hasn't run out, remove the overlay
                 * so user can continue timed test
                 * (If it's NOT OK to cancel test & timer has run out,
                 * Leave BOTH the results AND overlay visible.)
                 */
                if (isTimed) {
                    $('#cover').removeClass('coverAll');
                }
            }
        },
        handleFooterClick: function(id) {
            var isTimed = model.isTimed;
            lastOption = id;

            /*
             * If in middle of timed test,
             * confirm that user wants to cancel before proceeding
             */
            if (isTimed) {
                $('#topicConfirm').removeClass('hide');

                // Bring overlay to front (but behind confirm dialog)
                $('#cover').addClass('coverAll');

                $('#continueTest').focus();

            // Otherwise go to topic selected by user
            } else {
                view.switchContent(id);
            }
        },
        handleOpClick: function(newOp) {

            // Reset 'operator' (only if changed from current setting)
            if ((model.opName !== newOp)) {
                model.changeOperator(newOp);
                model.getProblemArray(0);
                view.displayNextSet(false);
                view.setHighlight(true);
                
            // Prevent re-display of checkmarks if returning to practice
            } else {
                view.checkMarks(false);
            }

            // Unhide math facts portion of page (if needed)
            view.showTopic('#topicMathFacts');
            
            // Set active footer option to 'Practice'
            $('.footer li').removeClass('activeFooter');
            $('.footer li:first').addClass('activeFooter');            
        },
        handlePrintResults: function() {
            window.print();
        },
        handleStart: function(difficulty, userName) {
            model.setProblemRanges(difficulty);
            model.setName(userName);
            view.setFtrsHdrs();
            model.changeOperator('add');
            model.getProblemArray(0);
            view.displayNextSet(false);
            view.setHighlight(true);
            view.showTopic('#topicMathFacts');
        },
        handleTestResults: function() {
            
            // Display next set of practice problems
            view.displayNextSet(true);
            view.setHighlight(false);
            view.setTracker(true);

            $('#topicTestResults').addClass('hide');

            // Send overlay to back
            $('#cover').removeClass('coverAll');
        }
    };

    return publicAPI;
})();
