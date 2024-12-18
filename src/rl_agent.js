function RLAgent() {
    this.qTable = {};
    this.learningRate = 0.1;
    this.discountFactor = 0.9;
    this.explorationRate = 1.0;
    this.explorationDecay = 0.995;
    this.minExplorationRate = 0.01;

    this.getAction = function(state) {
        if (Math.random() < this.explorationRate) {
            return Math.floor(Math.random() * 4); // 隨機選擇行動
        } else {
            return this.getBestAction(state);
        }
    };

    this.getBestAction = function(state) {
        if (!this.qTable[state]) {
            this.qTable[state] = [0, 0, 0, 0]; // 初始化 Q 值
        }
        return this.qTable[state].indexOf(Math.max(...this.qTable[state]));
    };

    this.updateQValue = function(state, action, reward, nextState) {
        if (!this.qTable[state]) {
            this.qTable[state] = [0, 0, 0, 0];
        }
        if (!this.qTable[nextState]) {
            this.qTable[nextState] = [0, 0, 0, 0];
        }

        const currentQ = this.qTable[state][action];
        const maxNextQ = Math.max(...this.qTable[nextState]);
        const newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);
        this.qTable[state][action] = newQ;
    };

    this.decayExploration = function() {
        if (this.explorationRate > this.minExplorationRate) {
            this.explorationRate *= this.explorationDecay;
        }
    };
}

const agent = new RLAgent();