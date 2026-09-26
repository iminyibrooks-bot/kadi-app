
// Dynamic win-condition & anti-deadlock evaluator for Kadi
function evaluateGameWinState(gameState) {
    for (let player of gameState.players) {
        if (player.hand.length === 0) {
            return {
                winner: player.name,
                status: 'VICTORY',
                message: `${player.name} cleared all cards and won the game!`
            };
        }
    }
    if (gameState.deck.length === 0 && gameState.penaltyStack === 0) {
        const sorted = [...gameState.players].sort((a, b) => a.hand.length - b.hand.length);
        return {
            winner: sorted[0].name,
            status: 'VICTORY_BY_LOWEST_CARDS',
            message: `Deck exhausted! ${sorted[0].name} wins with the fewest cards remaining.`
        };
    }
    return { winner: null, status: 'ONGOING' };
}

// Updated Kadi Street Rules Evaluator (Finishing Rules & Cardless Lockout)
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
                player.isCardless = true; // Set Cardless state
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

    // 3. Deck Exhaustion Fallback (Q & 8 Treated as Equal Value)
    if (gameState.deck.length === 0 && gameState.penaltyStack === 0) {
        // Equal evaluation logic where Q and 8 share exact value weight
        const getCardWeight = (card) => {
            if (card.rank === 'Q' || card.rank === '8') return 8; // Equal weight
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
