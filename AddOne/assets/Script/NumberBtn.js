cc.Class({
    extends: cc.Component,

    properties: {
        currentNumber: 0,       // 当前数字
        row: -1,                 // 当前行
        col: -1,                  // 当前列
    },

    // 初始化
    init: function (row, col, bFirstInit) {
        this.node.opacity = 0;
        this.row = row;
        this.col = col;
        var x = (-2 + col) * this.node.width;
        var y;
        if (true === bFirstInit) {
            y = (2 - 0) * this.node.height;
        } else if (false === bFirstInit) {
            y = (3 - 0) * this.node.height;
        }
        this.node.setPosition(x, y);
        this.currentNumber = Math.floor(Math.random() * 5 + 1);
        this.updateSpriteFrame();

        //this.moveTo(row, col);
    },

    addOne: function () {
        this.currentNumber += 1;
        this.updateSpriteFrame();
    },

    // 按钮点击事件
    onBtnClicked: function () {
        this.addOne();
        // 发送事件
        var numberBtnClickedEvent = new cc.Event.EventCustom('NumberBtnClicked', true);
        numberBtnClickedEvent.setUserData([this.row, this.col]);
        this.node.dispatchEvent(numberBtnClickedEvent);
    },

    // 更新SpriteFrame
    updateSpriteFrame: function () {
        var imageNameNormal = 'el_' + this.currentNumber;
        var imageNamePressed = 'el_' + this.currentNumber + 'tap';

        // 加载 SpriteAtlas（图集），并且获取其中的一个 SpriteFrame
        // 注意 atlas 资源文件（plist）通常会和一个同名的图片文件（png）放在一个目录下, 所以需要在第二个参数指定资源类型
        var self = this;
        cc.loader.loadRes("Texture/tapmeSprites", cc.SpriteAtlas, function (err, atlas) {
            if (err) {
                cc.error(err.message || err);
                return;
            }

            var frameNormal = atlas.getSpriteFrame(imageNameNormal);
            var framePressed = atlas.getSpriteFrame(imageNamePressed);
            self.node.getComponent(cc.Button).normalSprite = frameNormal;
            self.node.getComponent(cc.Button).pressedSprite = framePressed;
        });
    },

    // 移动到特定的行和列
    moveTo: function (row, col, actionObjArr) {
        var x = (-2 + col) * this.node.width;
        var y = (2 - row) * this.node.height;
        this.node.stopActionByTag(1);

        var action = cc.spawn(cc.moveTo(0.3, x, y), cc.fadeIn(0.3));
        action.setTag(1);
        if (undefined !== actionObjArr) {
            actionObjArr.push([this.row, this.col, action]);
        } else {
            this.node.runAction(action);
        }
        this.row = row;
        this.col = col;
    },

    // use this for initialization
    onLoad: function () {

    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
