var PrefabManager = require("PrefabManager");

cc.Class({
    extends: cc.Component,

    properties: {
        prefabManager: PrefabManager,
        powerProgressBar: cc.Node,    // 进度条
        gameOverMask: cc.Node,         // 游戏结束菜单背景
        gameOverMenu: cc.Node,         // 游戏结束菜单
        gamePauseMenu: cc.Node,             //游戏暂停菜单
        currentRecord: cc.Label,        //当前分数
        overRecord: cc.Label,        //结束分数
        highesRecord: cc.Label,        //最高分数
    },

    // 处理按钮发来的事件
    onNumberBtnClicked: function () {
        this.setProgressBar(0.2);
    },

    onRemoveBtnFinished: function (data) {
        this.setProgressBar(-0.2);
        this.updateCurrentRecord(data[0] * data[1] * 10);
    },

    // use this for initialization
    onLoad: function () {
        // 监听按钮发来的事件
        var self = this;
        this.prefabManager.node.on('NumberBtnClicked', function (event) {
            event.stopPropagation();        // 中断处理

            self.onNumberBtnClicked();
        });

        this.prefabManager.node.on('removeBtnFinished', function (event) {
            event.stopPropagation();        // 中断处理
            var data = event.getUserData();

            self.onRemoveBtnFinished(data);
        });

        this.prefabManager.node.on('CheckProgressValue', function (event) {
            event.stopPropagation();        // 中断处理

            self.checkProgressValue();
        });

        this.score = 0;

        var bestScore = cc.sys.localStorage.getItem("bestScore");
        if(bestScore){
            this.highesRecord.string = bestScore;
        }

        this.prefabManager.init();
    },

    checkProgressValue: function() {
        var result = this.powerProgressBar.getComponent(cc.ProgressBar).progress;
        if (result === 1) {
            this.stopGame();
        }
    },

    setProgressBar: function (progress) {
        var result = this.powerProgressBar.getComponent(cc.ProgressBar).progress + progress;
        if (result < 0) {
            this.powerProgressBar.getComponent(cc.ProgressBar).progress = 0;
        } else if (result >= 1) {
            this.powerProgressBar.getComponent(cc.ProgressBar).progress = 1;
        } else {
            this.powerProgressBar.getComponent(cc.ProgressBar).progress += progress;
        }

        this.updateProgressBarColor();
    },

    //更新progress的颜色
    updateProgressBarColor: function() {
        var imageNameNormal;

        var result = this.powerProgressBar.getComponent(cc.ProgressBar).progress;
        if (result >= 0.8) {
            imageNameNormal = 'progressr';
        } else if (result >= 0.4) {
            imageNameNormal = 'progressy';
        } else {
            imageNameNormal = 'progress';
        }

        // 加载 SpriteAtlas（图集），并且获取其中的一个 SpriteFrame
        // 注意 atlas 资源文件（plist）通常会和一个同名的图片文件（png）放在一个目录下, 所以需要在第二个参数指定资源类型
        var self = this;
        cc.loader.loadRes("Texture/tapmeSprites", cc.SpriteAtlas, function (err, atlas) {
            if (err) {
                cc.error(err.message || err);
                return;
            }

            var frameNormal = atlas.getSpriteFrame(imageNameNormal);
            self.powerProgressBar.getComponent(cc.Sprite).spriteFrame = frameNormal;
        });
    },

    stopGame: function() {
        var imageNameNormal = 'el_' + this.prefabManager.currentMaxNumber;

        // 加载 SpriteAtlas（图集），并且获取其中的一个 SpriteFrame
        // 注意 atlas 资源文件（plist）通常会和一个同名的图片文件（png）放在一个目录下, 所以需要在第二个参数指定资源类型
        var self = this;
        cc.loader.loadRes("Texture/tapmeSprites", cc.SpriteAtlas, function (err, atlas) {
            if (err) {
                cc.error(err.message || err);
                return;
            }

            var frameNormal = atlas.getSpriteFrame(imageNameNormal);
            self.gameOverMenu.getChildByName("HigherstNumber").getComponent(cc.Sprite).spriteFrame = frameNormal;
        });

        this.gameOverMask.active = true;
        this.gameOverMenu.active = true;
        this.prefabManager.gameOver();

        this.overRecord.string = this.score;

        // 更新分数
        cc.find("Record").getComponent("Record").updateScore(this.score);
    },

    // 更新当前分数
    updateCurrentRecord(record) {
        this.score += record;
        if(this.score > parseInt(this.highesRecord.string)) {
            this.highesRecord.string = this.score;
        }
        this.processRecordIncreaseAction(record);
    },

    processRecordIncreaseAction(record) {
        if (record <= 0) {
            return;
        }

        var recordTmp = record - 1;

        var finished = cc.callFunc(function (target, data) {
            this.processRecordIncreaseAction(data);
        }, this, recordTmp);

        var action = cc.callFunc(function () {
            this.currentRecord.string = parseInt(this.currentRecord.string) + 1;
        }, this);

        var myAction = cc.sequence(action, cc.delayTime(0.0001), finished);
        this.node.runAction(myAction);
    },

    // 重新开始游戏
    restartGame: function() {
        cc.director.loadScene("GameScene");
    },

    // 回到开始界面
    returnStartScene: function() {
        cc.director.loadScene("StartScene");
    },

    // 暂停游戏
    pauseGame: function() {
        this.gameOverMask.active = true;
        this.gamePauseMenu.active = true;
        this.prefabManager.setGameEnable(false);
    },

    // 回到游戏界面
    returnGame: function() {
        this.gameOverMask.active = false;
        this.gamePauseMenu.active = false;
        this.prefabManager.setGameEnable(true);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
