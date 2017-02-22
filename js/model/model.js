FMF = window.FMF || {};

FMF.model = (function() {
    'use strict';

    var template = FMF.template;
    var levels = []; 

    /*
     * There are three DIFFICULTY levels: Level 1 uses 0-5,
     * Level 2 uses 1-10 and Level 3 uses 1-12 to create
     * addition, subtraction, multiplication & division
     * problems.
     *
     * 'levels' is an array of info for each level
     * It includes the following properties:
     *      nums: an array of #s used for level 
     *      drills: array of arrays - used to generate various problem sets
     *      drillsDiv: similar to drills, but excludes zero 
     *      labels: strings for each level - used in menu
     *      labelsDiv: similar to labels, but excludes zero 
     */
    
    levels[0] = getLevels(0, 5);
    levels[1] = getLevels(1, 10);
    levels[2] = getLevels(1, 12);
    
    function getLevels(start, end) {
        var nums = getNums(start, end);
        var drills = getDrills (start, end, nums);
        var labels = getLabels(start, end);
                    
        return {nums: nums, 
                drills: drills, 
                drillsDiv: (start === 0) ? getDrills (1, end, getNums(1, end)) : drills, 
                labels: labels, 
                labelsDiv: (start === 0) ? getLabels(1, end) : labels
               };
        
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
        drills: [],    //Set in model.setProblemRanges
        drillsDiv: [],    //Set in model.setProblemRanges
        labels: [],    //Set in model.setProblemRanges
        labelsDiv: [],    //Set in model.setProblemRanges
        levelIndex: 0,      // Set in controller.handleChangeLevel and in model.updateLevelMenu
        nums: [],    //Set in model.setProblemRanges
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
            lblArray = this.labels;

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
                    lblArray = this.labelsDiv;
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

                // Default to first level
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
             * error. (also highlight errors if practice session)
             */
            if (answer !== correctAns) {

                // Add error array to results
                result.errors.push([topVal, bottomVal, answer, correctAns]);

                // If practice, add 'error' class to highlight error
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
        getAddOrMult: function(tempNums, drills) {
            var basicProbs = [];
            var operator = this.operator;
            var answer;
            var a;
            var b;

            /*
             * Loops cycle through array values to create an array of
             * addition or multiplication problems (depending on 
             * value of 'operator').
             * Note that at this stage duplicate problems are excluded
             * (array will not contain BOTH 4 + 5 = 9 and 5 + 4 = 9).
             */
            for (var j = (drills.length-1), m = 0; m <= j; j -= 1) {
                a = drills[j];
                
                for (var i = (tempNums.length-1), l = 0; l <= i; i -= 1) {
                    b = tempNums[i];
                    
                    answer = (operator === '+') ? (
                            a + b
                        ) : (
                            a * b
                        );

                    // Randomize the order of the addends/factors for display purposes
                    (Math.floor(Math.random()*2)) ? (
                        basicProbs.push([a, b, answer])
                    ) : (
                        basicProbs.push([b, a, answer])
                    );                    
                }

                /*
                 * If the value drills[j] is also in tempNums,
                 * splice it out of tempNums
                 * to avoid creating duplicate problems
                 */
                var lookForMatch = tempNums.indexOf(a);

                if (lookForMatch !== -1) {
                    tempNums.splice(lookForMatch, 1);
                }
            }

            return this.shuffleAndExpand(basicProbs);
        },
        getDivision: function(tempNums, drills) {
            var basicProbs = [];
            var dividend;
            var a;
            var b;

            /*
             * Loops cycle through array values to create an array of
             * division problems.
             * Note that the 'tempNum' values are assigned to the RESULT
             * (quotient) of the division problem, and the 'drills'
             * values are the divisors. The top number in the division
             * problem (the dividend) is the product of the 'tempNum' and
             * 'drills' values. (example: if tempNum is 3 and
             * drills is 2, then problem will be
             * 6 divided by 2 = 3)
             */
            for (var j = (drills.length-1), m = 0; m <= j; j -= 1) {
                a = drills[j];
                //if (drills[j] === 0) continue;
                
                for (var i = (tempNums.length-1), l = 0; l <= i; i -= 1) {
                    b = tempNums[i];
                    dividend = a * b;
                    basicProbs.push([dividend, a, b]);
                }
            }

            return this.shuffleAndExpand(basicProbs);
        },
        getProblemArray: function (newIndex) {
            var drills = [];
            var operator = this.operator;

            this.levelIndex = newIndex;

            // Use special array for division (excludes zero)
            drills = (this.opName === 'divide') ? (
                    this.drillsDiv[this.levelIndex]
                ) : (
                    this.drills[this.levelIndex]
            );

            /*
             * Make a COPY of the nums array (because it gets
             * modified in fcn calls below)
             */
            var tempNums = this.nums.slice();

            /*
             * Clear problemSet array before creating new array
             * of problems; set index to 0
             */
            this.problemSet.length = 0;
            this.problemIndex = 0;

            switch (operator) {
                case '+':
                case '&times;':
                    this.problemSet = this.getAddOrMult(tempNums, drills);
                    break;
                case '-':
                    this.problemSet = this.getSubtraction(tempNums, drills);
                    break;
                case '&divide;':
                    this.problemSet = this.getDivision(tempNums, drills);
                    break;
                default:
                    alert('The operator "' + operator + '" is not valid.');
            }
        },
        getSubtraction: function(tempNums, drills) {
            var basicProbs = [];
            var minuend;
            var a;
            var b;

            /*
             * Loops cycle through array values to create an array of
             * subtraction problems.
             * Note that the 'tempNum' values are assigned to the RESULT
             * of the subtraction problem, and the 'drills' values
             * are what gets subtracted. The top number in the subtraction
             * problem (the minuend) is the SUM of the 'tempNum' and
             * 'drills' values.
             * (example: if tempNum is 3 and drills is 2, then
             * problem will be 5 - 2 = 3)
             */
            for (var j = (drills.length-1), m = 0; m <= j; j -= 1) {
                a = drills[j];
                
                for (var i = (tempNums.length-1), l = 0; l <= i; i -= 1) {
                    b = tempNums[i];
                    minuend = a + b;
                    basicProbs.push([minuend, a,
                            b]);
                }
            }

            return this.shuffleAndExpand(basicProbs);
        },
        shuffleAndExpand: function(basicProbs) {
            var probs = [];
            var shuffle = [];
            var ctr;

            // Shuffle basic problem set, to mixup order for display
            probs = _.shuffle(basicProbs);

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
             *          probs array. (so before concat. a shuffled
             *          array to probs, check if 1st element of
             *          shuffled array matches last element of probs. 
             *          If it does,
             *          push & shift shuffled array before concat.)
             */
            for (var i = 1; i < 4 ; i +=1 ) {
                ctr = probs.length;
                shuffle = _.shuffle(basicProbs);

                /*
                 * To prevent the same problem appearing 2x in a row,
                 * check if last el of probs matches first
                 * el of shuffled set.
                 * If it matches, uses push & shift before concat.
                 */
                if ((probs[ctr-1][0] === shuffle[0][0]) &&
                        (probs[ctr-1][1] === shuffle[0][1])) {
                    shuffle.push(shuffle[0]);
                    shuffle.shift();
                }

                probs = probs.concat(shuffle);
            }

            /*
             * Now probs contains 4 shuffled sets of the basicProbs.
             * Check if last element matches first. If yes,
             * splice location of last element (-3) so that no
             * consecutive problems are identical
             */
            ctr = probs.length;
            if ((probs[ctr-1][0] === probs[0][0]) &&
                    (probs[ctr-1][1] === probs[0][1])) {
                probs.splice(-3,0,probs[ctr-1]);
                probs.splice(-1,1);
            }

            return probs;
        },
        setName: function(userName) {
            if (typeof(userName) !== 'undefined' && userName !== '') {
                this.user = userName;
            }
        },
        setProblemRanges: function(diff) {
            var results = this.results;

            this.diff = diff;

            /*
             * Get arrays used to generate problems
             * based on difficulty level user selected.
             */
            this.nums = levels[diff].nums;
            this.drills = levels[diff].drills;
            this.labels = levels[diff].labels;            
            this.drillsDiv = levels[diff].drillsDiv;
            this.labelsDiv = levels[diff].labelsDiv;            
            
            // Define results object to track user's results
            results.add = new Results('+', this.drills, this.labels);
            results.subtract = new Results('-', this.drills, this.labels);
            results.multiply = new Results('\xD7', this.drills, this.labels);
            results.divide = new Results('\xF7', this.drillsDiv, this.labelsDiv);
                        
            function Results(op, drills, labels) {
                this.level = [];
                for(var i = 0, l = drills.length; i < l; i++) {        
                    this.level[i] = {drills: drills[i],
                                     label: op + labels[i],
                                     practice: [0,0],
                                     timed: [],
                                     errors: []};
                }
            }
        }
    };
    return publicAPI;
})();
