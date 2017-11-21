cc.Class({
    extends: cc.Component,

    properties: {
        btnVoice: cc.Node,
        gameBgAudio: cc.AudioClip, //-- 获取背景音效
        highestRecord: cc.Label,
    },

    // use this for initialization
    onLoad: function () {
        // 分数
        this.highestRecord.string = cc.find("Record").getComponent("Record").bestScore;


        // 声音状态
        this.bIsVoiceOpen = cc.sys.localStorage.getItem("voiceStatus");
        if ('true' === this.bIsVoiceOpen) {
            this.bIsVoiceOpen = true;
        } else if ('false' === this.bIsVoiceOpen) {
            this.bIsVoiceOpen = false;
        } else {
            this.bIsVoiceOpen = true;
        }

        this.updateBtnVoicePic();
    },

    onBtnStartClicked() {
        cc.director.loadScene("GameScene");
    },

    onBtnVoiceClikced() {
        this.bIsVoiceOpen = !this.bIsVoiceOpen;

        this.updateBtnVoicePic();

        cc.sys.localStorage.setItem('voiceStatus', this.bIsVoiceOpen);
    },

    updateBtnVoicePic: function () {
        var imageNameNormal;
        var imageNamePressed;
        if (this.bIsVoiceOpen) {
            this.BgAudioID = cc.audioEngine.play(this.gameBgAudio,true);
            imageNameNormal = "soundoff";
            imageNamePressed = "soundoffp";
        } else {
            cc.audioEngine.stop(this.BgAudioID);
            imageNameNormal = "soundon";
            imageNamePressed = "soundonp";
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
            var framePressed = atlas.getSpriteFrame(imageNamePressed);
            self.btnVoice.getComponent(cc.Button).normalSprite = frameNormal;
            self.btnVoice.getComponent(cc.Button).pressedSprite = framePressed;
        });
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
