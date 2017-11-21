cc.Class({
    extends: cc.Component,

    properties: {
        bestScore: 0,
    },

    // use this for initialization
    onLoad: function () {
        // 常驻节点
        cc.game.addPersistRootNode(this.node);

        var bestScore = cc.sys.localStorage.getItem("bestScore");
        if(bestScore){
            this.bestScore = bestScore;
        }
    },

    updateScore: function(score){
        if(score > this.bestScore){
            this.bestScore = score;
            this.save();
        }
    },

    save: function(){
        cc.sys.localStorage.setItem('bestScore', this.bestScore);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
