const _app = {
    gridSize: 10,
    serverAddress: "ws://127.0.0.1:8086",
}

_app.clearGameBoard = () => {
    if (_app.yourShips) {
        _app.yourShips.length = 0;
        _app.drawShips();
    }

    if (_app.yourShots) {
        _app.yourShots.length = 0;
        _app.drawPlayerShots();
    }

    if (_app.enemyShots) {
        _app.enemyShots.length = 0;
        _app.drawEnemyShots();
    }
}

_app.createShipNode = (width, height, x, y) => {
    const shipNode = document.createElement("div");
    shipNode.classList.add("ship");
    shipNode.style.setProperty("--height", height);
    shipNode.style.setProperty("--width", width);
    shipNode.style.setProperty("--pos-x", x);
    shipNode.style.setProperty("--pos-y", y);
    return shipNode;
}

_app.drawGrid = (container, size = 10) => {
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const newCell = document.createElement("div");
            newCell.classList.add("game-cell");
            newCell.dataset.x = x;
            newCell.dataset.y = y;
            container.appendChild(newCell);
        }
    }
}

_app.drawShips = () => {
    const ships = _app.localGameBoard.querySelectorAll(".ship.placed");
    
    ships.forEach(item => {
        _app.localGameBoard.removeChild(item);
    });

    if (Array.isArray(_app.yourShips)) {
        _app.yourShips.forEach(item => {
            const shipNode = _app.createShipNode(item.width, item.height, item.x, item.y);
            shipNode.classList.add("placed");
            _app.localGameBoard.prepend(shipNode);
        });
    }
}

_app.drawEnemyShots = () => {
    const shots = _app.localGameBoard.querySelectorAll(".shots.enemy");

    shots.forEach(item => {
        _app.localGameBoard.removeChild(item);
    });

    if (Array.isArray(_app.enemyShots)) {
        _app.enemyShots.forEach(item => {
            const newShot = document.createElement("div");
            newShot.classList.add("shot");
            newShot.classList.add("enemy");
            newShot.style.setProperty("--pos-x", item.x);
            newShot.style.setProperty("--pos-y", item.y);
            _app.localGameBoard.appendChild(newShot);
        })
    }
}

_app.drawPlayerShots = () => {
    const shots = _app.remoteGameBoard.querySelectorAll(".shots.player");

    shots.forEach(item => {
        _app.remoteGameBoard.removeChild(item);
    });

    if (Array.isArray(_app.yourShots)) {
        _app.yourShots.forEach(item => {
            const newShot = document.createElement("div");
            newShot.classList.add("shot");
            newShot.classList.add("player");
            newShot.classList.toggle("hit", item.hit);
            newShot.style.setProperty("--pos-x", item.x);
            newShot.style.setProperty("--pos-y", item.y);
            _app.remoteGameBoard.appendChild(newShot);
        })
    }
}

_app.enterRoom = (roomId) => {
    if (_app.playerName && roomId) {
        _app.showJoinModal(false);
        _app.sendToServer({
            type: "enter-room",
            playerName: _app.playerName,
            roomId,
        });
        _app.updateQueryParameters("room", roomId);
    }
}

_app.gameOver = (winner) => {
    const youWin = winner === _app.playerName;
    const message = youWin ? "You win the Battle!" : "You lost the Battle... Try again.";

    _app.showMessage("Match over", message);
    console.log("Winner:", winner);
}

_app.hideShipCursor = () => {
    if (_app.shipCursor) {
        _app.shipCursor.classList.add("hidden");
    }
}

_app.localGameBoard_clickHandler = (event) => {
    if (event.target.classList.contains("game-cell")) {
        const x = parseInt(event.target.dataset.x);
        const y = parseInt(event.target.dataset.y);
        _app.placeShip(x, y);
    }
}

_app.localGameBoard_mouseoverHandler = (event) => {
    if (event.target.classList.contains("game-cell")) {
        if (_app.isInGame && !_app.allShipsPlaced) {
            const x = parseInt(event.target.dataset.x);
            const y = parseInt(event.target.dataset.y);
            _app.moveShipCursor(x, y);
        }
        else {
            _app.hideShipCursor();
        }
    }
}

_app.localGameBoard_mouseoutHandler = () => {
    _app.hideShipCursor();
}

_app.moveShipCursor = (x, y) => {
    if (_app.shipCursor) {
        _app.shipCursor.style.setProperty("--pos-x", x);
        _app.shipCursor.style.setProperty("--pos-y", y);
        _app.shipCursor.classList.remove("hidden");
    }
}

_app.moveShotPlaceholder = (x, y) => {
    if (_app.shotPlaceholder) {
        _app.shotPlaceholder.style.setProperty("--pos-x", x);
        _app.shotPlaceholder.style.setProperty("--pos-y", y);
        _app.shotPlaceholder.classList.toggle("hidden", !_app.isInGame || !_app.allShipsPlaced);
    }
}

_app.newShipCursor = (width, height) => {
    const shipNode = _app.createShipNode(width, height, 0, 0);
    shipNode.classList.add("hidden");

    if (_app.shipCursor) {
        _app.localGameBoard.removeChild(_app.shipCursor);
    }

    _app.shipCursor = shipNode;
    _app.localGameBoard.prepend(_app.shipCursor);
}

_app.placeShip = (x, y) => {
    if (_app.isInGame && _app.room) {
        _app.sendToServer({
            type: "place-ship",
            roomId: _app.room.roomId,
            pos: {x, y},
        });
    }
}

_app.quitRoom = () => {
    _app.signoutBtn.disabled = true;
    _app.sendToServer({ type: "quit-room" });
}

_app.readQueryParameters = () => {
    const urlParams = new URLSearchParams(document.location.search);

    if (urlParams.has("room")) {
        _app.queryRoomId = urlParams.get("room");
    }

    if (urlParams.has("uid")) {
        _app.queryUserId = urlParams.get("uid");
    }
}

_app.remoteGameBoard_clickHandler = (event) => {
    if (event.target !== _app.remoteGameBoard) {
        const x = parseInt(event.target.dataset.x);
        const y = parseInt(event.target.dataset.y);
        _app.sendShot(x, y);
    }
}

_app.remoteGameBoard_mouseoverHandler = (event) => {
    if (event.target.classList.contains("game-cell")) {
        const x = parseInt(event.target.dataset.x);
        const y = parseInt(event.target.dataset.y);
        _app.moveShotPlaceholder(x, y);
    }
}

_app.requestNewRoom = () => {
    if (_app.playerName) {
        _app.showJoinModal(false);
        _app.sendToServer({
            type: "create-room",
            playerName: _app.playerName,
        });
    }
}

_app.sendShot = (x, y) => {
    if (_app.isInGame && _app.room) {
        _app.sendToServer({
            type: "add-shot",
            roomId: _app.room.roomId,
            pos: {x, y},
        });
    }
}

_app.sendToServer = (data) => {
    if (_app.wsClient && _app.wsClient.readyState !== WebSocket.CLOSED) {
        _app.wsClient.send(JSON.stringify(data));
    }
    else {
        console.error("Connection error:", _app.wsClient);
    }
}

_app.setupWSS = () => {
    if (_app.serverAddress) {
        _app.wsClient = new WebSocket(_app.serverAddress);
        _app.wsClient.addEventListener("message", _app.wsClient_messageHandler);
    }
}

_app.setupJoinModal = () => {
    if (_app.joinModal) {
        const joinForm = _app.joinModal.querySelector("form");
        const newRoomBtn = _app.joinModal.querySelector(".newroom-btn");
        _app.joinMessage = _app.joinModal.querySelector(".message");

        if (joinForm.roomId && _app.queryRoomId) {
            joinForm.roomId.value = _app.queryRoomId;
        }

        joinForm?.addEventListener("submit", (event) => {
            event.preventDefault();

            if (joinForm.playerName && joinForm.roomId) {
                _app.playerName = joinForm.playerName.value;
                _app.enterRoom(joinForm.roomId.value);
            }
        });

        newRoomBtn?.addEventListener("click", () => {
            if (joinForm.playerName) {
                _app.playerName = joinForm.playerName.value;
                _app.requestNewRoom();
            }
        });
    }
}

_app.showJoinModal = (show = true, message) => {
    if (_app.joinModal) {
        if (show) {
            _app.joinModal.classList.remove("hidden");

            if (_app.joinMessage) {
                _app.joinMessage.innerText = message ?? "";
                _app.joinMessage.classList.toggle("hidden", !message);
            }
        }
        else {
            _app.joinModal.classList.add("hidden");
            
            if (_app.joinMessage) {
                _app.joinMessage.classList.add("hidden");
            }
        }
    }
}

_app.showMessage = (title, message) => {
    if (_app.dialogModal) {
        const h2 = _app.dialogModal.querySelector("h2");
        const p = _app.dialogModal.querySelector("p");
        const closeBtn = _app.dialogModal.querySelector(".close-btn");

        if (h2) {
            h2.innerText = title;
        }

        if (p) {
            p.innerText = message;
        }

        closeBtn?.addEventListener("click", () => _app.dialogModal.close(), { once: true });
        _app.dialogModal.show();
    }

    console.log(title, message);
}

_app.signoutBtn_clickHandler = () => {
    if (_app.isInGame && !_app.signoutBtn.disabled) {
        _app.quitRoom();
    }
}

_app.startGame = () => {
    _app.isInGame = true;
    _app.signoutBtn.disabled = false;
}

_app.startUp = () => {
    _app.joinModal = document.querySelector(".join-modal");
    _app.statusDisplay = document.querySelector(".game-status");
    _app.signoutBtn = document.querySelector(".signout-btn");
    _app.localGameBoard = document.querySelector(".game-board.local-board");
    _app.remoteGameBoard = document.querySelector(".game-board.remote-board");
    _app.shotPlaceholder = document.querySelector(".shot[data-placeholder]");
    _app.dialogModal = document.querySelector(".dialog");
    
    _app.signoutBtn?.addEventListener("click", _app.signoutBtn_clickHandler);

    if (_app.localGameBoard) {
        _app.drawGrid(_app.localGameBoard, _app.gridSize);
        _app.localGameBoard.addEventListener("click", _app.localGameBoard_clickHandler);
        _app.localGameBoard.addEventListener("mouseover", _app.localGameBoard_mouseoverHandler);
        _app.localGameBoard.addEventListener("mouseout", _app.localGameBoard_mouseoutHandler);
    }

    if (_app.remoteGameBoard) {
        _app.drawGrid(_app.remoteGameBoard, _app.gridSize);
        _app.remoteGameBoard.addEventListener("click", _app.remoteGameBoard_clickHandler);
        _app.remoteGameBoard.addEventListener("mouseover", _app.remoteGameBoard_mouseoverHandler);
    }
    
    _app.readQueryParameters();
    _app.setupWSS();
    _app.setupJoinModal();
    _app.showJoinModal(true);
    _app.updateStatusDisplay();
}

_app.stopGame = () => {
    _app.room = null;
    _app.isInGame = false;
    _app.signoutBtn.disabled = true;
    _app.showJoinModal(true);
    _app.updateStatusDisplay();
}

_app.updateStatusDisplay = () => {
    if (_app.statusDisplay) {
        let htmlOut = "";

        if (_app.room) {
            const players = _app.room.players;
            const rid = `${_app.room.roomId}`;
            const pl1 = players[0]?.name ? `Player 1: ${players[0].name}` : "<i>Waiting player 1</i>";
            const pl2 = players[1]?.name ? `Player 2: ${players[1].name}` : "<i>Waiting player 2</i>";
            htmlOut += `<b>Room:</b> ${rid} - ${pl1} - ${pl2}`;
        }
        else {
            htmlOut += "<b>Ship Battle:</b> Enter a room code or create a new room to play";
        }

        _app.statusDisplay.innerHTML = htmlOut;
    }
}

_app.updateQueryParameters = (key, value) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.pushState({ path: url.href }, '', url.href);
}

_app.updateRoom = (data) => {
    const nextShip = data.ship;
    const playersReady = data.room.players[0]?.ready && data.room.players[1]?.ready;
    const firstPlayer = data.room.players[0].name === _app.playerName;
    
    _app.room = data.room;
    _app.yourShips = data.yourShips;
    _app.allShipsPlaced = data.allShipsPlaced;
    _app.isYourTurn = data.isYourTurn;
    _app.enemyShots = data.room.players[firstPlayer ? 1 : 0].shots;
    _app.yourShots = data.room.players[firstPlayer ? 0 : 1].shots;
    
    _app.remoteGameBoard.classList.toggle("disabled", !playersReady || !_app.isYourTurn);
    
    _app.newShipCursor(nextShip.width, nextShip.height);
    _app.drawShips();
    _app.drawEnemyShots();
    _app.drawPlayerShots();
    _app.updateStatusDisplay();

    if (data.room.gameOver) {
        _app.quitRoom();
    }
}

_app.wsClient_messageHandler = (event) => {
    const messageData = JSON.parse(event.data);

    switch (messageData.type) {
        case "game-over":
            _app.gameOver(messageData.winner);
            break;
        case "room-created":
            _app.enterRoom(messageData.roomId);
            break;
        case "room-error":
            _app.showJoinModal(true);
            _app.showMessage("Error", messageData.message);
            break;
        case "room-update":
            _app.updateRoom(messageData);
            break;
        case "signin":
            _app.startGame();
            break;
        case "signout":
            _app.stopGame();
            break;
        default:
            console.log(messageData);
            break;
    }
}

_app.startUp();