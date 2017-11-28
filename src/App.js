import React, {Component} from "react"
import logo from "./logo.svg"
import "./App.css"
import socketio from "socket.io-client"

class App extends Component {
    constructor() {
        super()
        this.joinGame = this.joinGame.bind(this)
        this.createGame = this.createGame.bind(this)
        this.bid = this.bid.bind(this)
        this.check = this.check.bind(this)

        this.state = {
            socket: socketio.connect("wss://biddingtictactoe.herokuapp.com/"),
            inputGame: "",
            inputName: "",
            state: "lobby",
            myFiches: 100,
            enemyFiches: 100,
            inputBid: 0,
            playingState: "bidding",
            board: [["", "", ""], ["", "", ""], ["", "", ""]],
        }

        this.state.socket.on(
            "bids received",
            ({playing, bidO, bidX, newXFiches, newOFiches}) => {
                if (playing === this.state.playingAs) {
                    this.setState({
                        playingState: "check",
                        myFiches:
                            this.state.playingAs === "X"
                                ? newXFiches
                                : newOFiches,
                        enemyFiches:
                            this.state.playingAs === "O"
                                ? newXFiches
                                : newOFiches,
                    })
                } else {
                    this.setState({
                        playingState: "waiting",
                        myFiches:
                            this.state.playingAs === "X"
                                ? newXFiches
                                : newOFiches,
                        enemyFiches:
                            this.state.playingAs === "O"
                                ? newXFiches
                                : newOFiches,
                    })
                }
            }
        )
        this.state.socket.on("check received", (row, col, player) => {
            console.log("check received")
            this.setState(oldState => {
                let newBoard = oldState.board
                newBoard[row][col] = player
                return {board: newBoard}
            })
        })

        this.state.socket.on("game ended", result => {
            if (result === this.state.playingAs) {
                alert("you won")
            } else if (result === (this.state.playingAs === "X" ? "O" : "X")) {
                alert("you lost")
            } else if (result === "bidDraw") {
                alert("draw due to 5 even bids")
            } else if (result === "boardDraw") {
                alert("draw due to 0 remaining possible tris")
            }
        })

        this.state.socket.on("bids even", () => {
            console.log("even bids")
            alert("your bids were even")
        })
    }

    createGame() {
        this.state.socket.emit("new game", this.state.inputName)
        this.state.socket.on("created game", roomId =>
            this.setState({roomId, state: "waiting"})
        )

        this.state.socket.on("player found", name => {
            this.setState({state: "playing", playingAs: "O", otherName: name})
        })
    }

    joinGame() {
        this.setState({roomId: this.state.inputGame})
        this.state.socket.emit(
            "join game",
            this.state.inputGame,
            this.state.inputName
        )

        this.state.socket.on("joined game", name => {
            this.setState({state: "playing", playingAs: "X", otherName: name})
        })
    }

    bid() {
        this.state.socket.emit("bid", this.state.inputBid)
        this.setState({inputBid: 0, playingState: "waiting"})
    }

    check(row, col) {
        console.log("try check")
        if (this.state.playingState === "check") {
            console.log("checked")
            this.state.socket.emit("check", row, col)
        }
    }

    render() {
        let core = null
        if (this.state.state === "lobby") {
            core = (
                <div>
                    My name is
                    <input
                        onChange={e =>
                            this.setState({inputName: e.target.value})
                        }
                        value={this.state.inputName}
                    />
                    <br />
                    <button onClick={this.createGame}>Create game</button>
                    <br />
                    <input
                        onChange={e =>
                            this.setState({inputGame: e.target.value})
                        }
                        value={this.state.inputGame}
                    />
                    <button onClick={this.joinGame}>Join Game</button>
                </div>
            )
        } else if (this.state.state === "waiting") {
            core = <div>YOU ARE IN ROOM {this.state.roomId}</div>
        } else if (this.state.state === "playing") {
            core = (
                <div>
                    your enemy is {this.state.otherName}
                    <br />my fiches {this.state.myFiches}
                    <br />enemy fiches {this.state.enemyFiches}
                    <br />
                    {this.state.playingState}
                    <br />
                    <div className="board">
                        {[].concat.apply(
                            [],
                            this.state.board.map((row, i) =>
                                row.map((cell, j) => (
                                    <div
                                        key={[i, j]}
                                        className="cell"
                                        onClick={() => this.check(i, j)}
                                    >
                                        {cell}
                                    </div>
                                ))
                            )
                        )}
                    </div>
                    <input
                        type="number"
                        min={0}
                        max={this.state.myFiches}
                        onChange={e =>
                            this.setState({inputBid: e.target.value})
                        }
                        value={this.state.inputBid}
                    />
                    <button onClick={this.bid}>Bid!</button>
                </div>
            )
        }
        return (
            <div className="App">
                Tic tac toe<br />
                {core}
            </div>
        )
    }
}

export default App
