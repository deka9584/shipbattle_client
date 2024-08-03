const _app = {
    // serverAddress: "ws://185.229.236.222:8086",
    serverAddress: "ws://127.0.0.1:8086",
    gridSize: 10,
};

_app.clearGameBoard = () => {
    if (_app.shipList) {
        _app.shipList.length = 0;
        _app.drawShips();
    }

    if (_app.player?.shots) {
        _app.player.shots.length = 0;
        _app.drawPlayerShots();
    }

    if (_app.enemy?.shots) {
        _app.enemy.shots.length = 0;
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
    const placedCells = container.querySelectorAll(".game-cell");
    placedCells.forEach(item => container.removeChild(item));

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
    const placedShips = _app.localGameBoard.querySelectorAll(".ship.placed");
    placedShips.forEach(item => _app.localGameBoard.removeChild(item));

    if (Array.isArray(_app.shipList)) {
        _app.shipList.forEach(item => {
            const shipNode = _app.createShipNode(item.width, item.height, item.x, item.y);
            shipNode.classList.add("placed");
            _app.localGameBoard.prepend(shipNode);
        });
    }
}

_app.drawEnemyShots = () => {
    const shots = _app.localGameBoard.querySelectorAll(".shot.enemy");
    shots.forEach(item => _app.localGameBoard.removeChild(item));

    if (Array.isArray(_app.enemy?.shots)) {
        _app.enemy.shots.forEach(item => {
            const newShot = document.createElement("div");
            newShot.classList.add("shot");
            newShot.classList.add("enemy");
            newShot.style.setProperty("--pos-x", item.x);
            newShot.style.setProperty("--pos-y", item.y);
            _app.localGameBoard.appendChild(newShot);
        });
    }
}

_app.drawPlayerShots = () => {
    const shots = _app.remoteGameBoard.querySelectorAll(".shot.player");
    shots.forEach(item => _app.remoteGameBoard.removeChild(item));

    if (Array.isArray(_app.player?.shots)) {
        _app.player.shots.forEach(item => {
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

_app.gameOver = (winner) => {
    const youWin = winner === _app.playerName;
    const message = youWin ? "You win the Battle!" : "You lost the Battle... Try again.";

    _app.showMessage("Match over", message);
    console.log("Winner:", winner);
}

_app.getHitCount = (index) => {
    const shots = _app.room?.players[index]?.shots;
    return Array.isArray(shots) ? shots.filter(s => s.hit).length : 0;
}

_app.join = (roomId) => {
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

_app.leave = () => {
    _app.sendToServer({ type: "quit-room" });
    _app.setSignoutBtnDisabled(true);
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
        const x = parseInt(event.target.dataset.x);
        const y = parseInt(event.target.dataset.y);
        _app.moveShipCursor(x, y);
    }
}

_app.localGameBoard_mouseoutHandler = () => {
    _app.shipCursor?.classList.add("hidden");
}

_app.moveShipCursor = (x, y) => {
    if (_app.shipCursor) {
        _app.shipCursor.style.setProperty("--pos-x", x);
        _app.shipCursor.style.setProperty("--pos-y", y);
        _app.shipCursor.classList.toggle("hidden", !_app.isInGame || _app.player?.ready);
    }
}

_app.moveShotPlaceholder = (x, y) => {
    if (_app.shotPlaceholder) {
        _app.shotPlaceholder.style.setProperty("--pos-x", x);
        _app.shotPlaceholder.style.setProperty("--pos-y", y);
        _app.shotPlaceholder.classList.toggle("hidden", !_app.isInGame || !_app.gameReady);
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

_app.newRoom = () => {
    if (_app.playerName) {
        _app.showJoinModal(false);
        _app.sendToServer({
            type: "create-room",
            playerName: _app.playerName,
        });
    }
}

_app.placeShip = (x, y) => {
    if (_app.isInGame && _app.room) {
        _app.sendToServer({
            type: "place-ship",
            pos: { x, y },
        });
    }
}

_app.readQueryParameters = () => {
    const urlParams = new URLSearchParams(document.location.search);

    if (urlParams.has("room")) {
        _app.queryRoomId = urlParams.get("room");
    }

    if (urlParams.has("chatId")) {
        _app.queryChatId = urlParams.get("chatId");
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

_app.remoteGameBoard_mouseoutHandler = () => {
    _app.shotPlaceholder?.classList.add("hidden");
}

_app.sendShot = (x, y) => {
    if (_app.isInGame && _app.room) {
        _app.sendToServer({
            type: "add-shot",
            pos: { x, y },
        });
    }
}

_app.sendToServer = (data) => {
    if (!_app.wsClient || _app.wsClient.readyState !== WebSocket.OPEN) {
        console.error("Connection error:", _app.wsClient);
        _app.showMessage("Connection lost", "You have lost connection to the server. Try to refresh the game.");
        _app.stopGame();
        _app.setupWSS();
        return;
    }

    _app.wsClient.send(JSON.stringify(data));
}

_app.setSignoutBtnDisabled = (disabled) => {
    if (_app.signoutBtn) {
        _app.signoutBtn.disabled = disabled;
        _app.signoutBtn.classList.toggle("hidden", disabled);
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

        if (joinForm && newRoomBtn) {
            const roomIdField = joinForm.elements["roomId"];
            const playerNameField = joinForm.elements["playerName"];

            if (roomIdField && _app.queryRoomId) {
                roomIdField.value = _app.queryRoomId;
            }

            joinForm.addEventListener("submit", (event) => {
                event.preventDefault();

                if (playerNameField && roomIdField) {
                    _app.playerName = playerNameField.value;
                    _app.join(roomIdField.value);
                }
            });

            newRoomBtn.addEventListener("click", () => {
                if (playerNameField) {
                    _app.playerName = playerNameField.value;
                    _app.newRoom();
                }
            });
        }
    }
}

_app.showJoinModal = (show = true) => {
    if (_app.joinModal) {
        _app.joinModal.classList.toggle("hidden", !show);
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
}

_app.signoutBtn_clickHandler = () => {
    if (_app.isInGame) {
        _app.leave();
    }
}

_app.startGame = () => {
    _app.isInGame = true;
    _app.setSignoutBtnDisabled(false);
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
        _app.remoteGameBoard.addEventListener("mouseout", _app.remoteGameBoard_mouseoutHandler);
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
    _app.setSignoutBtnDisabled(true);
    _app.showJoinModal(true);
    _app.updateStatusDisplay();
}

_app.updateStatusDisplay = () => {
    if (_app.statusDisplay) {
        let htmlOut = "";

        if (_app.room) {
            const players = _app.room.players;
            const rid = `${_app.room.roomId}`;
            const hc1 = `[<span class="hit-count">${_app.getHitCount(0)}</span>]`;
            const hc2 = `[<span class="hit-count">${_app.getHitCount(1)}</span>]`;
            const pl1 = players[0]?.name ? `${players[0].name} ${hc1}` : `<i class="waiting">Waiting</i>`;
            const pl2 = players[1]?.name ? `${players[1].name} ${hc2}` : `<i class="waiting">Waiting</i>`;
            htmlOut += `
                <b>Room:</b> <span class="room-id">${rid}</span> - 
                Player 1: <span class="player">${pl1}</span> -
                Player 2: <span class="player">${pl2}</span>
            `;
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
    const firstPlayer = data.room.players[0].name === _app.playerName;
    const roomGridSize = data.room.gridSize;
    
    _app.room = data.room;
    _app.shipList = data.yourShips;
    _app.isYourTurn = data.isYourTurn;
    _app.player = data.room.players[firstPlayer ? 0 : 1];
    _app.enemy = data.room.players[firstPlayer ? 1 : 0];
    _app.gameReady = _app.player?.ready && _app.enemy?.ready;

    if (roomGridSize != _app.gridSize) {
        _app.gridSize = roomGridSize;
        document.documentElement.style.setProperty('--grid-size', _app.gridSize);
        _app.drawGrid(_app.localGameBoard, _app.gridSize);
        _app.drawGrid(_app.remoteGameBoard, _app.gridSize);
    }
    
    _app.remoteGameBoard.classList.toggle("disabled", !_app.gameReady || !_app.isYourTurn);
    
    _app.newShipCursor(nextShip.width, nextShip.height);
    _app.drawShips();
    _app.drawEnemyShots();
    _app.drawPlayerShots();
    _app.updateStatusDisplay();

    if (data.room.gameOver) {
        _app.leave();
    }
}

_app.wsClient_messageHandler = (event) => {
    const messageData = JSON.parse(event.data);

    switch (messageData.type) {
        case "game-over":
            _app.gameOver(messageData.winner);
            break;
        case "room-created":
            _app.join(messageData.roomId);
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