FMF = window.FMF || {};

FMF.model = (function() {
    'use strict';

    var template = FMF.template;
    var levelsInfo = []; 

    /*
     * There are three DIFFICULTY levels: Level 1 uses 0-5,
     * Level 2 uses 1-10 and Level 3 uses 1-12 to create
     * addition, subtraction, multiplication & division
     * problems.
     *
     * 'levelsInfo' is an array of info for each level
     * It includes the following properties:
     *      nums: an array of #s used for level 
     *      drills: array of arrays - used to generate various problem sets
     *      drillsDiv: similar to drills, but excludes zero 
     *      labels: strings for each level - used in menu
     *      labelsDiv: similar to labels, but excludes zero 
     */
    
    levelsInfo[0] = getLevelsInfo(0, 5);
    levelsInfo[1] = getLevelsInfo(1, 10);
    levelsInfo[2] = getLevelsInfo(1, 12);
    
    function getLevelsInfo(start, end) {
        var nums = getNums(start, end);
        var drills = getDrills (start, end, nums);
        var labels = getLabels(start, end);
                    
        return {nums: nums, 
                drills: drills, 
                drillsDiv: (start === 0) ? getDrills (1, end, getNums(1, end)) : drills, 
                labels: labels, 
                labelsDiv: (start === 0) ? getLabels(1, end) : labels
               }
        
        function getNums(start, end) {
            return Array(end - start + 1).fill()
                    .map((val, j) => start + j);
        }
        
        function getLabels(start, end) {
            return Array(end - start + 1).fill()
                    .map((val, j) => (start + j)
                    .toString())
                    .concat(start.toString() + ' ...' + end.toString());            
        }

        function getDrills(start, end, nums) {
            return Array(end - start + 1).fill()
                    .map((val, j) => [start + j])
                    .concat([nums]);            
        }
    }
    
    var publicAPI = {
        diff: -1,    //Set in controller.handleStartLevel
        drillRange: [],    //Set in model.setProblemRanges
        drillRangeDiv: [],    //Set in model.setProblemRanges
        labelRange: [],    //Set in model.setProblemRanges
        labelRangeDiv: [],    //Set in model.setProblemRanges
        levelIndex: 0,      // Set in controller.handleChangeLevel and in model.updateLevelMenu
        numRange: [],    //Set in model.setProblemRanges
        operator: '',  // Set in controller.changeOperator
        opName: '',  // Set in controller.changeOperator
        perPage: 5,
        problemIndex: -1,
        problemSet: [],     // Set in model.getProblemArray
        results: {},    //Set in model.initializeResults
        tScore: 0,      //Incremented with each correct answer
        user: '',

        bumpUp: function() {
            var problemIndex = this.problemIndex;
            var perPage = this.perPage;

            /*
             * Adjust problem index so that fresh set of problems
             * displays EVEN IF user hasn't reached end of current set
             * (This is to avoid starting a timed test midway through a set &
             * also to clear out a test set when timer stops.)
             */
            this.problemIndex = problemIndex + perPage - 
                                (problemIndex % perPage);
        },
        changeOperator: function(opName) {
            var symbol = '';
            var operator;
            var lblArray = [];

            this.opName = opName;
            
            // Set label array for +, - and x
            lblArray = this.labelRange;

            /*
             * Depending on operator, get symbol (for display) and
             * operator (used in HTML)
             */
            switch (opName) {
                case 'add':
                    operator = '+';
                    symbol = '+';
                    break;

                case 'subtract':
                    operator = '-';
                    symbol = '-';
                    break;

                case 'multiply':
                    operator = '&times;';
                    symbol = '\xD7';
                    break;

                case 'divide':
                    operator = '&divide;';
                    symbol = '\xF7';
                
                    // Use different label array for div (excludes 0)
                    lblArray = this.labelRangeDiv;
                    break;

                default:
                    alert('Error: "' + opName + '" is not a valid option.');
                    return;
            }
            this.operator = operator;

            $('.valop').text(symbol);
            setColors();
            updateLevelMenu();

            // Adjust colors to reflect selected operator
            function setColors() {
                var idName = '#math_' + opName;
                var className = opName + 'Color';
                
                // Remove any of the color classes before resetting
                $('[id^="answer"]').removeClass('error');
                $('.page').removeClassRegex(/Color$/);
                $('.subLevels').removeClass(/Color$/);

                // Set different colors for each operation
                $('.page').addClass(opName + 'Color');

                // Adjust colors in main menu if needed
                if (!($(idName).hasClass(className))) {

                    $('[id^="math_"]').removeClassRegex(/Color$/);
                    $(idName).addClass(className);
                }
            }

            function updateLevelMenu() {
                var subMenuHTML = template.getSubMenuHTML(lblArray, operator);

                // Update list options in levelMenu
                $('#levelMenu').html(subMenuHTML);

                // Intially default to first level
                $('#levelMenu li').removeClass('active');
                $('#levelMenu li').first().addClass('active');
            }   
        },
        checkAns: function(topVal, bottomVal, answer, correctAns, isTimed) {
            var result = this.results[this.opName].level[this.levelIndex];
            var testCount;

            if (isTimed) {
                testCount = result.timed.length - 1;
            }

            // Increment ctr to keep track of total # of problems answered
            this.problemIndex +=1;

            /*
             * If answer is incorrect, set error flag to true and record 
             * error. (For practice sessions only, also highlight errors)
             */
            if (answer !== correctAns) {

                // Add error array to results
                result.errors.push([topVal, bottomVal, answer, correctAns]);

                /*
                 * If not timed test, add 'error' class to highlight error
                 * (don't distract users with highlight during
                 * a timed test)
                 */
                if(!isTimed) {
                    $('.live').addClass('error');
                }

            /*
             * Otherwise, if answer is correct, increment # of CORRECT
             * answers for practice or timed
             */
            } else {

                // Increment overall counter for # correct problems
                this.tScore ++;

                // Either increment # for timed count, or practice count
                if (isTimed) {
                    result.timed[testCount][0] ++;
                } else {
                    result.practice[0] ++;
                    $("#trackScore").html("+" + this.tScore);
                }

                /*
                 * If not timed test, display check mark to
                 * indicate correct answer (& fade out)
                 */
                if(!isTimed) {
                    $('.live + i').addClass('fadeInOutOnce');
                }
            }

            /*
             * Increment counter for # problems ATTEMPTED - either
             * 'practice' or 'timed'
             */
            if (isTimed) {
                result.timed[testCount][1] ++;
            } else {
                result.practice[1] ++;
            }
        },
        doubleArray: function() {
            var problemSet = this.problemSet;

            // Double size of problem set with concat
            problemSet = problemSet.concat(problemSet);
            this.problemSet = problemSet;
        },
        getAddOrMult: function(tempNums, drillArray) {
            var basicProblemSet = [];
            var operator = this.operator;
            var correctAns;

            /*
             * Loops cycle through array values to create an array of
             * addition or multiplication problems (depending on 
             * value of 'operator').
             * Note that at this stage duplicate problems are excluded
             * (array will not contain BOTH 4 + 5 = 9 and 5 + 4 = 9).
             */
            for (var j = (drillArray.length-1), m = 0; m <= j; j -= 1) {
                for (var i = (tempNums.length-1), l = 0; l <= i; i -= 1) {

                    if (operator === '+') {
                        correctAns = drillArray[j] + tempNums[i];
                    } else if (operator === '&times;') {
                        correctAns = drillArray[j] * tempNums[i];
                    }

                    /*
                     * Randomize the order of the addends/factors for
                     * display purposes
                     * (example: if user chooses '+2' from menu,
                     * vary whether '2' displays as
                     * the first or second addend in the problems)
                     */
                    if (Math.floor(Math.random()*2)) {
                        basicProblemSet.push([drillArray[j],
                                tempNums[i], correctAns]);
                    } else {
                        basicProblemSet.push([tempNums[i],
                                drillArray[j], correctAns]);
                    }
                }

                /*
                 * If the value drillArray[j] is also in tempNums,
                 * splice it out of tempNums
                 * to avoid creating duplicate problems
                 */
                var lookForMatch = tempNums.indexOf(drillArray[j]);

                if (lookForMatch !== -1) {
                    tempNums.splice(lookForMatch, 1);
                }
            }

            return this.shuffleAndExpand(basicProblemSet);
        },
        getDivision: function(tempNums, drillArray) {
            var basicProblemSet = [];
            var dividend;

            /*
             * Loops cycle through array values to create an array of
             * division problems.
             * Note that the 'tempNum' values are assigned to the RESULT
             * (quotient) of the division problem, and the 'drillArray'
             * values are the divisors. The top number in the division
             * problem (the dividend) is the product of the 'tempNum' and
             * 'drillArray' values. (example: if tempNum is 3 and
             * drillArray is 2, then problem will be
             * 6 divided by 2 = 3)
             */
            for (var j = (drillArray.length-1), m = 0; m <= j; j -= 1) {
                if (drillArray[j] === 0) continue;
                for (var i = (tempNums.length-1), l = 0; l <= i; i -= 1) {
                    dividend = drillArray[j] * tempNums[i];
                    basicProblemSet.push([dividend, drillArray[j],
                            tempNums[i]]);
                }
            }

            return this.shuffleAndExpand(basicProblemSet);
        },
        getProblemArray: function (newIndex) {
            var drillArray = [];
            var operator = this.operator;

            this.levelIndex = newIndex;

            // Use special array for division (excludes zero)
            if (this.opName === 'divide') {
                drillArray = this.drillRangeDiv[this.levelIndex];
            } else {
                drillArray = this.drillRange[this.levelIndex];
            }

            /*
             * Make a COPY of the numRange array (because it gets
             * modified in fcn calls below)
             */
            var tempNums = this.numRange.slice();

            /*
             * Clear problemSet array before creating new array
             * of problems; set index to 0
             */
            this.problemSet.length = 0;
            this.problemIndex = 0;

            if ((operator === '+') || (operator === '&times;')) {
                this.problemSet = this.getAddOrMult(tempNums, drillArray);
            } else if (operator === '-') {
                this.problemSet = this.getSubtraction(tempNums, drillArray);
            } else if (operator === '&divide;') {
                this.problemSet = this.getDivision(tempNums, drillArray);
            } else {
                alert('The operator "' + operator + '" is not valid.');
                return;
            }
        },
        getSubtraction: function(tempNums, drillArray) {
            var basicProblemSet = [];
            var minuend;

            /*
             * Loops cycle through array values to create an array of
             * subtraction problems.
             * Note that the 'tempNum' values are assigned to the RESULT
             * of the subtraction problem, and the 'drillArray' values
             * are what gets subtracted. The top number in the subtraction
             * problem (the minuend) is the SUM of the 'tempNum' and
             * 'drillArray' values.
             * (example: if tempNum is 3 and drillArray is 2, then
             * problem will be 5 - 2 = 3)
             */
            for (var j = (drillArray.length-1), m = 0; m <= j; j -= 1) {
                for (var i = (tempNums.length-1), l = 0; l <= i; i -= 1) {
                    minuend = drillArray[j] + tempNums[i];
                    basicProblemSet.push([minuend, drillArray[j],
                            tempNums[i]]);
                }
            }

            return this.shuffleAndExpand(basicProblemSet);
        },
        shuffleAndExpand: function(basicProblemSet) {
            var newProblems = [];
            var reshuffledSet = [];
            var ctr;

            // Shuffle basic problem set, to mixup order for display
            newProblems = _.shuffle(basicProblemSet);

            /*
             * Goals for problem sets:
             *      1) If there are 12 unique problems for a given level,
             *          display all 12 before any repeat problems.
             *      2) Instead of just repeating the problem set in same
             *         order, concat some shuffled arrays to the problem set.
             *          So 36 problems will cover each problem set of
             *          12 three times,
             *          but in a different order each round. (This issue
             *          is most noticeable to a user if # of unique problems
             *          is small - esp. for beginners working with just 0-5.)
             *      3) Prevent consecutive problems from being identical,
             *          which can happen if the first problem in the newly
             *          shuffled array matches the last problem in
             *          newProblems array. (so before concat. a shuffled
             *          array to newProblems, check if 1st element of
             *          shuffled array matches last element of newProblems. 
             *          If it does,
             *          push & shift shuffled array before concat.)
             */
            for (var i = 1; i < 4 ; i +=1 ) {
                ctr = newProblems.length;
                reshuffledSet = _.shuffle(basicProblemSet);

                /*
                 * To prevent the same problem appearing 2x in a row,
                 * check if last el of newProblems matches first
                 * el of shuffled set.
                 * If it matches, uses push & shift before concat.
                 */
                if ((newProblems[ctr-1][0] === reshuffledSet[0][0]) &&
                        (newProblems[ctr-1][1] === reshuffledSet[0][1])) {
                    reshuffledSet.push(reshuffledSet[0]);
                    reshuffledSet.shift();
                }

                newProblems = newProblems.concat(reshuffledSet);
            }

            /*
             * Now newProblems contains multiple sets of the basicProblemSet.
             * Check if last element matches first. If yes,
             * splice location of last element (-3). (If the user does
             * more problems than the length of the newProblems array,
             * the app will cycle through the array a second time -
             * so matching first & last elements would make the same problem
             * appear twice in a row.)
             */
            ctr = newProblems.length;
            if ((newProblems[ctr-1][0] === newProblems[0][0]) &&
                    (newProblems[ctr-1][1] === newProblems[0][1])) {
                newProblems.splice(-3,0,newProblems[ctr-1]);
                newProblems.splice(-1,1);
            }

            return newProblems;
        },
        setName: function(userName) {
            if (typeof(userName) !== 'undefined' && userName !== '') {
                this.user = userName;
            }
        },
        setProblemRanges: function(difficulty) {
            var results = this.results;

            this.diff = difficulty;

            /*
             * Get arrays used to generate problems
             * based on difficulty level user selected.
             */
            this.numRange = levelsInfo[difficulty].nums;
            this.drillRange = levelsInfo[difficulty].drills;
            this.labelRange = levelsInfo[difficulty].labels;            
            this.drillRangeDiv = levelsInfo[difficulty].drillsDiv;
            this.labelRangeDiv = levelsInfo[difficulty].labelsDiv;            
            
            // Define results object to track user's results
            results.add = new Results('+', this.drillRange, this.labelRange);
            results.subtract = new Results('-', this.drillRange,
                               this.labelRange);
            results.multiply = new Results('\xD7', this.drillRange,
                               this.labelRange);
            results.divide = new Results('\xF7', this.drillRangeDiv,
                             this.labelRangeDiv);
                        
            function Results(op, drRange, lblRange) {
                this.level = [];
                for(var i = 0, l = drRange.length; i < l; i++) {        
                    this.level[i] = {drillArray:[],label:'',
                                    practice:[0,0],timed:[],errors:[]};
                    this.level[i].drillArray = drRange[i];
                    this.level[i].label =  op + lblRange[i];
                }
            }
        }
    };
    return publicAPI;
})();
