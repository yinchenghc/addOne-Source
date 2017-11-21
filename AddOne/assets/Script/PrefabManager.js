cc.Class({
    extends: cc.Component,

    properties: {
        numberBtnPre: cc.Prefab,    // 按钮Prefab
        numberBtnLayer: cc.Node,    // 存放按钮的节点
        numberBtnArray: {        // 按钮数组
            default: null,
            type: Array
        },
        sameNumber: 0,      // 相同数字数量
    },

    init: function () {
        this.numberBtnArray = [
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ];

        // 定义方向
        this.Directions = {
            Up: 'Up',
            Down: 'Down',
            Left: 'Left',
            Right: 'Right',
            None: 'None'
        };

        // 定义当前最大数字
        this.currentMaxNumber = 0;

        this.isGameOverorPause = false;

        this.numberBtnPool = new cc.NodePool();
        for (var i = 0; i < 25; i++) {
            this.numberBtnPool.put(cc.instantiate(this.numberBtnPre));
        }

        var actionObjArrNew = new Array();
        for (var i = 0; i < 25; ++i) {
            var row = parseInt(i / 5);
            var col = i % 5;
            this.addNumberBtn(row, col, actionObjArrNew, true);
        }
        actionObjArrNew.reverse();

        this.setLayerSystemsEventsEnable(false);
        this.processSynchAddBtnAction(actionObjArrNew, 0);
    },

    // 处理同步添加按钮操作
    processSynchAddBtnAction: function (actionObjArr, actionIndex) {
        if (actionIndex >= actionObjArr.length) {
            this.node.emit('AddNewBtnFinished');
            // if (this.sameNumber < 3) {
            //     this.numberBtnLayer.resumeSystemEvents(true);

            //     // 发送事件
            //     var CheckProgressValueEvent = new cc.Event.EventCustom('CheckProgressValue', true);
            //     this.node.dispatchEvent(CheckProgressValueEvent);
            // }
            return;
        }

        var actionRow = actionObjArr[actionIndex][0];
        var actionCol = actionObjArr[actionIndex][1];

        var finished = cc.callFunc(function (target, data) {
            this.processSynchAddBtnAction(data[0], data[1]);
        }, this, [actionObjArr, actionIndex + 1]);

        var myAction = cc.spawn(actionObjArr[actionIndex][2], cc.sequence(cc.delayTime(0.2), finished));
        this.numberBtnArray[actionRow][actionCol].runAction(myAction);
    },

    // 添加按钮
    addNumberBtn: function (row, col, actionObjArr, bFirstInit) {
        var numberBtn = this.numberBtnPool.get();
        this.numberBtnLayer.addChild(numberBtn);

        numberBtn.getComponent("NumberBtn").init(row, col, bFirstInit);
        numberBtn.getComponent("NumberBtn").moveTo(row, col, actionObjArr);
        this.numberBtnArray[row][col] = numberBtn;

        // 更新最大数字
        var currentNumber = numberBtn.getComponent("NumberBtn").currentNumber;
        if (currentNumber > this.currentMaxNumber) {
            this.currentMaxNumber = currentNumber;
        }
    },

    // 处理移除动作
    processRemoveAction: function (row, col, actionObjArr, actionIndex) {
        if (actionIndex >= actionObjArr.length) {
            this.numberBtnArray[row][col].getComponent("NumberBtn").addOne();
            var currentNumber = this.numberBtnArray[row][col].getComponent("NumberBtn").currentNumber;
            // 更新最大数字
            if (currentNumber > this.currentMaxNumber) {
                this.currentMaxNumber = currentNumber;
            }
            // 发送事件
            var removeBtnFinishedEvent = new cc.Event.EventCustom('removeBtnFinished', true);
            removeBtnFinishedEvent.setUserData([currentNumber - 1, this.sameNumber]);
            this.node.dispatchEvent(removeBtnFinishedEvent);
            
            var actionObjArrNew = new Array();
            this.moveBtnDown(actionObjArrNew);
            this.processMoveBtnDownAction(actionObjArrNew, 0);
            return;
        }

        var actionRow = actionObjArr[actionIndex][0];
        var actionCol = actionObjArr[actionIndex][1];

        var finished1 = cc.callFunc(function (target, data) {
            this.numberBtnPool.put(this.numberBtnArray[data[0]][data[1]]);
            this.numberBtnArray[data[0]][data[1]] = null;
        }, this, [actionRow, actionCol]);

        var finished2 = cc.callFunc(function (target, data) {
            this.processRemoveAction(data[0], data[1], data[2], data[3]);
        }, this, [row, col, actionObjArr, actionIndex + 1]);

        var myAction = cc.sequence(actionObjArr[actionIndex][2], finished1, finished2);
        this.numberBtnArray[actionRow][actionCol].runAction(myAction);

    },

    // 处理添加按钮操作
    processAddBtnAction: function (actionObjArr, actionIndex) {
        if (actionIndex >= actionObjArr.length) {
            this.node.emit('AddNewBtnFinished');
            return;
        }

        var actionRow = actionObjArr[actionIndex][0];
        var actionCol = actionObjArr[actionIndex][1];

        var finished = cc.callFunc(function (target, data) {
            this.processAddBtnAction(data[0], data[1]);
        }, this, [actionObjArr, actionIndex + 1]);

        var myAction = cc.sequence(actionObjArr[actionIndex][2], finished);
        this.numberBtnArray[actionRow][actionCol].runAction(myAction);
    },

    // 清除所有匹配的按钮
    clearMatchingBtn: function () {
        var self = this;
        var scanedArr = new Array();
        for (var row = 0; row < this.numberBtnArray.length; ++row) {
            for (var col = 0; col < this.numberBtnArray[row].length; ++col) {
                var btnArray = [
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0]
                ];
                this.sameNumber = 1;
                var currentNumber = this.numberBtnArray[row][col].getComponent("NumberBtn").currentNumber;
                this.scanBtn(row, col, currentNumber, this.Directions.None, scanedArr, btnArray);
                if (this.sameNumber >= 3) {
                    var actionObjArr = new Array();
                    this.removeBtn(row, col, this.Directions.None, btnArray, actionObjArr);
                    this.processRemoveAction(row, col, actionObjArr, 0);
                    break;
                }
            }
            if (this.sameNumber >= 3) {
                break;
            }
        }
        if (this.sameNumber < 3 && !this.isGameOverorPause) {
            this.setLayerSystemsEventsEnable(true);           
        }
    },

    arrDeepCopy: function (source) {
        var sourceCopy = [];
        for (var item in source) sourceCopy[item] = typeof source[item] === 'object' ? this.arrDeepCopy(source[item]) : source[item];
        return sourceCopy;
    },

    // 处理按钮发来的事件
    onNumberBtnClicked: function (row, col) {
        var self = this;
        cc.log("onNumberBtnClicked", [row, col]);

        // 发送事件
        var numberBtnClickedEvent = new cc.Event.EventCustom('NumberBtnClicked', true);
        this.node.dispatchEvent(numberBtnClickedEvent);

        this.sameNumber = 1;
        var currentNumber = this.numberBtnArray[row][col].getComponent("NumberBtn").currentNumber;
        // 更新最大数字
        if (currentNumber > this.currentMaxNumber) {
            this.currentMaxNumber = currentNumber;
        }

        var btnArray = [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ];
        this.scanBtn(row, col, currentNumber, this.Directions.None, new Array(), btnArray);

        if (this.sameNumber >= 3) {
            this.setLayerSystemsEventsEnable(false);
            var actionObjArr = new Array();
            this.removeBtn(row, col, this.Directions.None, btnArray, actionObjArr);
            this.processRemoveAction(row, col, actionObjArr, 0);
        } else {
            // 发送事件
            var CheckProgressValueEvent = new cc.Event.EventCustom('CheckProgressValue', true);
            this.node.dispatchEvent(CheckProgressValueEvent);
        }

    },

    operateFun: function (actionObjArr) {
        for (var row = 0; row < this.numberBtnArray.length; ++row) {
            for (var col = 0; col < this.numberBtnArray[row].length; ++col) {
                if (null == this.numberBtnArray[row][col]) {
                    this.addNumberBtn(row, col, actionObjArr, false);
                }
            }
        }
        // for (var rowTotal = this.numberBtnArray.length - 1; rowTotal >= 0; --rowTotal) {
        //     for (var colTotal = this.numberBtnArray[rowTotal].length - 1; colTotal >= 0; --colTotal) {
        //         if (null == this.numberBtnArray[rowTotal][colTotal]) {
        //             this.addNumberBtn(rowTotal, colTotal, actionObjArr);
        //         }
        //     }
        // }
    },

    /**
     * 
     * 
     * @param {any} row 
     * @param {any} col 
     * @param {any} scanNumber 
     * @param {any} direction 传进来按钮相对于现在按钮的方向
     * @param {any} scanedArr 已扫描过的按钮数组
     * @param {any} btnArray 储存扫描结果的数组
     * @returns 
     */
    scanBtn: function (row, col, scanNumber, direction, scanedArr, btnArray) {

        // 是否已经扫描过
        if (-1 == scanedArr.indexOf(row + "-" + col)) {
            scanedArr.push(row + "-" + col);
        } else {
            return;
        }

        // 向下查找
        if (this.Directions.Down !== direction
            && row < this.numberBtnArray.length - 1
            && -1 === scanedArr.indexOf((row + 1) + "-" + col)) {
            var currentNumber = this.numberBtnArray[row + 1][col].getComponent("NumberBtn").currentNumber;
            if (currentNumber === scanNumber) {
                btnArray[row + 1][col] = 1;
                this.sameNumber += 1;
                this.scanBtn(row + 1, col, scanNumber, this.Directions.Up, scanedArr, btnArray);
            }
        }

        // 向右查找
        if (this.Directions.Right !== direction
            && col < this.numberBtnArray[row].length - 1
            && -1 === scanedArr.indexOf(row + "-" + (col + 1))) {
            var currentNumber = this.numberBtnArray[row][col + 1].getComponent("NumberBtn").currentNumber;
            if (currentNumber === scanNumber) {
                btnArray[row][col + 1] = 1;
                this.sameNumber += 1;
                this.scanBtn(row, col + 1, scanNumber, this.Directions.Left, scanedArr, btnArray);
            }
        }

        // 向左查找
        if (this.Directions.Left !== direction
            && col > 0
            && -1 === scanedArr.indexOf(row + "-" + (col - 1))) {
            var currentNumber = this.numberBtnArray[row][col - 1].getComponent("NumberBtn").currentNumber;
            if (currentNumber === scanNumber) {
                btnArray[row][col - 1] = 1;
                this.sameNumber += 1;
                this.scanBtn(row, col - 1, scanNumber, this.Directions.Right, scanedArr, btnArray);
            }
        }

        // 向上查找
        if (this.Directions.Up !== direction
            && row > 0
            && -1 === scanedArr.indexOf((row - 1) + "-" + col)) {
            var currentNumber = this.numberBtnArray[row - 1][col].getComponent("NumberBtn").currentNumber;
            if (currentNumber === scanNumber) {
                btnArray[row - 1][col] = 1;
                this.sameNumber += 1;
                this.scanBtn(row - 1, col, scanNumber, this.Directions.Down, scanedArr, btnArray);
            }
        }
    },

    removeBtn: function (row, col, direction, btnArray, actionObjArr) {
        // 向下查找
        if (this.Directions.Down !== direction && row < btnArray.length - 1) {
            if (1 === btnArray[row + 1][col]) {
                btnArray[row + 1][col] = 0;
                this.removeBtn(row + 1, col, this.Directions.Up, btnArray, actionObjArr);
            }
        }

        // 向右查找
        if (this.Directions.Right !== direction && col < btnArray[row].length - 1) {
            if (1 === btnArray[row][col + 1]) {
                btnArray[row][col + 1] = 0;
                this.removeBtn(row, col + 1, this.Directions.Left, btnArray, actionObjArr);
            }
        }

        // 向左查找
        if (this.Directions.Left !== direction && col > 0) {
            if (1 === btnArray[row][col - 1]) {
                btnArray[row][col - 1] = 0;
                this.removeBtn(row, col - 1, this.Directions.Right, btnArray, actionObjArr);
            }
        }

        // 向上查找
        if (this.Directions.Up !== direction && row > 0) {
            if (1 === btnArray[row - 1][col]) {
                btnArray[row - 1][col] = 0;
                this.removeBtn(row - 1, col, this.Directions.Down, btnArray, actionObjArr);
            }
        }

        var rowTmp = row;
        var colTmp = col;
        switch (direction) {
            case this.Directions.Up:
                rowTmp -= 1;
                break;
            case this.Directions.Left:
                colTmp -= 1;
                break;
            case this.Directions.Right:
                colTmp += 1;
                break;
            case this.Directions.Down:
                rowTmp += 1;
                break;
            case this.Directions.None:
                break;
            default:
                break;
        }

        if (rowTmp === row && colTmp == col) {

        } else {
            this.numberBtnArray[row][col].getComponent("NumberBtn").moveTo(rowTmp, colTmp, actionObjArr);
            // this.numberBtnPool.put(this.numberBtnArray[row][col]);
            // this.numberBtnArray[row][col] = null;
        }

    },

    moveBtnDown: function (actionObjArr) {
        for (var row = this.numberBtnArray.length - 1; row >= 0; --row) {
            for (var col = this.numberBtnArray[row].length - 1; col >= 0; --col) {
                if (null != this.numberBtnArray[row][col]) {
                    var arr = [row, col];
                    this.scanMovePositon(arr);
                    if (arr[0] !== row) {
                        var actionArrTmp = new Array();
                        this.numberBtnArray[arr[0]][arr[1]] = this.numberBtnArray[row][col];
                        this.numberBtnArray[row][col] = null;
                        this.numberBtnArray[arr[0]][arr[1]].getComponent("NumberBtn").moveTo(arr[0], arr[1], actionArrTmp);
                        actionObjArr.push([arr[0], arr[1], actionArrTmp[0][2]]);
                    }
                }
            }
        }

        // for(var actionIndex = 0; actionIndex < actionObjArr.length; ++actionIndex) {
        //     var row = actionObjArr[actionIndex][0];
        //     var col = actionObjArr[actionIndex][1];
        //     this.numberBtnArray[row][col].runAction(actionObjArr[actionIndex][2]);
        // }
    },

    // 处理按钮向下移操作
    processMoveBtnDownAction: function (actionObjArr, actionIndex) {
        if (actionIndex >= actionObjArr.length) {
            var actionObjArrNew = new Array();
            this.operateFun(actionObjArrNew);
            actionObjArrNew.reverse();
            this.processSynchAddBtnAction(actionObjArrNew, 0);
            return;
        }

        var actionRow = actionObjArr[actionIndex][0];
        var actionCol = actionObjArr[actionIndex][1];

        var finished = cc.callFunc(function (target, data) {
            this.processMoveBtnDownAction(data[0], data[1]);
        }, this, [actionObjArr, actionIndex + 1]);

        var myAction = cc.sequence(actionObjArr[actionIndex][2], finished);
        this.numberBtnArray[actionRow][actionCol].runAction(myAction);
    },

    scanMovePositon(arr) {
        if (arr[0] + 1 < this.numberBtnArray.length) {
            if (null == this.numberBtnArray[arr[0] + 1][arr[1]]) {
                arr[0] += 1;
                this.scanMovePositon(arr);
            } else {
                return;
            }
        }
    },

    setGameEnable: function (bEnable) {
        this.isGameOverorPause = !bEnable;
        this.setLayerSystemsEventsEnable(bEnable);
    },

    setLayerSystemsEventsEnable: function (bEnable) {
        if (bEnable) {
            this.numberBtnLayer.resumeSystemEvents(true);
        } else {

            // 暂停当前节点上注册的所有节点系统事件
            this.numberBtnLayer.pauseSystemEvents(true);
        }
    },

    // use this for initialization
    onLoad: function () {
        // 监听按钮发来的事件
        var self = this;
        this.numberBtnLayer.on('NumberBtnClicked', function (event) {
            event.stopPropagation();        // 中断处理
            var data = event.getUserData();

            if (data instanceof Array) {
                self.onNumberBtnClicked(data[0], data[1]);
            }
        });

        // 添加按钮完成事件
        this.node.on('AddNewBtnFinished', function (event) {
            self.clearMatchingBtn();
        });

        //this.clearMatchingBtn();
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
