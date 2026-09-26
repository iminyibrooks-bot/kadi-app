const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Kadi Street Rules Win-Condition Evaluator
function evaluateGameWinState(gameState) {
    const ACTION_CARDS = ['A', 'J', '2', '3', 'K'];

    // 1. Check for any Cardless Players
    const hasCardlessPlayer = gameState.players.some(p => p.isCardless === true);

    // If anyone is cardless, nobody can win yet
    if (hasCardlessPlayer) {
        return { winner: null, status: 'LOCKED_CARDLESS_IN_PLAY' };
    }

    // 2. Evaluate Hand Clear Victory
    for (let player of gameState.players) {
        if (player.hand.length === 0) {
            const lastCardPlayed = player.lastPlayedCard ? player.lastPlayedCard.rank : null;

            // Illegal Finish Check: If last card was an Action Card (A, J, 2, 3, K)
            if (lastCardPlayed && ACTION_CARDS.includes(lastCardPlayed)) {
                player.isCardless = true;
                return { 
                    winner: null, 
                    status: 'ILLEGAL_FINISH_CARDLESS',
                    message: `${player.name} played an Action Card (${lastCardPlayed}) as last card and is now CARDLESS!`
                };
            }

            // Legal Finish
            return {
                winner: player.name,
                status: 'VICTORY',
                message: `${player.name} finished legally with a standard card!`
            };
        }
    }

    // 3. Deck Exhaustion Fallback (Q & 8 Equal Value)
    if (gameState.deck.length === 0 && gameState.penaltyStack === 0) {
        const getCardWeight = (card) => {
            if (card.rank === 'Q' || card.rank === '8') return 8; // Q and 8 are equal rank/points
            return parseInt(card.rank) || 10;
        };

        const scorePlayer = (p) => p.hand.reduce((sum, c) => sum + getCardWeight(c), 0);
        const sorted = [...gameState.players].sort((a, b) => scorePlayer(a) - scorePlayer(b));

        return {
            winner: sorted[0].name,
            status: 'VICTORY_BY_POINTS',
            message: `Deck exhausted! ${sorted[0].name} wins on lowest point total.`
        };
    }

    return { winner: null, status: 'ONGOING' };
}

// Socket.io Real-time Handlers & Social Declaration Relays
io.on('connection', (socket) => {
    console.log(`[Kadi Engine] Client connected: ${socket.id}`);

    socket.on('join_room', ({ roomId, username }) => {
        socket.join(roomId);
        io.to(roomId).emit('room_notice', `${username} joined the Kadi table.`);
    });

    // Broadcast "Niko Kadi" to all clients in the room
    socket.on('declare_niko_kadi', ({ roomId, username }) => {
        io.to(roomId).emit('player_declared_niko_kadi', {
            username,
            timestamp: new Date().toLocaleTimeString(),
            message: `⚠️ ${username} HAS DECLARED NIKO KADI! (1 Card Remaining)`
        });
    });

    // Broadcast "Mshike" challenge to all clients in the room
    socket.on('trigger_mshike', ({ roomId, challenger, targetPlayer }) => {
        io.to(roomId).emit('mshike_challenged', {
            challenger,
            targetPlayer,
            timestamp: new Date().toLocaleTimeString(),
            message: `🚨 ${challenger} CALLED MSHIKE ON ${targetPlayer}! Draw 2 cards penalty applied.`
        });
    });

    socket.on('disconnect', () => {
        console.log(`[Kadi Engine] Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`[Kadi Engine Core] Running on port ${PORT}`);
});
